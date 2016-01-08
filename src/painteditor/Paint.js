var Paint = function () {};

Paint.xmlns = 'http://www.w3.org/2000/svg';
Paint.xmlnslink = 'http://www.w3.org/1999/xlink';
Paint.fillcolor = '#080808';
Paint.workspaceWidth = 432;
Paint.workspaceHeight = 384;
Paint.mode = 'select';
Paint.pensizes = [1, 2, 4, 8, 16];
Paint.strokewidth = 2;
Paint.selectColor = 'rgba(0,158,255, 1)';
Paint.spriteId;
Paint.currentName;
Paint.costumeScale;
Paint.nativeJr;
Paint.isBkg = false;
Paint.currentMd5 = undefined;
Paint.currentZoom = 1;
Paint.root;
Paint.defs;
Paint.saving = false;
Paint.frame;
Paint.saveMD5 = undefined;
Paint.svgdata;
Paint.splash;
Paint.splashshade;
Paint.splashcolor = '#662D91';
Paint.maxZoom = 5;
Paint.minZoom = 1;
Paint.initialPoint = {
    x: 0,
    y: 0
};
Paint.deltaPoint = {
    x: 0,
    y: 0
};
Paint.editorOpen = false;

///////////////////////////////////////////
//Opening and Layout
///////////////////////////////////////////

Paint.init = function (w, h) {
    Paint.frame = document.getElementById('paintframe');
    Paint.frame.style.width = w + 'px';
    Paint.frame.style.height = h + 'px';
    BlockSpecs.loadCount++;
    IO.requestFromServer('assets/paint/splash.svg', Paint.setSplash);
    BlockSpecs.loadCount++;
    IO.requestFromServer('assets/paint/splashshade.svg', Paint.setSplashShade);
};

Paint.setSplash = function (str) {
    BlockSpecs.loadCount--;
    Paint.splash = str;
};

Paint.setSplashShade = function (str) {
    BlockSpecs.loadCount--;
    Paint.splashshade = 'data:image/svg+xml;base64,' + btoa(str);
};

Paint.open = function (bkg, md5, sname, cname, cscale, sw, sh) {
    iOS.analyticsEvent('editor', 'paint_editor_opened', bkg ? 'bkg' : 'character');
    PaintUndo.buffer = [];
    PaintUndo.index = 0;
    Paint.maxZoom = 5;
    Paint.minZoom = 1;
    Paint.workspaceWidth = 432;
    Paint.workspaceHeight = 384;
    Paint.clearWorkspace();
    frame.style.display = 'none';
    Paint.frame.className = 'paintframe appear';
    Paint.editorOpen = true;
    Paint.currentMd5 = md5;
    Paint.isBkg = bkg;
    Paint.spriteId = sname;
    Paint.currentName = cname;
    Paint.costumeScale = cscale;
    SVGTools.init();
    Paint.nativeJr = true;
    if (Paint.isBkg) {
        Paint.initBkg(480, 360);
    } else {
        Paint.initSprite(sw, sh);
    }
    window.ontouchstart = Paint.detectGesture;
    window.ondevicemotion = undefined;

    // Set the back button callback
    ScratchJr.onBackButtonCallback.push(function () {
        var e = document.createEvent('TouchEvent');
        e.initTouchEvent();
        Paint.backToProject(e);
    });
};


//Paint Editor Gestures


Paint.blockGestures = function (e) {
    if (!e.touches) {
        return;
    }
    if (e.touches.length == 4) {
        Paint.ignore(e);
    }
};

Paint.detectGesture = function (e) {
    if (!e.touches) {
        return;
    }
    if (Camera.active) {
        return;
    }
    Paint.clearEvents(e);
    Paint.initialPoint = PaintAction.getScreenPt(e);
    Paint.deltaPoint = PaintAction.getScreenPt(e);
    var n = Math.min(3, e.touches.length);
    Paint.cmdForGesture[n](e);
};

