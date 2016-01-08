///////////////////////////////////
//  Blocks Categories Palettes
///////////////////////////////////

Palette = function () {};

Palette.blockscale = 0.75;
Palette.numcat = 0;
Palette.betweenblocks = undefined; // Set in setup()
Palette.blockdy = 5;
Palette.timeoutid = undefined;
Palette.helpballoon = undefined;
Palette.dxblocks = 10;
Palette.currentCategory;

Palette.setup = function (parent) {
    Palette.blockscale *= scaleMultiplier;
    Palette.blockdy *= scaleMultiplier;
    Palette.blockdx *= scaleMultiplier;
    Palette.betweenblocks = 90 * Palette.blockscale;
    Palette.createCategorySelectors(parent);
    var div = newHTML('div', 'palette', parent);
    div.setAttribute('id', 'palette');
    div.ontouchstart = function (evt) {
        Palette.paletteMouseDown(evt);
    };
    var pc = newHTML('div', 'papercut', parent);
    newHTML('div', 'withstyle', pc);
};

Palette.createCategorySelectors = function (parent) {
    var sel = newHTML('div', 'categoryselector', parent);
    sel.setAttribute('id', 'selectors');
    var bkg = newHTML('div', 'catbkg', sel);
    newHTML('div', 'catimage', bkg);
    var leftPx = 15 * scaleMultiplier;
    var widthPx = 54 * scaleMultiplier;
    for (var i = 0; i < BlockSpecs.categories.length; i++) {
        Palette.createSelector(sel, i, leftPx + i * widthPx, 0, BlockSpecs.categories[i]);
    }
};

Palette.paletteMouseDown = function (e) {
    if (isTablet && e.touches && (e.touches.length > 1)) {
        return;
    }
    if (ScratchJr.onHold) {
        return;
    }
    e.preventDefault();
    ScratchJr.blur();
    var pal = gn('palette');
    var spt = Events.getTargetPoint(e);
    var pt = {
        x: localx(pal, spt.x),
        y: localy(pal, spt.y)
    };
    for (var i = 0; i < pal.childElementCount; i++) {
        var ths = pal.childNodes[i];
        if (!hitRect(ths, pt)) {
            continue;
        }
        if (ScratchJr.shaking && (ScratchJr.shaking == ths)) {
            Palette.removeSound(ths);
        } else {
            Events.startDrag(e, ths, Palette.prepareForDrag,
                Palette.dropBlockFromPalette, ScriptsPane.draggingBlock, Palette.showHelp, Palette.startShaking);
        }
    }
    ScratchJr.clearSelection();
};

Palette.isRecorded = function (ths) {
    var val = ths.owner.getArgValue();
    var list = ScratchJr.getActiveScript().owner.spr.sounds;
    return list.indexOf(val) > 0;
};

Palette.removeSound = function (ths) {
    ScratchAudio.sndFX('cut.wav');
    var indx = ths.owner.getArgValue();
    var spr = ScratchJr.getSprite();
    if (!spr) {
        return;
    }
    var page = spr.div.parentNode.owner;
    var sounds = spr.sounds.concat();
    if (indx >= sounds.length) {
        return;
    }
    sounds.splice(indx, 1);
    spr.sounds = sounds;
    // recreate the sprite scripts to make sure deleted sound is properly treated
    var sprdata = spr.getData();
    var div = gn(spr.id + '_scripts');
    while (div.childElementCount > 0) {
        div.removeChild(div.childNodes[0]);
    }
    var sc = div.owner;
    var list = sprdata.scripts;
    for (var j = 0; j < list.length; j++) {
        sc.recreateStrip(list[j]);
    }
    Undo.record({
        action: 'deletesound',
        who: spr.id,
        where: page.id,
        sound: name
    });
    ScratchJr.storyStart('Palette.removeSound'); // Record a change for sample projects in story-starter mode

    Palette.selectCategory(3);
};

Palette.showHelp = function (e, b) {
    var block = b.owner;
    var help = BlockSpecs.blockDesc(block, ScratchJr.getSprite());
    var str = help[block.blocktype];
    if (!str) {
        return;
    }
    Palette.openPaletteBalloon(b, str);
    Palette.timeoutid = setTimeout(Palette.closeHelpBalloon, 2000);
};

