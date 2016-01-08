var Prims = function () {};

Prims.tinterval = 1;
Prims.hopList = [-48, -30, -22, -14, -6, 0, 6, 14, 22, 30, 48];
Prims.soundTime = undefined;
Prims.time = 0;

Prims.init = function () {
    Prims.table = {};
    Prims.table.done = Prims.Done;
    Prims.table.missing = Prims.Ignore;
    Prims.table.onflag = Prims.Ignore;
    Prims.table.onmessage = Prims.Ignore;
    Prims.table.onclick = Prims.Ignore;
    Prims.table.ontouch = Prims.OnTouch;
    Prims.table.onchat = Prims.Ignore;
    Prims.table.repeat = Prims.Repeat;
    Prims.table.forward = Prims.Forward;
    Prims.table.back = Prims.Back;
    Prims.table.up = Prims.Up;
    Prims.table.down = Prims.Down;
    Prims.table.left = Prims.Left;
    Prims.table.right = Prims.Right;
    Prims.table.home = Prims.Home;
    Prims.table.setspeed = Prims.SetSpeed;
    Prims.table.message = Prims.Message;
    Prims.table.setcolor = Prims.SetColor;
    Prims.table.bigger = Prims.Bigger;
    Prims.table.smaller = Prims.Smaller;
    Prims.table.wait = Prims.Wait;
    Prims.table.caretcmd = Prims.Ignore;
    Prims.table.caretstart = Prims.Ignore;
    Prims.table.caretend = Prims.Ignore;
    Prims.table.caretrepeat = Prims.Ignore;
    Prims.table.gotopage = Prims.GotoPage;
    Prims.table.endstack = Prims.DoNextBlock;
    Prims.table.stopall = Prims.StopAll;
    Prims.table.stopmine = Prims.StopMine;
    Prims.table.forever = Prims.Forever;
    Prims.table.hop = Prims.Hop;
    Prims.table.show = Prims.Show;
    Prims.table.hide = Prims.Hide;
    Prims.table.playsnd = Prims.playSound;
    Prims.table.playusersnd = Prims.playSound;
    Prims.table.grow = Prims.Grow;
    Prims.table.shrink = Prims.Shrink;
    Prims.table.same = Prims.Same;
    Prims.table.say = Prims.Say;
};

Prims.Done = function (strip) {
    if (strip.oldblock != null) {
        strip.oldblock.unhighlight();
    }
    strip.oldblock = null;
    strip.isRunning = false;
};

Prims.setTime = function (strip) {
    strip.time = (new Date()) - 0;
};

Prims.showTime = function () {
    //var time = ((new Date()) - strip.time) / 1000;
    // 	ScratchJr.log (strip.thisblock.blocktype, time, "sec") ;
};

Prims.DoNextBlock = function (strip) {
    strip.waitTimer = Prims.tinterval * 10;
    strip.thisblock = strip.thisblock.next;
};

Prims.StopAll = function () {
    ScratchJr.stopStrips();
};

Prims.StopMine = function (strip) {
    var spr = strip.spr;
    for (var i = 0; i < ScratchJr.runtime.threadsRunning.length; i++) {
        if ((ScratchJr.runtime.threadsRunning[i].spr == spr)
             && (ScratchJr.runtime.threadsRunning[i].thisblock != strip.thisblock)) {
            ScratchJr.runtime.threadsRunning[i].stop(true);
        }
    }
    strip.thisblock = strip.thisblock.next;
    ScratchJr.runtime.yield = true;
};

Prims.playSound = function (strip) {
    var b = strip.thisblock;
    var name = b.getSoundName(strip.spr.sounds);
    //	console.log ('playSound', name);
    if (!strip.audio) {
        var snd = ScratchAudio.projectSounds[name];
        if (!snd) {
            strip.thisblock = strip.thisblock.next;
            return;
        }
        strip.audio = snd;
        snd.play();
    //	console.log ("playSound", snd, strip.audio, snd.source.playbackState);
    }
    if (strip.audio && strip.audio.done()) {
        strip.audio.clear();
        strip.thisblock = strip.thisblock.next;
        strip.audio = undefined;
    }
    strip.waitTimer = Prims.tinterval * 4;
};