Paint.clearEvents = function (e) {
    window.ontouchmove = undefined;
    window.ontouchend = undefined;
    if (PaintAction.currentshape) {
        PaintAction.stopAction(e);
    }
    Events.clearEvents();
    PaintAction.clearEvents();
};

Paint.ignore = function (e) {
    e.preventDefault();
    e.stopPropagation();
};

Paint.Scroll = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (Paint.canvasFits()) {
        return;
    }
    Ghost.clearLayer();
    Paint.initialPoint = PaintAction.getScreenPt(e);
    window.ontouchmove = function (evt) {
        Paint.dragBackground(evt);
    };
    window.ontouchend = function () {
        Paint.bounceBack();
        Paint.setCanvasTransform(Paint.currentZoom);
        PaintAction.clearEvents();
    };
};

Paint.pinchStart = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (PaintAction.currentshape) {
        return;
    }
    Events.mouseDownTime = new Date().getTime();
    window.ontouchmove = function () {
        Paint.gestureStart(e);
    };
};

Paint.gestureStart = function (e) {
    window.ontouchmove = undefined;
    var skipmodes = ['path', 'ellipse', 'rect'];
    if (skipmodes.indexOf(Paint.mode) > -1) {
        if (PaintAction.currentshape && PaintAction.currentshape.parentNode) {
            PaintAction.currentshape.parentNode.removeChild(PaintAction.currentshape);
        }
    }
    Ghost.clearLayer();
    Events.scaleStartsAt = Paint.currentZoom;
    Events.updatePinchCenter(e);
    Paint.initialPoint = PaintAction.zoomPt(Events.pinchcenter);
    Events.clearEvents();
    Events.clearDragAndDrop();
    window.ontouchmove = Paint.gestureChange;
    window.ontouchend = Paint.gestureEnd;
};

Paint.gestureChange = function (e) {
    e.preventDefault();
    var scale = Math.min(Paint.maxZoom, Events.scaleStartsAt * Events.zoomScale(e));
    scale = Math.max(Paint.minZoom, scale);
    var mc = gn('maincanvas');
    var w = mc.offsetWidth * scale;
    var h = mc.offsetHeight * scale;
    var size = Math.min(w, h);
    if (size < 240) {
        return;
    }
    Paint.updateZoomScale(scale);
    var pt = PaintAction.zoomPt(Events.pinchcenter);
    var delta = Vector.diff(pt, Paint.initialPoint);
    Paint.adjustPos(delta);
};

Paint.gestureEnd = function (e) {
    e.preventDefault();
    window.ontouchmove = undefined;
    window.ontouchend = undefined;
    var scale = Math.min(Paint.maxZoom, Events.scaleStartsAt * Events.zoomScale(e));
    scale = Math.max(Paint.minZoom, scale);
    Paint.updateZoomScale(scale);
    var pt = PaintAction.zoomPt(Events.pinchcenter);
    var delta = Vector.diff(pt, Paint.initialPoint);
    Paint.adjustPos(delta);
    Events.scaleStartsAt = Paint.currentZoom;
    if (Path.selector) {
        Path.showDots(Path.selector);
    }
    Paint.setZoomTo(scale);
};

Paint.canvasFits = function () {
    return ((gn('maincanvas').offsetWidth * Paint.currentZoom <= gn('workspacebkg').offsetWidth) &&
        (gn('maincanvas').offsetHeight * Paint.currentZoom <= gn('workspacebkg').offsetHeight));
};

Paint.mouseDown = function (e) {
    if ((isTablet && e.target.ontouchstart) || e.target.ontouchstart) {
        return;
    }
    var pt = Events.getTargetPoint(e);
    if (hitRect(gn('donecheck'), pt)) {
        Paint.backToProject(e);
    } else {
        if (e.target.parentNode && e.target.parentNode.getAttribute('key')) {
            return;
        } else {
            PaintAction.mouseDown(e);
        }
    }
};

