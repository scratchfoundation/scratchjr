var Block = function (spec, isPalette, scale) {
    this.div = document.createElement('div');

    // Top-level block parent shouldn't accept pointer events
    setProps(this.div.style, {
        pointerEvents: 'none'
    });

    this.setBlockshapeFromSpecs(spec, isPalette, scale);
    this.blockshape = document.createElement('canvas');
    setCanvasSize(this.div, this.getWidth() * this.scale, this.getHeight() * this.scale);
    setCanvasSize(this.blockshape, this.getWidth() * this.scale * window.devicePixelRatio,
        this.getHeight() * this.scale * window.devicePixelRatio);
    this.addShadow();
    this.div.appendChild(this.blockshape);
    setProps(this.blockshape.style, {
        position: 'absolute',
        left: '0px',
        top: '0px',
        webkitTransform: 'translate(' + (-this.blockshape.width / 2) + 'px, ' + (-this.blockshape.height / 2) + 'px) ' +
            'scale(' + (1 / window.devicePixelRatio) + ') ' +
            'translate(' + (this.blockshape.width / 2) + 'px, ' + (this.blockshape.height / 2) + 'px)',
        pointerEvents: 'all'
    });
    this.addHighlight();
    this.drawBlock();
    setCanvasSize(this.div, this.blockshape.width / window.devicePixelRatio,
        this.blockshape.height / window.devicePixelRatio);
    if (this.isCaret) {
        return;
    }
    this.createArgument();
    this.div.owner = this;
};

Block.prototype.getWidth = function () {
    if (this.blocktype == 'repeat') {
        return 176;
    }
    if (this.blocktype == 'gotopage') {
        return 86;
    }
    if (this.aStart || this.anEnd) {
        return 84;
    }
    return 76;
};

Block.prototype.getHeight = function () {
    if (this.blocktype == 'repeat') {
        return 82;
    }
    return 66;
};

Block.prototype.setBlockshapeFromSpecs = function (spec, isPalette, scale) {
    this.spec = spec;
    this.isReporter = (spec[1] == 'reporter');
    this.blocktype = spec[0];
    this.icon = spec[1];
    this.image = spec[2];
    this.aStart = (this.blocktype == 'caretstart') || (this.image == BlockSpecs.yellowStart);
    this.anEnd = (this.blocktype == 'caretend')
        || (this.image == BlockSpecs.redEnd)
        || (this.image == BlockSpecs.redEndLong
    );
    this.cShape = (this.blocktype == 'repeat') || (this.blocktype == 'caretrepeat');
    this.prev = null;
    this.next = null;
    this.inside = null;
    this.isCaret = this.blocktype.indexOf('caret') > -1;
    this.type = 'block';
    this.arg = null;
    this.daddy = null;
    this.scale = scale ? scale : 1;
    this.repeatCounter = -1;
    this.originalCount = -1;
    this.threads = [];
    this.inpalette = isPalette;
    this.min = spec[6];
    this.max = spec[7];
    this.shadowimg = (this.spec.length < 9) ? null : spec[8];
    this.hrubberband = 0;
    this.vrubberband = 0;
    this.done = false;
};

Block.prototype.addShadow = function () {
    this.shadow = document.createElement('canvas');
    this.div.appendChild(this.shadow);
    setProps(this.shadow.style, {
        position: 'absolute',
        left: '1px',
        top: '4px',
        opacity: this.inpalette ? Settings.paletteBlockShadowOpacity : 1,
        visibility: 'hidden',
        webkitTransform: 'translate(' + (-this.blockshape.width / 2) + 'px, ' + (-this.blockshape.height / 2) + 'px) ' +
            'scale(' + (1 / window.devicePixelRatio) + ') ' +
            'translate(' + (this.blockshape.width / 2) + 'px, ' + (this.blockshape.height / 2) + 'px)',
        pointerEvents: 'all'
    });
    setCanvasSize(this.shadow, this.blockshape.width, this.blockshape.height);
    if (!this.shadowimg) {
        return;
    }
    var ctx = this.shadow.getContext('2d');
    var img = this.shadowimg;
    if (!img.complete) {
        img.onload = function () {
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0,
                img.width * this.scale * window.devicePixelRatio, img.height * this.scale * window.devicePixelRatio);
        };
    } else {
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0,
            img.width * this.scale * window.devicePixelRatio, img.height * this.scale * window.devicePixelRatio);
    }
};

Block.prototype.lift = function () {
    this.shadow.style.visibility = 'visible';
};

Block.prototype.drop = function () {
    this.shadow.style.visibility = 'hidden';
};