Prims.Say = function (strip) {
    var b = strip.thisblock;
    var s = strip.spr;
    var str = b.getArgValue();
    if (strip.count < 0) {
        strip.count = Math.max(30, Math.round(str.length / 8) * 30); // 7 chars per seconds;
        s.openBalloon(str);
        Prims.setTime(strip);
    } else {
        var count = strip.count;
        count--;
        if (count < 0) {
            strip.count = -1;
            s.closeBalloon();
            Prims.showTime(strip);
            strip.thisblock = strip.thisblock.next;
        } else {
            strip.waitTimer = Prims.tinterval;
            strip.count = count;
        }
    }
};

Prims.GotoPage = function (strip) {
    var b = strip.thisblock;
    var n = Number(b.getArgValue());
    if (strip.count < 0) {
        strip.count = 2; // delay for a 10th of a second
        Prims.setTime(strip);
    } else {
        var count = strip.count;
        count--;
        if (count < 0) {
            strip.count = -1;
            Prims.showTime(strip);
            ScratchJr.stage.gotoPage(n);
        } else {
            strip.waitTimer = Prims.tinterval;
            strip.count = count;
        }
    }
};

Prims.Forever = function (strip) {
    strip.thisblock = strip.firstBlock.aStart ? strip.firstBlock.next : strip.firstBlock;
    ScratchJr.runtime.yield = true;
};

Prims.Repeat = function (strip) {
    var b = strip.thisblock;
    var n = Number(b.getArgValue());
    if (n < 1) {
        n = 1;
    }
    if (b.repeatCounter < 0) {
        b.repeatCounter = n;
    }
    if (b.repeatCounter == 0) {
        b.repeatCounter = -1;
        strip.thisblock = strip.thisblock.next;
        strip.waitTimer = Prims.tinterval;
    } else {
        strip.stack.push(strip.thisblock);
        b.repeatCounter--;
        strip.thisblock = strip.thisblock.inside;
        ScratchJr.runtime.yield = true;
    }
};

Prims.Ignore = function (strip) {
    strip.thisblock = strip.thisblock.next;
};

Prims.Wait = function (strip) {
    var n = strip.thisblock.getArgValue();
    strip.waitTimer = Math.round(n * 3.125); // thenth of a second
    Prims.setTime(strip);
    strip.thisblock = strip.thisblock.next;
};

Prims.Home = function (strip) {
    var spr = strip.spr;
    spr.goHome();
    strip.waitTimer = Prims.tinterval;
    strip.thisblock = strip.thisblock.next;
};

Prims.SetSpeed = function (strip) {
    var s = strip.spr;
    var num = Number(strip.thisblock.getArgValue()); // 0 - 1 - 2
    s.speed = Math.pow(2, num);
    strip.waitTimer = Prims.tinterval;
    strip.thisblock = strip.thisblock.next;
};

Prims.Hop = function (strip) {
    if (strip.count < 0) { // setup the hop
        strip.count = Prims.hopList.length;
        Prims.setTime(strip);
    }
    Prims.hopTo(strip);
};

Prims.hopTo = function (strip) {
    var s = strip.spr;
    var b = strip.thisblock;
    var n = Number(b.getArgValue());
    var count = strip.count;
    count--;
    if (count < 0) {
        strip.count = -1;
        strip.vector = {
            x: 0,
            y: 0
        };
        Prims.showTime(strip);
        strip.thisblock = strip.thisblock.next;
    } else {
        strip.vector = {
            x: 0,
            y: Prims.hopList[count]
        };
        var dy = s.ycoor - strip.vector.y / 5 * n;
        if (dy < 0) {
            dy = 0;
        }
        if (dy >= (360 - Grid.size)) {
            dy = (360 - Grid.size);
        }
        s.setPos(s.xcoor + strip.vector.x, dy);
        strip.waitTimer = Prims.tinterval + Math.floor(Math.pow(2, 2 - Math.floor(s.speed / 2)) / 2);
        strip.count = count;
    }
};