Paint.close = function () {
    Paint.saving = true;
    Paint.frame.className = 'paintframe disappear';
    frame.style.display = 'block';
    Paint.editorOpen = false;
    ScratchJr.editorEvents();
    window.ontouchmove = undefined;
    window.ontouchend = undefined;
    window.onmousemove = undefined;
    Alert.close();
    Paint.clearWorkspace();
    PaintUndo.buffer = [];
    PaintUndo.index = 0;
    Ghost.maskData = {};
    setTimeout(function () {
        Paint.saving = false;
    }, 500); // delay so it doesn't open the info box
};

Paint.backToProject = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (Paint.saving) {
        return;
    }
    if (PaintAction.dragGroup.length > 0) {
        return;
    }
    if (e.touches && (e.touches.length > 1)) {
        return;
    }
    Path.quitEditMode();
    Camera.close();
    PaintAction.clearDragGroup();
    ScratchJr.unfocus();
    ScratchAudio.sndFX('tap.wav');
    if ((Paint.spriteId == null) && (Paint.currentName == null)) {
        Paint.savePageImage(Paint.changePage);
    } else {
        Paint.saveSprite(Paint.changePageSprite);
    }
    ScratchJr.onBackButtonCallback.pop();
};

Paint.saveEditState = function () {
    Camera.close();
    ScratchJr.unfocus();
    ScratchAudio.sndFX('tap.wav');
    if ((Paint.spriteId == null) && (Paint.currentName == null)) {
        Paint.savePageImage();
    } else {
        Paint.saveSprite();
    }
};

/////////////////////////
//Modes
/////////////////////////

Paint.setMode = function (e) {
    if (e.touches && (e.touches.length > 1)) {
        return;
    }
    e.preventDefault();
    var t;
    if (window.event) {
        t = window.event.srcElement;
    } else {
        t = e.target;
    }
    if (t == null) {
        return;
    }
    Path.quitEditMode();
    if (Camera.active) {
        Camera.doAction(t.getAttribute('key'));
    } else {
        var tools = ['select', 'rotate', 'stamper', 'scissors', 'camera', 'paintbucket'];
        if (tools.indexOf(t.getAttribute('key')) > -1) {
            ScratchAudio.sndFX('tap.wav');
        }
        Paint.selectButton(t.getAttribute('key'));
    }
};

Paint.selectButton = function (str) {
    Paint.selectButtonFromDiv(gn('painttools'), str);
    Paint.selectButtonFromDiv(gn('selectortools'), str);
    Paint.selectButtonFromDiv(gn('edittools'), str);
    Paint.selectButtonFromDiv(gn('filltools'), str);
    if (gn('stamps')) {
        Paint.selectButtonFromDiv(gn('stamps'), str);
    }
    Paint.mode = str;
    Paint.selectPenSize(Paint.pensizes.indexOf(Paint.strokewidth));
};

Paint.selectButtonFromDiv = function (p, str) {
    for (var i = 0; i < p.childElementCount; i++) {
        var elem = p.childNodes[i];
        if (elem.childNodes[0].getAttribute('key') == str) {
            elem.setAttribute('class', Paint.getClass(elem, 'on'));
            if (elem.childNodes[0].getAttribute('class')) {
                elem.childNodes[0].setAttribute('class', Paint.getClass(elem.childNodes[0], 'on'));
            }
        } else {
            elem.setAttribute('class', Paint.getClass(elem, 'off'));
            if (elem.childNodes[0].getAttribute('class')) {
                elem.childNodes[0].setAttribute('class', Paint.getClass(elem.childNodes[0], 'off'));
            }
        }
    }
};

Paint.getClass = function (elem, state) {
    var list = elem.getAttribute('class').split(' ');
    list.pop();
    list.push(state);
    return list.join(' ');
};