Palette.startShaking = function (b) {
    if (!b.owner) {
        return;
    }
    if (b.owner.blocktype != 'playusersnd') {
        Palette.showHelp(null, b); return;
    }
    ScratchJr.shaking = b;
    ScratchJr.stopShaking = Palette.stopShaking;
    b.setAttribute('class', 'shakeme');
    newHTML('div', 'deletesound', b);
};

Palette.clickBlock = function (e, b) {
    if (ScratchJr.shaking && (b == ScratchJr.shaking)) {
        Palette.removeSound(b);
    } else {
        ScratchJr.clearSelection();
        Palette.showHelp(e, b);
    }
};

Palette.stopShaking = function (b) {
    if (!b.owner) {
        return;
    }
    ScratchJr.shaking = undefined;
    ScratchJr.stopShaking = undefined;
    b.setAttribute('class', '');
    var ic = b.childNodes[b.childElementCount - 1];
    if (ic.getAttribute('class') == 'deletesound') {
        b.removeChild(ic);
    }
};

Palette.openPaletteBalloon = function (obj, label) {
    if (Palette.helpballoon) {
        Palette.closeHelpBalloon();
    }
    var fontSize = Math.floor(14 * window.devicePixelRatio * scaleMultiplier);
    var w = window.devicePixelRatio * 80 * scaleMultiplier;
    var h = window.devicePixelRatio * 36 * scaleMultiplier;
    var dy = globaly(obj) - 36 * scaleMultiplier;
    Palette.helpballoon = newCanvas(frame, 0, dy, w, h, {
        position: 'absolute',
        zIndex: 1000
    });
    Palette.helpballoon.icon = obj;
    var ctx = Palette.helpballoon.getContext('2d');
    w = 16 * window.devicePixelRatio * scaleMultiplier +
        getStringSize(ctx, 'bold ' + fontSize + 'px ' + Settings.paletteBalloonFont, label).width;
    if (w < 36 * scaleMultiplier) {
        w = 36 * scaleMultiplier;
    }
    var dx = (globalx(obj) + (obj.offsetWidth / 2)) * window.devicePixelRatio - (w / 2);
    setCanvasSize(Palette.helpballoon, w, h);
    setProps(Palette.helpballoon.style, {
        position: 'absolute',
        webkitTransform: 'translate(' + (-w / 2) + 'px, ' + (-h / 2) + 'px) ' +
            'scale(' + (1 / window.devicePixelRatio) + ') translate(' + (dx + (w / 2)) + 'px, ' + (h / 2) + 'px)'
    });
    Palette.drawBalloon(Palette.helpballoon.getContext('2d'), w, h);
    writeText(ctx, 'bold ' + fontSize + 'px ' + Settings.paletteBalloonFont, 'white', label,
        21 * window.devicePixelRatio * scaleMultiplier, 8 * window.devicePixelRatio * scaleMultiplier);
};

Palette.hide = function () {
    gn('blockspalette').childNodes[0].style.display = 'none';
    gn('blockspalette').childNodes[1].style.display = 'none';
};

Palette.show = function () {
    gn('blockspalette').childNodes[0].style.display = 'inline-block';
    gn('blockspalette').childNodes[1].style.display = 'inline-block';
};


Palette.closeHelpBalloon = function () {
    if (Palette.timeoutid) {
        clearTimeout(Palette.timeoutid);
    }
    if (Palette.helpballoon) {
        Palette.helpballoon.parentNode.removeChild(Palette.helpballoon);
    }
    Palette.helpballoon = undefined;
    Palette.timeoutid = undefined;
};

Palette.drawBalloon = function (ctx, w, h) {
    var curve = 4;
    var path = new Array(['M', 0, curve], ['q', 0, -curve, curve, -curve], ['h', w - curve * 2],
        ['q', curve, 0, curve, curve], ['v', h - 11 - curve * 2], ['q', 0, curve, -curve, curve],
        ['h', -(w / 2) + curve + 11], ['l', -11, 11], ['l', -11, -11], ['h', -(w / 2) + curve + 11],
        ['q', -curve, 0, -curve, -curve], ['z']
    );
    ctx.clearRect(0, 0, Math.max(ctx.canvas.width, w), Math.max(ctx.canvas.height, h));
    ctx.fillStyle = '#4682B5';
    ctx.lineWidth = 2;
    //ctx.strokeStyle = 'rgba(242,243,242,0.4)';
    ctx.beginPath();
    DrawPath.render(ctx, path);
    ctx.fill();
//  ctx.stroke();
};