Prims.Down = function (strip) {
    var num = Number(strip.thisblock.getArgValue()) * 24;
    var distance = Math.abs(num);
    if (num == 0) {
        strip.thisblock = strip.thisblock.next;
        strip.waitTimer = Prims.tinterval;
        strip.distance = -1;
        strip.vector = {
            x: 0,
            y: 0
        };
        return;
    }
    if (num == 0) {
        strip.distance = 0;
    } else if (strip.distance < 0) {
        strip.distance = distance;
        strip.vector = {
            x: 0,
            y: 2
        };
        Prims.setTime(strip);
    }
    Prims.moveAtSpeed(strip);
};

Prims.Up = function (strip) {
    var num = Number(strip.thisblock.getArgValue()) * 24;
    var distance = Math.abs(num);
    if (num == 0) {
        strip.thisblock = strip.thisblock.next;
        strip.waitTimer = Prims.tinterval;
        strip.distance = -1;
        strip.vector = {
            x: 0,
            y: 0
        };
        return;
    } else if (strip.distance < 0) {
        strip.distance = distance;
        strip.vector = {
            x: 0,
            y: -2
        };
        Prims.setTime(strip);
    }
    Prims.moveAtSpeed(strip);
};

Prims.Forward = function (strip) {
    var s = strip.spr;
    var num = Number(strip.thisblock.getArgValue()) * 24;
    var distance = Math.abs(num);
    if (s.flip) {
        s.flip = false;
        s.render();
    }
    if (num == 0) {
        strip.thisblock = strip.thisblock.next;
        strip.waitTimer = Prims.tinterval * Math.pow(2, 2 - Math.floor(s.speed / 2));
        strip.vector = {
            x: 0,
            y: 0
        };
        strip.distance = -1;
        return;
    } else if (strip.distance < 0) {
        strip.distance = distance;
        strip.vector = {
            x: 2,
            y: 0
        };
        Prims.setTime(strip);
    }
    Prims.moveAtSpeed(strip);
};

Prims.Back = function (strip) {
    var s = strip.spr;
    var num = Number(strip.thisblock.getArgValue()) * 24;
    var distance = Math.abs(num);
    if (!s.flip) {
        s.flip = true;
        s.render();
    }
    if (num == 0) {
        strip.thisblock = strip.thisblock.next;
        strip.vector = {
            x: 0,
            y: 0
        };
        strip.waitTimer = Prims.tinterval * Math.pow(2, 2 - Math.floor(s.speed / 2));
        return;
    }
    if (num == 0) {
        strip.distance = 0;
    } else if (strip.distance < 0) {
        strip.distance = distance;
        strip.vector = {
            x: -2,
            y: 0
        };
        Prims.setTime(strip);
    }
    Prims.moveAtSpeed(strip);
};

Prims.moveAtSpeed = function (strip) {
    var s = strip.spr;
    var distance = strip.distance;
    var num = Number(strip.thisblock.getArgValue()) * 12; // 1/2 cell size since vector is double
    var vector = Vector.scale(strip.vector, s.speed * Math.abs(num) / num);
    distance -= Math.abs(Vector.len(vector));
    if (distance < 0) {
        vector = Vector.scale(strip.vector, strip.distance);
        s.setPos(s.xcoor + vector.x, s.ycoor + vector.y);
        strip.distance = -1;
        strip.vector = {
            x: 0,
            y: 0
        };
        Prims.showTime(strip);
        strip.thisblock = strip.thisblock.next;
    } else {
        s.setPos(s.xcoor + vector.x, s.ycoor + vector.y);
        strip.waitTimer = Prims.tinterval;
        strip.distance = distance;
    }
};