Block.prototype.addHighlight = function () {
    var img = this.spec[5];
    if (!img) {
        return;
    }
    this.shine = document.createElement('canvas');
    this.div.appendChild(this.shine);
    setCanvasSize(this.shine, this.blockshape.width, this.blockshape.height);
    setProps(this.shine.style, {
        position: 'absolute',
        left: '0px',
        top: '0px',
        visibility: 'hidden',
        webkitTransform: 'translate(' + (-this.blockshape.width / 2) + 'px, ' + (-this.blockshape.height / 2) + 'px) ' +
            'scale(' + (1 / window.devicePixelRatio) + ') ' +
            'translate(' + (this.blockshape.width / 2) + 'px, ' + (this.blockshape.height / 2) + 'px)',
        pointerEvents: 'all'
    });
    var ctx = this.shine.getContext('2d');
    if (!img.complete) {
        img.onload = function () {
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0,
                img.width * this.scale * window.devicePixelRatio, img.height * this.scale * window.devicePixelRatio);
        };
    } else {
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0,
            img.width * this.scale * window.devicePixelRatio, img.height * this.scale * window.devicePixelRatio);
    }
};

Block.prototype.drawBlock = function () {
    var cnv = this.blockshape;
    var ctx = this.blockshape.getContext('2d');
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    var me = this;
    if (!this.image.complete) {
        this.image.onload = function () {
            me.drawBlockType();
        };
    } else {
        this.drawBlockType();
    }
};

Block.prototype.drawBlockType = function () {
    var ctx = this.blockshape.getContext('2d');
    ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height, 0, 0,
        this.image.width * this.scale * window.devicePixelRatio,
        this.image.height * this.scale * window.devicePixelRatio);
    var icnv = document.createElement('canvas');
    this.blockicon = icnv;
    this.div.appendChild(icnv);
    setCanvasSize(icnv, this.blockshape.width, this.blockshape.height);
    setProps(icnv.style, {
        position: 'absolute',
        left: '0px',
        top: '0px',
        webkitTransform: 'translate(' + (-this.blockshape.width / 2) + 'px, ' + (-this.blockshape.height / 2) + 'px) ' +
            'scale(' + (1 / window.devicePixelRatio) + ') ' +
            'translate(' + (this.blockshape.width / 2) + 'px, ' + (this.blockshape.height / 2) + 'px)',
        pointerEvents: 'all'
    });
    if (this.icon && this.icon.tagName) {
        this.drawIcon();
    }
    this.done = true;
};

Block.prototype.updateBlock = function () {
    if (this.arg && this.arg.argType == 'p') {
        this.arg.updateIcon();
    }
};

Block.prototype.highlight = function () {
    if (this.blocktype.indexOf('caret') > -1) {
        return;
    }
    if (!this.div.parentNode) {
        return;
    } // deleted block
    if ((this.div.parentNode.id != 'palette') && (this.div.parentNode != ScratchJr.getActiveScript())) {
        return;
    }
    this.shine.style.visibility = 'visible';
};

Block.prototype.unhighlight = function () {
    if (this.blocktype.indexOf('caret') > -1) {
        return;
    }
    this.shine.style.visibility = 'hidden';
};

Block.prototype.drawIcon = function () {
    var dx = 0;
    var dy = 0;
    var ctx = this.blockicon.getContext('2d');
    switch (this.blocktype) {
    case 'repeat':
        var w = Math.round(74 * this.scale * window.devicePixelRatio);
        var h = Math.round(65 * this.scale * window.devicePixelRatio);
        setCanvasSize(this.blockicon, w, h);
        dx = 0;
        this.blockicon.style.left = (this.shine.width / window.devicePixelRatio -
            Math.round(this.scale * 77)) + 'px';
        dy = Math.round(this.scale * 14 * window.devicePixelRatio);
        setProps(this.blockicon.style, {
            position: 'absolute',
            webkitTransform: 'translate(' + (-w / 2) + 'px, ' + (-h / 2) + 'px) ' +
                'scale(' + (1 / window.devicePixelRatio) + ') ' +
                'translate(' + (w / 2) + 'px, ' + (h / 2) + 'px)'
        });
        break;
    }
    this.drawMyIcon(ctx, dx, dy);
};

Block.prototype.drawMyIcon = function (ctx, dx, dy) {
    var me = this;
    var icon = this.icon;
    if (!icon.complete) {
        icon.onload = function () {
            ctx.drawImage(icon, 0, 0, icon.width, icon.height,
                dx, dy, icon.width * me.scale * window.devicePixelRatio,
                icon.height * me.scale * window.devicePixelRatio);
        };
    } else {
        ctx.drawImage(icon, 0, 0, icon.width, icon.height, dx, dy,
            icon.width * me.scale * window.devicePixelRatio,
            icon.height * me.scale * window.devicePixelRatio);
    }
};