Palette.prepareForDrag = function (e) {
    e.preventDefault();
    ScratchAudio.sndFX('grab.wav');
    if (!ScratchJr.runtime.inactive()) {
        ScratchJr.stopStrips();
    }
    var sc = ScratchJr.getActiveScript().owner;
    sc.flowCaret = null;
    var pt = Events.getTargetPoint(e);
    Events.dragmousex = pt.x;
    Events.dragmousey = pt.y;
    if (!Events.dragthumbnail.parentNode) { // palette has been removed programatically
        Events.dragthumbnail = Palette.getBlockNamed(Events.dragthumbnail.owner.blocktype);
        if (!Events.dragthumbnail) {
            Events.cancelAll();
            return;
        }
    }
    var mx = Events.dragmousex - frame.offsetLeft - localx(Events.dragthumbnail, Events.dragmousex);
    var my = Events.dragmousey - frame.offsetTop - localy(Events.dragthumbnail, Events.dragmousey);
    Events.dragcanvas = Events.dragthumbnail.owner.duplicateBlock(mx, my, sc.spr).div;
    Events.dragcanvas.style.zIndex = ScratchJr.dragginLayer;
    Events.dragDiv.appendChild(Events.dragcanvas);
    // Events.dragcanvas.owner.lift();
    sc.dragList = [Events.dragcanvas.owner];
    sc.prepareCaret(Events.dragcanvas.owner);
};

Palette.getBlockNamed = function (str) {
    var pal = gn('palette');
    for (var i = 0; i < pal.childElementCount; i++) {
        if (pal.childNodes[i].owner.blocktype == str) {
            return pal.childNodes[i];
        }
    }
    return null;
};

Palette.createSelector = function (parent, n, dx, dy, spec) {
    var pxWidth = 51 * scaleMultiplier;
    var pxHeight = 57 * scaleMultiplier;
    var div = newDiv(parent, dx, dy, pxWidth, pxHeight, {
        position: 'absolute'
    });
    div.index = n;
    var officon = spec[1].cloneNode(true);
    officon.width = pxWidth;
    officon.height = pxHeight;
    div.appendChild(officon);
    setProps(officon.style, {
        position: 'absolute',
        zIndex: 6,
        visibility: 'visible'
    });
    var onicon = spec[0].cloneNode(true);
    onicon.width = pxWidth;
    onicon.height = pxHeight;
    div.appendChild(onicon);
    div.bkg = spec[2];
    setProps(onicon.style, {
        position: 'absolute',
        zIndex: 8,
        visibility: 'hidden'
    });
    div.ontouchstart = function (evt) {
        Palette.clickOnCategory(evt);
    };
};

Palette.getPaletteSize = function () {
    var first = gn('palette').childNodes[0];
    var last = gn('palette').childNodes[gn('palette').childElementCount - 1];
    return last.offsetLeft + last.offsetWidth - first.offsetLeft;
};

Palette.clickOnCategory = function (e) {
    if (!e) {
        return;
    }
    e.preventDefault();
    ScratchJr.unfocus(e);
    var t = e.target;
    ScratchAudio.sndFX('keydown.wav');
    var index = t.parentNode ? t.parentNode.index : 2;
    Palette.selectCategory(index);
};

Palette.selectCategory = function (n) {
    Palette.currentCategory = n;
    var div = gn('selectors');
    // set the icons for text or sprite
    Palette.numcat = n;
    var currentSel = div.childNodes[n + 1];
    for (var i = 1; i < div.childElementCount; i++) {
        var sel = div.childNodes[i];
        sel.childNodes[0].style.visibility = (sel.index != n) ? 'visible' : 'hidden';
        sel.childNodes[1].style.visibility = (sel.index == n) ? 'visible' : 'hidden';
    }
    var pal = gn('palette');
    gn('blockspalette').style.background = currentSel.bkg;
    while (pal.childElementCount > 0) {
        pal.removeChild(pal.childNodes[0]);
    }
    if (!ScratchJr.getSprite()) {
        return;
    }
    var list = (BlockSpecs.palettes[n]).concat();
    var dx = Palette.dxblocks;
    for (var k = 0; k < list.length; k++) {
        if (list[k] == 'space') {
            dx += 30 * Palette.blockscale;
        } else {
            var newb = Palette.newScaledBlock(pal, list[k],
                ((list[k] == 'repeat') ? 0.65 * scaleMultiplier : Palette.blockscale), dx, Palette.blockdy);
            newb.lift();
            dx += Palette.betweenblocks;
        }
    }
    dx += 30;
    if ((n == (BlockSpecs.categories.length - 1)) && (ScratchJr.stage.pages.length > 1)) {
        Palette.addPagesBlocks(dx);
    }
    if ((n == 3) && (ScratchJr.getSprite().sounds.length > 0)) {
        Palette.addSoundsBlocks(Palette.dxblocks);
    }
};