Prims.Right = function (strip) {
    var s = strip.spr;
    var num = Number(strip.thisblock.getArgValue()) * 30;
    if (strip.count < 0) {
        strip.count = Math.floor(Math.abs(num) / s.speed * 0.25);
        strip.angleStep = s.speed * 4 * Math.abs(num) / num;
        strip.finalAngle = s.angle + num;
        strip.finalAngle = strip.finalAngle % 360;
        if (strip.finalAngle < 0) {
            strip.finalAngle += 360;
        }
        if (strip.finalAngle > 360) {
            strip.finalAngle -= 360;
        }
        Prims.setTime(strip);
    }
    Prims.turning(strip);
};

Prims.Left = function (strip) {
    var s = strip.spr;
    var num = Number(strip.thisblock.getArgValue()) * 30;
    if (strip.count < 0) {
        strip.count = Math.floor(Math.abs(num) / s.speed * 0.25);
        strip.angleStep = -s.speed * 4 * Math.abs(num) / num;
        strip.finalAngle = s.angle - num;
        strip.finalAngle = strip.finalAngle % 360;
        if (strip.finalAngle < 0) {
            strip.finalAngle += 360;
        }
        if (strip.finalAngle > 360) {
            strip.finalAngle -= 360;
        }
        Prims.setTime(strip);
    }
    Prims.turning(strip);
};

Prims.turning = function (strip) {
    var s = strip.spr;
    var count = strip.count;
    count--;
    if (count < 0) {
        strip.count = -1;
        s.setHeading(strip.finalAngle);
        Prims.showTime(strip);
        strip.thisblock = strip.thisblock.next;
    } else {
        s.setHeading(s.angle + strip.angleStep);
        strip.waitTimer = Prims.tinterval;
        strip.count = count;
    }
};

Prims.Same = function (strip) {
    var s = strip.spr;
    var n = (s.defaultScale - s.scale) / s.defaultScale * 10;
    if (n == 0) {
        strip.waitTimer = Prims.tinterval;
        strip.thisblock = strip.thisblock.next;
        strip.count = -1;
        strip.distance = -1;
        if (!strip.firstBlock.aStart) {
            s.homescale = s.defaultScale;
        }
        return;
    }
    if (strip.count < 0) {
        strip.distance = s.defaultScale * Math.abs(n) / n * s.speed;
        strip.count = Math.floor(5 * Math.floor(Math.abs(n)) / s.speed);
        Prims.setTime(strip);
        if (!strip.firstBlock.aStart) {
            s.homescale = s.defaultScale;
        }
    }
    if (strip.count == 0) {
        strip.count = -1;
        s.noScaleFor();
        strip.distance = -1;
        Prims.showTime(strip);
        strip.thisblock = strip.thisblock.next;
    } else {
        s.changeSizeBy(strip.distance * 2);
        strip.waitTimer = Prims.tinterval;
        strip.count = strip.count - 1;
    }
};

Prims.Grow = function (strip) {
    var s = strip.spr;
    var n = Number(strip.thisblock.getArgValue());
    if (strip.count < 0) {
        strip.distance = Number(s.scale) + (10 * n * s.defaultScale) / 100;
        strip.distance = Math.round(strip.distance * 1000) / 1000;
        strip.count = Math.floor(5 * Math.abs(n) / s.speed);
        Prims.setTime(strip);
    }
    if (strip.count == 0) {
        strip.count = -1;
        s.setScaleTo(strip.distance);
        if (!strip.firstBlock.aStart) {
            s.homescale = s.scale;
        }
        strip.distance = -1;
        Prims.showTime(strip);
        strip.thisblock = strip.thisblock.next;
    } else {
        s.changeSizeBy(s.defaultScale * 2 * s.speed * Math.abs(n) / n);
        strip.waitTimer = Prims.tinterval;
        strip.count = strip.count - 1;
    }
};