Block.prototype.createArgument = function () {
    if (this.spec[4] == null) {
        return;
    }
    this.arg = new BlockArg(this);
};

Block.prototype.getArgValue = function () {
    if (this.arg == null) {
        return null;
    }
    return this.arg.argValue;
};

Block.prototype.getSoundName = function (list) {
    var val = this.arg.argValue;
    if (Number(val).toString() == 'NaN') {
        return val;
    }
    if (list.length <= val) {
        return list[0];
    }
    return list[val];
};

Block.prototype.update = function (spr) {
    if (this.arg) {
        this.arg.update(spr);
    }
};

Block.prototype.setSound = function (bt) {
    var p = this.arg.div;
    p.parentNode.removeChild(p);
    var icon = this.blockicon;
    icon.parentNode.removeChild(icon);
    var op = bt;
    var specs = BlockSpecs.defs[op];
    this.setBlockshapeFromSpecs(specs);
    this.drawBlock();
    this.createArgument();
};

Block.prototype.duplicateBlock = function (dx, dy, spr) {
    var op = this.blocktype;
    var specs = BlockSpecs.defs[op];
    specs[4] = this.getArgValue();
    var bbx = new Block(specs, false, scaleMultiplier);
    setProps(bbx.div.style, {
        position: 'absolute',
        left: '0px',
        top: '0px'
    });
    bbx.moveBlock(dx, dy);
    bbx.update(spr);
    return bbx;
};

Block.prototype.resolveDocks = function () {
    var w = this.getWidth();
    var h = this.getHeight();
    if (this.aStart) {
        return [['start', true, 0, h / 2], ['flow', false, w - this.notchSize(), h / 2]];
    }
    if (this.anEnd) {
        return [['flow', true, 0, h / 2], ['changestate', false, w - 3, h / 2]];
    }
    if (this.isReporter) {
        return [['input', true, 0, 0], ['input', false, w - this.notchSize(), h / 2]];
    }
    if (this.cShape) {
        return [['flow', true, 0, this.blockshape.height / this.scale / window.devicePixelRatio - 33],
            ['flow', false, 35, this.blockshape.height / this.scale / window.devicePixelRatio - 33],
            ['flow', false, this.blockshape.width / this.scale / window.devicePixelRatio - this.notchSize() - 1,
                this.blockshape.height / this.scale / window.devicePixelRatio - 33]];
    } else {
        return [['flow', true, 0, h / 2], ['flow', false, w - this.notchSize(), h / 2]];
    }
};

Block.prototype.notchSize = function () {
    return 11;
};

//////////////////////////////////////////
// Connect / Disconnect
/////////////////////////////////////////

Block.prototype.connectBlock = function (myn, you, yourn) {
    if (this.isConnectedAfterFirst(myn, you, yourn)) {
        return;
    }
    this.connectLast(myn, you, yourn);
    this.setMyDock(myn, you);
    you.setMyDock(yourn, this);
    if (this.cShape && (myn == 1) && this.inside.findLast().anEnd) {
        var theend = this.inside.findLast();
        theend.prev.next = null;
        var last = this.findLast();
        last.next = theend;
        theend.prev = last;
    }
};

Block.prototype.getMyDock = function (dockn) {
    var myprops = this.cShape ? ['prev', 'inside', 'next'] : ['prev', 'next'];
    return this[myprops[dockn]];
};

Block.prototype.setMyDock = function (dockn, you) {
    var myprops = this.cShape ? ['prev', 'inside', 'next'] : ['prev', 'next'];
    this[myprops[dockn]] = you;
};

Block.prototype.getMyDockNum = function (you) {
    var connections = this.cShape ? [this.prev, this.inside, this.next] : [this.prev, this.next];
    return connections.indexOf(you);
};

Block.prototype.isConnectedAfterFirst = function (myn, you) {
    if (myn == 0) {
        return false;
    }
    var prev = you.prev;
    if (prev == null) {
        return false;
    }
    if (this == prev) {
        return false;
    }
    var n = prev.getMyDockNum(you);
    var thefirst = this.findFirst();
    thefirst.connectBlock(0, prev, n);
    return true;
};

Block.prototype.findLast = function () {
    if (this.next == null) {
        return this;
    }
    return this.next.findLast();
};

Block.prototype.findFirst = function () {
    if (this.prev == null) {
        return this;
    }
    return this.prev.findFirst();
};