Palette.reset = function () {
    if (Palette.numcat == (BlockSpecs.categories.length - 1)) {
        Palette.selectCategory(BlockSpecs.categories.length - 1);
    }
    if (Palette.numcat == 3) {
        Palette.selectCategory(3);
    }
};

Palette.showSelectors = function (b) {
    var n = Palette.numcat;
    var div = gn('selectors');
    for (var i = 0; i < div.childElementCount; i++) {
        var sel = div.childNodes[i];
        sel.childNodes[0].style.visibility = (sel.index != n) && b ? 'visible' : 'hidden';
        sel.childNodes[1].style.visibility = (sel.index == n) && b ? 'visible' : 'hidden';
        sel.childNodes[2].style.visibility = (sel.index != n) && b ? 'visible' : 'hidden';
        sel.childNodes[3].style.visibility = (sel.index == n) && b ? 'visible' : 'hidden';
    }
};

Palette.addPagesBlocks = function (dx) {
    var pal = gn('palette');
    var spec = BlockSpecs.defs.gotopage;
    for (var i = 0; i < ScratchJr.stage.pages.length; i++) {
        if (ScratchJr.stage.pages[i].id == ScratchJr.stage.currentPage.id) {
            continue;
        }
        spec[4] = i + 1;
        var newb = Palette.newScaledBlock(pal, 'gotopage', Palette.blockscale, dx, Palette.blockdy);
        newb.lift();
        dx += Palette.betweenblocks + 5;
    }
};

Palette.addSoundsBlocks = function (dx) {
    var pal = gn('palette');
    var spr = ScratchJr.getSprite();
    var list = spr ? spr.sounds : [];
    for (var i = 0; i < list.length; i++) {
        var op = (MediaLib.sounds.indexOf(list[i]) < 0) ? 'playusersnd' : 'playsnd';
        var val = (MediaLib.sounds.indexOf(list[i]) < 0) ? i : list[i];
        var newb = Palette.addBlockSound(pal, op, val, dx, Palette.blockdy);
        newb.lift();
        dx += Palette.betweenblocks;
    }
    if ((list.length < 6) && Record.available) {
        Palette.drawRecordSound(newb.div.offsetWidth, newb.div.offsetHeight, dx);
    }
};

Palette.addBlockSound = function (parent, op, val, dx, dy) {
    var spec = BlockSpecs.defs[op];
    var old = spec[4];
    spec[4] = val;
    var newb = Palette.newScaledBlock(parent, op, Palette.blockscale, dx, dy);
    spec[4] = old;
    return newb;
};

Palette.drawRecordSound = function (w, h, dx) {
    var pal = gn('palette');
    var div = newDiv(pal, dx, 0, w, h, {
        top: (6 * scaleMultiplier) + 'px'
    });
    var cnv = newCanvas(div, 0, 0,
        div.offsetWidth * window.devicePixelRatio,
        div.offsetHeight * window.devicePixelRatio,
        {
            webkitTransform: 'translate(' +
            (-div.offsetWidth * window.devicePixelRatio / 2) + 'px, ' +
            (-div.offsetHeight * window.devicePixelRatio / 2) + 'px) ' +
            'scale(' + (1 / window.devicePixelRatio) + ') translate(' +
            (div.offsetWidth * window.devicePixelRatio / 2) + 'px, ' +
            (div.offsetHeight * window.devicePixelRatio / 2) + 'px)'
        }
    );
    if (BlockSpecs.mic.complete) {
        drawScaled(BlockSpecs.mic, cnv);
    } else {
        BlockSpecs.mic.onload = function () {
            drawScaled(BlockSpecs.mic, cnv);
        };
    }
    if (isTablet) {
        div.ontouchstart = Palette.recordSound;
    }
};

Palette.recordSound = function (e) {
    e.preventDefault();
    e.stopPropagation();
    ScratchJr.clearSelection();
    Record.appear();
};

