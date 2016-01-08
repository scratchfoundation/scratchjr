var Camera = function () {};
Camera.feed = false;
Camera.view = 'front';
Camera.target = undefined;
Camera.available = false;

Camera.startFeed = function (target) {
    ScratchAudio.sndFX('entertap.wav');
    if (!Paint.canvasFits()) {
        Paint.scaleToFit();
    }
    Camera.target = target;
    Camera.active = true;
    var devicePixelRatio = window.devicePixelRatio;
    var viewbox = SVGTools.getBox(target).rounded();
    var box = new Rectangle(0, 0, Paint.workspaceWidth, Paint.workspaceHeight);
    viewbox = viewbox.expandBy(20);
    viewbox.crop(box);
    var mask = Camera.getLayerMask(target);
    var data = new Object();
    var x = Math.floor((viewbox.x + (viewbox.width / 2)) * Paint.currentZoom - (viewbox.width / 2));
    var y = Math.floor((viewbox.y + (viewbox.height / 2)) * Paint.currentZoom - (viewbox.height / 2));
    data.x = globalx(gn('workspacebkg')) + x + gn('maincanvas').dx +
        gn('maincanvas').cx - gn('maincanvas').cx * Paint.currentZoom;
    data.y = globaly(gn('workspacebkg')) + y + gn('maincanvas').dy +
        gn('maincanvas').cy - gn('maincanvas').cy * Paint.currentZoom;
    data.width = viewbox.width;
    data.height = viewbox.height;
    data.scale = Paint.currentZoom;
    data.devicePixelRatio = devicePixelRatio;
    data.mx = globalx(gn('workspacebkg')) + gn('maincanvas').dx;
    data.my = globaly(gn('workspacebkg')) + gn('maincanvas').dy;
    data.mw = Paint.workspaceWidth;
    data.mh = Paint.workspaceHeight;
    data.image = mask.toDataURL('image/png');
    iOS.startfeed(data, iOS.trace);
    Paint.cameraToolsOn();
};

Camera.prepareForLandscapeMode = function (cnv) {
    var result = document.createElement('canvas');
    setCanvasSize(result, cnv.height, cnv.width);
    var finalctx = result.getContext('2d');
    var min = Math.min(cnv.width, cnv.height);
    var max = Math.max(cnv.width, cnv.height);
    var delta = (max - min) / 2;
    var pt = {
        x: (cnv.width / 2),
        y: (cnv.height / 2)
    };
    finalctx.translate(pt.x, pt.y);
    finalctx.rotate(90 * DEGTOR);
    finalctx.translate(-pt.x, -pt.y);
    finalctx.drawImage(cnv, delta, delta);
    return result;
};

Camera.doAction = function (str) {
    switch (str) {
    case 'cameraflip':
        ScratchAudio.sndFX('tap.wav');
        Camera.view = (Camera.view == 'front') ? 'back' : 'front';
        iOS.choosecamera(Camera.view, Camera.flip);
        break;
    case 'camerasnap':
        Camera.snapShot();
        Paint.cameraToolsOff();
        break;
    case 'cammera':
        Camera.close();
        Paint.selectButton('select');
        break;
    default:
        Camera.close();
        Paint.selectButton(str);
        break;
    }
};

Camera.close = function () {
    Camera.feed = false;
    Camera.target = undefined;
    Camera.view = 'front';
    Camera.active = false;
    iOS.stopfeed();
    Paint.cameraToolsOff();
    if (isAndroid) {
        ScratchJr.onBackButtonCallback.pop();
    }
};

Camera.snapShot = function () {
    iOS.captureimage('Camera.processimage'); // javascript call back;
};

Camera.getLayerMask = function (elem) {
    // draw background
    var w, h;
    if (isAndroid) {
        var mainCanvas = gn('maincanvas');
        var mainCanvasRect = mainCanvas.getBoundingClientRect();
        w = mainCanvasRect.width;
        h = mainCanvasRect.height;
    } else {
        w = Paint.workspaceWidth;
        h = Paint.workspaceHeight;
    }
    var cnv = document.createElement('canvas');
    setCanvasSize(cnv, w, h);
    var ctx = cnv.getContext('2d');
    ctx.fillStyle = ScratchJr.stagecolor;
    ctx.fillRect(0, 0, cnv.width, cnv.height);
    if (isAndroid) {
        ctx.save();
        ctx.scale(Paint.currentZoom, Paint.currentZoom);
    }
    SVG2Canvas.drawImage(gn('paintgrid'), ctx);

    var isgroup = (elem.parentNode && (elem.parentNode.id != 'layer1'));
    var index = isgroup ? Layer.groupStartsAt(gn('layer1'), elem.parentNode) : Layer.groupStartsAt(gn('layer1'), elem);
    Camera.drawLayers(gn('layer1'), ctx, 0, index);
    if (isgroup) {
        var localindex = Layer.groupStartsAt(elem.parentNode, elem);
        Camera.drawLayers(elem.parentNode, ctx, 0, localindex);
    }
    Camera.drawHole(elem, ctx);
    if (isgroup) {
        Camera.drawLayers(elem.parentNode, ctx, localindex + 1, elem.parentNode.childElementCount);
    }
    Camera.drawLayers(gn('layer1'), ctx, index + 1, gn('layer1').childElementCount);
    if (isAndroid) {
        ctx.restore();
    }
    return cnv;
};

Camera.drawLayers = function (p, ctx, startat, endat) {
    var min = Math.min(startat, p.childElementCount);
    var max = Math.min(endat, p.childElementCount);
    for (var i = min; i < max; i++) {
        SVG2Canvas.drawLayer(p.childNodes[i], ctx, SVG2Canvas.drawLayer);
    }
};

Camera.drawHole = function (elem, ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    SVG2Canvas.drawElementHole(elem, ctx);
    ctx.restore();
    ctx.fillStyle = 'rgba(0, 0, 0,0)';
    ctx.strokeStyle = !elem.getAttribute('stroke') ? 'none' : elem.getAttribute('stroke');
    ctx.lineCap = elem.getAttribute('stroke-linecap') ?
        elem.getAttribute('stroke-linecap') : SVG2Canvas.strokevalues['stroke-linecap'];
    ctx.lineWidth = elem.getAttribute('stroke-width') ?
        Number(elem.getAttribute('stroke-width')) : Number(SVG2Canvas.strokevalues['stroke-width']);
    ctx.miterLimit = elem.getAttribute('stroke-miterlimit') ?
        elem.getAttribute('stroke-miterlimit') : SVG2Canvas.strokevalues['stroke-miterlimit'];
    ctx.linejoin = elem.getAttribute('stroke-linejoin') ?
        elem.getAttribute('stroke-linejoin') : SVG2Canvas.strokevalues['stroke-linejoin'];
    SVG2Canvas.processXMLnode(elem, ctx, true);
};

Camera.processimage = function (str) {
    if (!Camera.target) {
        return;
    }
    if (str != 'error getting a still') {
        SVGImage.addCameraFill(Camera.target, str);
    }
    Camera.close();
    Paint.cameraToolsOff();
    Paint.selectButton('select');
    if (str != 'error getting a still') {
        PaintUndo.record();
        Ghost.drawOffscreen();
    }
};