Block.prototype.connectLast = function (myn, you, yourn) {
    if (myn != 0) {
        return;
    }
    var yourtail = you.getMyDock(yourn);
    var mylast = this.findLast();
    if (yourtail == mylast) {
        return;
    }
    if (this.cShape && (this.inside == null) && (yourtail != null) && !yourtail.anEnd) {
        var lastone = yourtail.findLast();
        this.inside = yourtail;
        yourtail.prev = this;
        if (lastone.anEnd) {
            mylast.next = lastone;
            var striplast = lastone.prev;
            if (striplast) {
                striplast.next = null;
            }
            lastone.prev = mylast;
        }
    } else {
        mylast.next = yourtail;
        if (yourtail == null) {
            return;
        }
        yourtail.prev = mylast;
    }
};

Block.prototype.detachBlock = function () {
    var you = this.prev;
    if (you == null) {
        return;
    }
    this.prev = null;
    if ((you.cShape) && (you.inside == this)) {
        you.inside = null;
    } else {
        you.next = null;
    }
};

//////////////////////////////////////////
// Move
/////////////////////////////////////////

Block.prototype.moveBlock = function (dx, dy) {
    this.div.top = dy;
    this.div.left = dx;
    this.div.style.webkitTransform = 'translate3d(' + this.div.left + 'px,' + this.div.top + 'px, 0)';
};


/////////////////////////////////
// Forever and Repeat
////////////////////////////////

// Repeat size 176 by 82

Block.prototype.redrawRepeat = function () {
    this.redrawShape(this.blockshape, this.image);
    if (this.blocktype.indexOf('caret') < 0) {
        this.redrawShape(this.shadow, this.shadowimg);
    }

    if (this.blocktype.indexOf('caret') > -1) {
        return;
    }
    var dx = this.blockshape.width / window.devicePixelRatio - 78 * this.scale;
    var dy = this.blockshape.height / window.devicePixelRatio - 82 * this.scale;
    this.blockicon.style.left = dx + 'px';
    this.arg.div.style.left = (this.blockshape.width / window.devicePixelRatio - 66 * this.scale) + 'px';
    this.blockicon.style.top = dy + 'px';
    this.arg.div.style.top = (this.blockshape.height / window.devicePixelRatio - 11 * this.scale) + 'px';
};

Block.prototype.redrawShape = function (cnv, img) {
    setCanvasSize(this.div,
        (92 + this.hrubberband + 84) * this.scale,
        (100 + this.vrubberband) * this.scale);
    var scaleAndRatio = this.scale * window.devicePixelRatio;
    setCanvasSize(cnv,
        (92 + this.hrubberband + 84) * scaleAndRatio,
        (82 + this.vrubberband) * scaleAndRatio);
    setProps(cnv.style, {
        webkitTransform: 'translate(' + (-cnv.width / 2) + 'px, ' + (-cnv.height / 2) + 'px) ' +
            'scale(' + (1 / window.devicePixelRatio) + ') ' +
            'translate(' + (cnv.width / 2) + 'px, ' + (cnv.height / 2) + 'px)'
    });
    var ctx = cnv.getContext('2d');
    // top line
    ctx.drawImage(img, 0, 0, 92, 29, 0, 0, 92 * scaleAndRatio, 29 * scaleAndRatio);
    ctx.drawImage(img, 92, 0, 1, 29, 92 * scaleAndRatio, 0, this.hrubberband * scaleAndRatio, 29 * scaleAndRatio);
    ctx.drawImage(img, 93, 0, img.width - 93, 29,
        92 * scaleAndRatio + this.hrubberband * scaleAndRatio, 0, 83 * scaleAndRatio, 29 * scaleAndRatio);

    // height streach
    ctx.drawImage(img, 0, 29, 92, 1, 0, 29 * scaleAndRatio, 92 * scaleAndRatio, this.vrubberband * scaleAndRatio);
    ctx.drawImage(img, 93, 29, img.width - 93, 1,
        92 * scaleAndRatio + this.hrubberband * scaleAndRatio,
        29 * scaleAndRatio, 83 * scaleAndRatio, this.vrubberband * scaleAndRatio);

    // bottom
    ctx.drawImage(img, 0, 29, 45, 53, 0, 29 * scaleAndRatio + this.vrubberband * scaleAndRatio,
        45 * scaleAndRatio, 53 * scaleAndRatio);
    ctx.drawImage(img, 93, 29, img.width - 93, 53, 92 * scaleAndRatio + this.hrubberband * scaleAndRatio,
        29 * scaleAndRatio + this.vrubberband * scaleAndRatio, 83 * scaleAndRatio, 53 * scaleAndRatio);
};