Palette.inStatesPalette = function () {
    var div = gn('selectors');
    var sel = div.childNodes[div.childElementCount - 1];
    return sel.childNodes[0].style.visibility == 'hidden';
};

// move to scratch jr app
Palette.getLandingPlace = function (el, e, scale) {
    scale = typeof scale !== 'undefined' ? scale : 1;
    var sc = ScratchJr.getActiveScript().owner;
    var pt = e ? Events.getTargetPoint(e) : null;
    if (pt && !pt.x) {
        pt = null;
    }
    var box = new Rectangle(el.left / scale, el.top / scale, el.offsetWidth / scale, el.offsetHeight / scale);
    var box2 = new Rectangle(globalx(gn('palette')), globaly(gn('palette')),
                             gn('palette').offsetWidth, gn('palette').offsetHeight);
    if ((sc.flowCaret != null) && ((sc.flowCaret.prev != null) ||
        (sc.flowCaret.next != null) || (sc.flowCaret.inside != null))) {
        return 'scripts';
    }
    if (box2.overlapElemBy(box, 0.66) && box2.hitRect({x: el.left / scale, y: el.top / scale})) {
        return 'palette';
    }
    if (pt && box2.hitRect(pt)) {
        return 'palette';
    }
    if (Palette.overlapsWith(gn('scripts'), box)) {
        return 'scripts';
    }
    if (Palette.overlapsWith(gn('palette'), box)) {
        return 'palette';
    }
    if (Palette.overlapsWith(gn('library'), box)) {
        return 'library';
    }
    if (Palette.overlapsWith(gn('pages'), box)) {
        return 'pages';
    }
    return null;
};

Palette.overlapsWith = function (el, box) {
    var box2 = new Rectangle(globalx(el), globaly(el), el.offsetWidth, el.offsetHeight);
    return box.intersects(box2);
};

Palette.overlapsWith2 = function (el, box) {
    var box2 = new Rectangle(el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight);
    return box.intersects(box2);
};


Palette.getBlockfromChild = function (div) {
    while (div != null) {
        if (div.owner) {
            return div;
        }
        div = div.parentNode;
    }
    return null;
};

Palette.getHittedThumb = function (el, div, scale) {
    scale = typeof scale !== 'undefined' ? scale : 1;
    var box1 = new Rectangle(el.left / scale, el.top / scale, el.offsetWidth / scale, el.offsetHeight / scale);
    var area = 0;
    var res = null;
    var dh = div.parentNode.scrollTop;
    for (var i = 0; i < div.childElementCount; i++) {
        var node = div.childNodes[i];
        if (node.nodeName == 'FORM') {
            continue;
        }
        var box2 = new Rectangle(globalx(node, node.offsetLeft), globaly(node, node.offsetTop) - dh,
            node.offsetWidth, node.offsetHeight);
        var boxi = box1.intersection(box2);
        var a = boxi.width * boxi.height;
        if (a > area) {
            area = a;
            res = node;
        }
    }
    return res;
};

//////////////////////////////////////
//  Palette Block
/////////////////////////////////////

Palette.newScaledBlock = function (parent, op, scale, dx, dy) {
    var bbx = new Block(BlockSpecs.defs[op], true, scale);
    setProps(bbx.div.style, {
        position: 'absolute',
        left: dx + 'px',
        top: dy + 'px'
    });
    parent.appendChild(bbx.div);
    return bbx;
};

Palette.dropBlockFromPalette = function (e, element) {
    e.preventDefault();
    switch (Palette.getLandingPlace(element, e)) {
    case 'scripts':
        iOS.analyticsEvent('editor', 'new_block', element.owner.blocktype);
        var sc = ScratchJr.getActiveScript();
        var dx = localx(sc, element.left);
        var dy = localy(sc, element.top);
        ScriptsPane.blockDropped(sc, dx, dy);
        var spr = ScratchJr.getActiveScript().owner.spr;
        Undo.record({
            action: 'scripts',
            where: spr.div.parentNode.owner.id,
            who: spr.id
        });
        // Record a change for sample projects in story-starter mode
        ScratchJr.storyStart('Palette.dropBlockFromPalette');
        break;
    default:
        ScratchJr.getActiveScript().owner.deleteBlocks();
        break;
    }
    ScratchJr.getActiveScript().owner.dragList = [];
};