//Zoom Management
///////////////////////////////////////////

Paint.setZoomTo = function (value) {
    Paint.currentZoom = value;
    Paint.bounceBack();
    Paint.setCanvasTransform(value);
    Ghost.drawOffscreen();
};

Paint.updateZoomScale = function (value) {
    Paint.currentZoom = value;
    Paint.setCanvasTransform(value);
};

Paint.setCanvasTransform = function (value) {
    if (isAndroid) { // Use 3D translate to increase speed
        gn('maincanvas').style.webkitTransform = 'translate3d(' + gn('maincanvas').dx + 'px,'
            + gn('maincanvas').dy + 'px, 0px) scale(' + value + ',' + value + ')';
    } else { // Use 2D translate to maintain sharpness
        gn('maincanvas').style.webkitTransform = 'translate(' + gn('maincanvas').dx + 'px,'
            + gn('maincanvas').dy + 'px) scale(' + value + ',' + value + ')';

    }
};

Paint.adjustPos = function (delta) {
    gn('maincanvas').dx += delta.x;
    gn('maincanvas').dy += delta.y;
    Paint.setCanvasTransform(Paint.currentZoom);
};

Paint.bounceBack = function () {
    var mx = Math.floor((gn('workspacebkg').offsetWidth - Paint.workspaceWidth) / 2);
    var my = Math.floor((gn('workspacebkg').offsetHeight - Paint.workspaceHeight) / 2);
    gn('maincanvas').dx = Paint.canvasFits() ? mx : Paint.getCoorx(20, mx);
    gn('maincanvas').dy = Paint.canvasFits() ? my : Paint.getCoory(20, my);
};

Paint.getCoorx = function (indent, val) {
    if (gn('maincanvas').offsetWidth * Paint.currentZoom <= gn('workspacebkg').offsetWidth) {
        return val;
    }
    var dx = gn('maincanvas').dx + gn('maincanvas').cx - gn('maincanvas').cx * Paint.currentZoom;
    if (dx > indent) {
        return gn('maincanvas').dx + (indent - dx);
    }
    val = ((dx / Paint.currentZoom) + gn('maincanvas').offsetWidth) * Paint.currentZoom;
    var edge = gn('workspacebkg').offsetWidth - indent;
    if (val < edge) {
        return gn('maincanvas').dx + (edge - val);
    }
    return gn('maincanvas').dx;
};

Paint.getCoory = function (indent, val) {
    if (gn('maincanvas').offsetHeight * Paint.currentZoom <= gn('workspacebkg').offsetHeight) {
        return val;
    }
    var dy = gn('maincanvas').dy + gn('maincanvas').cy - gn('maincanvas').cy * Paint.currentZoom;
    if (dy > indent) {
        return gn('maincanvas').dy + (indent - dy);
    }
    val = ((dy / Paint.currentZoom) + gn('maincanvas').offsetHeight) * Paint.currentZoom;
    var edge = gn('workspacebkg').offsetHeight - indent;
    if (val < edge) {
        return gn('maincanvas').dy + (edge - val);
    }
    return gn('maincanvas').dy;
};

Paint.scaleToFit = function () {
    var dh = Paint.root.parentNode.parentNode.offsetHeight / (Paint.workspaceHeight + 10);
    var dw = Paint.root.parentNode.parentNode.offsetWidth / (Paint.workspaceWidth + 10);
    Paint.setZoomTo(Math.min(dw, dh));
};

Paint.dragBackground = function (evt) {
    if (Paint.canvasFits()) {
        return;
    }
    var pt = PaintAction.getScreenPt(evt);
    var delta = Vector.diff(pt, Paint.initialPoint);
    Paint.adjustPos(delta);
};

/////////////////////////////////////////////////////////
//dispatch table


Paint.cmdForGesture = [Paint.ignore, Paint.mouseDown, Paint.pinchStart, Paint.Scroll];