Prims.Shrink = function (strip) {
    var s = strip.spr;
    var n = Number(strip.thisblock.getArgValue());
    if (strip.count < 0) {
        strip.distance = s.scale - (10 * n * s.defaultScale) / 100;
        strip.distance = Math.round(strip.distance * 1000) / 1000;
        strip.count = Math.floor(5 * Math.abs(n) / s.speed);
        Prims.setTime(strip);
    }
    if (strip.count == 0) {
        strip.count = -1;
        s.setScaleTo(strip.distance);
        if (!strip.firstBlock.aStart) {
            s.homescale = s.scale;
        }
        strip.distance = -1;
        Prims.showTime(strip);
        strip.thisblock = strip.thisblock.next;
    } else {
        s.changeSizeBy(-s.defaultScale * 2 * s.speed * Math.abs(n) / n);
        strip.waitTimer = Prims.tinterval;
        strip.count = strip.count - 1;
    }
};

Prims.Show = function (strip) {
    var s = strip.spr;
    s.shown = true;
    if (strip.count < 0) {
        strip.count = s.speed == 4 ? 0 : Math.floor(15 / s.speed);
        Prims.setTime(strip);
    }
    if (strip.count == 0) {
        strip.count = -1;
        s.div.style.opacity = 1;
        Prims.showTime(strip);
        strip.thisblock = strip.thisblock.next;
        if (!strip.firstBlock.aStart) {
            s.homeshown = true;
        }
    } else {
        s.div.style.opacity = Math.min(1, Number(s.div.style.opacity) + (s.speed / 15));
        strip.waitTimer = Prims.tinterval * 2;
        strip.count = strip.count - 1;
    }
};

Prims.Hide = function (strip) { // same
    var s = strip.spr;
    s.shown = false;
    if (strip.count < 0) {
        strip.count = s.speed == 4 ? 0 : Math.floor(15 / s.speed);
        Prims.setTime(strip);
    }
    if (strip.count == 0) {
        strip.count = -1;
        s.div.style.opacity = 0;
        Prims.showTime(strip);
        strip.thisblock = strip.thisblock.next;
        if (!strip.firstBlock.aStart) {
            s.homeshown = false;
        }
    } else {
        s.div.style.opacity = Math.max(0, Number(s.div.style.opacity) - (s.speed / 15));
        strip.waitTimer = Prims.tinterval * 2;
        strip.count = strip.count - 1;
    }
};

Prims.OnTouch = function (strip) {
    var s = strip.spr;
    if (s.touchingAny()) {
        strip.stack.push(strip.firstBlock);
        strip.thisblock = strip.thisblock.next;
    }
    strip.waitTimer = Prims.tinterval;
};

Prims.Message = function (strip) {
    var b = strip.thisblock;
    var pair;
    if (strip.firstTime) {
        var receivers = [];
        var msg = b.getArgValue();
        var findReceivers = function (block, s) {
            if ((block.blocktype == 'onmessage') && (block.getArgValue() == msg)) {
                receivers.push([s, block]);
            }
        };
        Prims.applyToAllStrips(['onmessage'], findReceivers);
        var newthreads = [];
        for (var i in receivers) {
            pair = receivers[i];
            newthreads.push(ScratchJr.runtime.restartThread(pair[0], pair[1], true));
        }
        strip.firstTime = false;
        strip.called = newthreads;
    }

    // after first time
    var done = true;
    for (var j = 0; j < strip.called.length; j++) {
        if (strip.called[j].isRunning) {
            done = false;
        }
    }

    if (done) {
        strip.called = null;
        strip.firstTime = true;
        strip.thisblock = strip.thisblock.next;
        strip.waitTimer = Prims.tinterval * 2;
    } else {
        ScratchJr.runtime.yield = true;
    }
};

Prims.applyToAllStrips = function (list, fcn) {
    if (!ScratchJr.stage) {
        return;
    }
    var page = ScratchJr.stage.currentPage;
    if (!page) {
        return;
    }
    if (!page.div) {
        return;
    }
    for (var i = 0; i < page.div.childElementCount; i++) {
        var spr = page.div.childNodes[i].owner;
        if (!spr) {
            continue;
        }
        var sc = gn(spr.id + '_scripts');
        if (!sc) {
            continue;
        }
        var topblocks = sc.owner.getBlocksType(list);
        for (var j = 0; j < topblocks.length; j++) {
            fcn(topblocks[j], spr);
        }
    }
};
