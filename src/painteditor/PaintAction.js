/*
Type of objects:
- fixed: Only exists on Assets Backgrounds and can it only be fill (color or camera) or removed
- stencil: created on backgrounds when you draw edge to edge
The background back layer is called staticbkg and it is fixed (staticbkg can't be removed.)


Rules:
	Select: Berfore moving selects an SVG object or a SVG group and everything above
					moves that object and the objects above, hold does a bring to front,
					and click shows the dots except on the fixed and groups.
	Rotate: rotates an SVG object or a SVG group and everything above
	clone: 	clones an SVG object or a SVG group and everything above
	scissors: deletes only the target SVG object
	camera: opens the camera on the target SVG object
	paint: fills the area - if an area is inside onother area and both don't have a fill.
				It makes a compound path.
	Path: drag to make it. On start it detects if you click on a path end.
		If so register it will hightlight the path. On mouse up it will join paths if it can.

	ellipse, rect, trianngle: drag to make it, click does a small one.


 */

var PaintAction = function () {};
PaintAction.currentshape = undefined;
PaintAction.target = undefined;
PaintAction.dragGroup = [];
PaintAction.startAngle = 0;
PaintAction.dragging = false;
PaintAction.timeoutEvent;
PaintAction.mindist = 10;


//Main Events
/////////////////////////////////

PaintAction.mouseDown = function (evt) {
    PaintAction.target = undefined;
    if (!gn('layer1')) {
        return;
    }
    if (evt.touches && (evt.touches.length > 1)) {
        return;
    }
    PaintAction.clearDragGroup();
    PaintAction.dragging = false;
    var mt = PaintAction.getMouseTarget(evt);
    if (!mt) {
        return;
    }
    if ((mt.tagName.toLowerCase() != 'div') && (mt.tagName.toLowerCase() != 'svg')) {
        PaintAction.target = mt;
    }
    evt.preventDefault();
    Paint.initialPoint = PaintAction.getScreenPt(evt);
    Paint.deltaPoint = PaintAction.getScreenPt(evt);
    if (Path.hitDot(evt)) {
        Paint.mode = 'grab';
    }
    PaintAction.currentshape = undefined;
    PaintAction.clearEvents();
    PaintAction.cmdForMouseDown[Paint.mode](evt);
    PaintAction.setEvents();
};

PaintAction.clearDragGroup = function () {
    for (var j = 0; j < gn('layer1').childElementCount; j++) {
        var kid = gn('layer1').childNodes[j];
        var erot = Transform.getRotation(kid);
        if (erot.angle == 0) {
            continue;
        }
        var res = [];
        for (var i = 0; i < kid.childElementCount; i++) {
            var elem = kid.childNodes[i];
            if (!elem) {
                continue;
            }
            Transform.rotateFromPoint(erot, elem);
            res.push(elem);
        }
        for (i = 0; i < kid.childElementCount; i++) {
            gn('layer1').appendChild(res[i]);
        }
        gn('layer1').removeChild(kid);
    }
};

PaintAction.clearEvents = function () {
    PaintAction.currentshape = undefined;
    window.ontouchmove = undefined;
    window.ontouchend = undefined;
};

PaintAction.stopAction = function (e) {
    var list = ['path', 'ellipse', 'rect', 'tri'];
    var isCreator = list.indexOf(Paint.mode) > -1;
    if (PaintAction.currentshape && PaintAction.currentshape.parentNode && isCreator) {
        PaintAction.removeShape(null);
    } else {
        // olnly select, grab and rotate need special treatment
        var othertools = ['select', 'grab', 'rotate'];
        if (othertools.indexOf(Paint.mode) < 0) {
            return;
        }

        if (Paint.mode == 'select') {
            if (PaintAction.timeoutEvent) {
                clearTimeout(PaintAction.timeoutEvent);
            }
            if (PaintAction.dragging) {
                PaintAction.stopDrag();
            }
        }
        if ((Paint.mode == 'grab') || (Paint.mode == 'rotate')) {
            PaintAction.cmdForMouseUp[Paint.mode](e);
        }
        Ghost.clearLayer();
        if (PaintAction.target || PaintAction.currentshape) {
            PaintUndo.record();
        }
        Transform.updateAll(PaintAction.currentshape);
        Ghost.drawOffscreen();
    }
};

PaintAction.setEvents = function () {
    window.ontouchmove = function (evt) {
        PaintAction.mouseMove(evt);
    };
    window.ontouchend = function (evt) {
        PaintAction.mouseUp(evt);
    };
    window.ontouchcancel = function (evt) {
        PaintAction.mouseMove(evt);
        PaintAction.mouseUp(evt);
    };
};

PaintAction.mouseMove = function (evt) {
    evt.preventDefault();
    PaintAction.cmdForMouseMove[Paint.mode](evt);
    Paint.deltaPoint = PaintAction.getScreenPt(evt);
};

PaintAction.mouseUp = function (evt) {
    evt.preventDefault();
    PaintAction.cmdForMouseUp[Paint.mode](evt);
    Ghost.clearLayer();
    if (!PaintAction.dragging) {
        var mt = PaintAction.getMouseTarget(evt);
        if (mt) {
            PaintAction.cmdForClick[Paint.mode](evt);
        }
    } else if (PaintAction.target || PaintAction.currentshape) {
        PaintUndo.record();
    }
    if (Paint.mode == 'grab') {
        Paint.mode = 'select';
    }
    var oldshape = PaintAction.currentshape;
    PaintAction.currentshape = undefined;
    PaintAction.dragGroup = [];
    PaintAction.dragging = false;
    Transform.updateAll(oldshape);
    PaintAction.clearEvents();
    Ghost.drawOffscreen();
};


//Calls from the Mouse Down


PaintAction.selectMouseDown = function (evt) {
    PaintAction.fingerDown(evt);
    if (PaintAction.currentshape) {
        PaintAction.currentshape = PaintAction.currentshape.getAttribute('stencil') == 'yes' ?
            null : PaintAction.currentshape;
    }
    var holdit = getValidHold();
    if (holdit) {
        PaintAction.startHold(evt);
    }
    function getValidHold () {
        if (!PaintAction.currentshape) {
            return false;
        }
        if (PaintAction.currentshape.getAttribute('stencil') == 'yes') {
            return false;
        }
        return true;
    }
};

PaintAction.fingerDown = function (evt) { // Paint Target is the one given by the
    PaintAction.currentshape = Ghost.findTarget(evt);
    PaintAction.target = PaintAction.currentshape ? PaintAction.currentshape : PaintAction.target;
    PaintAction.dragGroup = [];
};

PaintAction.fingerUp = function (evt) {
    PaintAction.currentshape = undefined;
    PaintAction.target = undefined;
    PaintAction.fingerDown(evt);
};

PaintAction.startHold = function () {
    //  console.log ("startHold", PaintAction.currentshape);
    if (!PaintAction.currentshape) {
        return;
    }
    var repeat = function () {
        //	console.log ("callback", PaintAction.currentshape);
        Layer.bringToFront(PaintAction.currentshape);
        PaintAction.timeoutEvent = null;
    };
    PaintAction.timeoutEvent = setTimeout(repeat, 600);
};

PaintAction.cloneMouseDown = function (evt) {
    PaintAction.fingerDown(evt);
    PaintAction.selectTarget();
    if (PaintAction.currentshape && (PaintAction.currentshape.id == 'staticbkg')) {
        PaintAction.currentshape = null;
    }
};

PaintAction.pathMouseDown = function () {
    PaintAction.currentshape = SVGTools.addPolyline(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
    var mt = Path.getClosestPath(Paint.initialPoint, PaintAction.currentshape, gn('layer1'), Path.maxDistance());
    if (!mt) {
        return;
    }
    var s = PaintAction.currentshape.getAttribute('stroke');
    var sw = PaintAction.currentshape.getAttribute('stroke-width');
    if ((s != mt.getAttribute('stroke')) || (sw != mt.getAttribute('stroke-width'))) {
        return;
    }
    var g = SVGTools.createGroup(gn('draglayer'), 'cusorstate');
    Ghost.getKid(g, mt, 0.7);
    PaintAction.target = mt;
};

PaintAction.selectTarget = function () {
    if (!PaintAction.currentshape) {
        return;
    }
    while ((PaintAction.currentshape.parentNode.tagName == 'g')
            && (PaintAction.currentshape.parentNode.id != 'layer1')) {
        PaintAction.currentshape = PaintAction.currentshape.parentNode;
    }
};

PaintAction.makeAgroup = function (group) {
    var p = gn('layer1');
    var g = SVGTools.createGroup(p, getIdFor('group'));
    for (var i = 0; i < group.length; i++) {
        p.removeChild(group[i]);
        g.appendChild(group[i]);
    }
    return g;
};

PaintAction.ellipseMouseDown = function () {
    PaintAction.currentshape = SVGTools.addEllipse(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
};
PaintAction.rectMouseDown = function () {
    PaintAction.currentshape = SVGTools.addRect(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
};
PaintAction.triMouseDown = function () {
    PaintAction.currentshape = SVGTools.addTriangle(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
};

PaintAction.grabMouseDown = function () {
    PaintAction.currentshape = PaintAction.target;
    PaintAction.currentshape.setAttributeNS(null, 'fill', Path.selectedDotColor);
    PaintAction.currentshape.setAttributeNS(null, 'r', PaintAction.currentshape.getAttribute('r') * 1.5);
};


//Calls from the Mouse Move


PaintAction.selectMouseMove = function (evt) {
    if (evt.touches && (evt.touches.length > 1)) {
        return;
    }
    if (PaintAction.onBackground()) {
        PaintAction.clearEvents();
        Paint.Scroll(evt);
        return;
    } else {
        PaintAction.moveObject(evt);
    }
};

PaintAction.moveObject = function (evt) {
    if (!PaintAction.target) {
        return;
    }
    var pt = PaintAction.getScreenPt(evt);
    var delta = Vector.diff(pt, Paint.initialPoint);
    if (!PaintAction.dragging && (Vector.len(delta) > PaintAction.mindist)) {
        PaintAction.startDragShape(evt);
    }
    if (!PaintAction.dragging) {
        return;
    }
    for (var i = 0; i < PaintAction.dragGroup.length; i++) {
        Transform.extract(PaintAction.dragGroup[i], 2).setTranslate(delta.x, delta.y);
    }
    Transform.extract(gn('ghostgroup'), 2).setTranslate(delta.x, delta.y);
};

PaintAction.onBackground = function () {
    if (!PaintAction.currentshape) {
        return true;
    }
    if ((PaintAction.target.id.indexOf('staticbkg') > -1)
        || (PaintAction.currentshape.getAttribute('stencil') == 'yes')) {
        return true;
    }
    return false;
};

PaintAction.paintBucketMouseMove = function (evt) {
    Ghost.findTarget(evt);
};

PaintAction.isMoving = function (evt) {
    if (PaintAction.dragging) {
        return true;
    }
    var pt = PaintAction.getScreenPt(evt);
    var delta = Vector.diff(pt, Paint.initialPoint);
    return !PaintAction.dragging && (Vector.len(delta) > PaintAction.mindist);
};

PaintAction.fingerMove = function (evt) {
    Ghost.findTarget(evt);
};

PaintAction.cloneMouseMove = function (evt) {
    Ghost.findTarget(evt);
};

PaintAction.startDragShape = function () {
    if (PaintAction.timeoutEvent) {
        clearTimeout(PaintAction.timeoutEvent);
    }
    PaintAction.selectTarget();
    PaintAction.timeoutEvent = undefined;
    Path.quitEditMode();
    PaintAction.dragGroup = Layer.findGroup(PaintAction.currentshape);
    for (var i = 0; i < PaintAction.dragGroup.length; i++) {
        Transform.eleminateTranslates(PaintAction.dragGroup[i]);
        gn('layer1').appendChild(PaintAction.dragGroup[i]);
    }
    Ghost.highlight(PaintAction.dragGroup);
    for (var j = 0; j < PaintAction.dragGroup.length; j++) {
        Transform.appendForMove(PaintAction.dragGroup[j], Transform.getTranslateTransform());
    }
    Transform.appendForMove(gn('ghostgroup'), Transform.getTranslateTransform());
    PaintAction.dragging = true;
};

PaintAction.rotateMouseMove = function (evt) {
    if (!PaintAction.target) {
        return;
    }
    var pt = PaintAction.getScreenPt(evt);
    var delta = Vector.diff(pt, Paint.initialPoint);
    if (!PaintAction.dragging && (Vector.len(delta) > PaintAction.mindist)) {
        PaintAction.startRotateShape(evt);
    }
    if (!PaintAction.currentshape) {
        return;
    }
    if (!PaintAction.dragging) {
        return;
    }
    PaintAction.rotateFromMouse(evt, PaintAction.currentshape);
    PaintAction.rotateFromMouse(evt, gn('ghostgroup'));
};

PaintAction.startRotateShape = function (evt) {
    PaintAction.selectTarget();
    if (!PaintAction.currentshape) {
        return;
    }
    if (PaintAction.currentshape && (PaintAction.currentshape.tagName.toLowerCase() == 'svg')) {
        PaintAction.currentshape = undefined;
    }
    if (PaintAction.onBackground()) {
        PaintAction.currentshape = undefined;
    }
    if (!PaintAction.currentshape) {
        return;
    }
    PaintAction.dragGroup = Layer.findGroup(PaintAction.currentshape);
    Ghost.highlight(PaintAction.dragGroup);
    PaintAction.currentshape = PaintAction.makeAgroup(PaintAction.dragGroup);
    var pt = PaintAction.getScreenPt(evt);
    var mtx = Transform.getCombinedMatrices(PaintAction.currentshape); // skips rotation matrices
    PaintAction.center = SVGTools.getBoxCenter(PaintAction.currentshape);
    var center = {
        x: PaintAction.center.x,
        y: PaintAction.center.y
    };
    center = Transform.point(center.x, center.y, mtx);
    var delta = Vector.diff(center, pt);
    PaintAction.startAngle = ((Math.atan2(delta.y, delta.x) * (180 / Math.PI))) % 360;
    PaintAction.startAngle -= 90;
    SVGTools.getBoxCenter(PaintAction.currentshape);
    PaintAction.dragging = true;
};


PaintAction.rotateFromMouse = function (evt, elem) {
    var pt = PaintAction.getScreenPt(evt);
    var rot = Transform.getRotation(elem);
    var mtx = Transform.getCombinedMatrices(elem); // skips rotation matrices
    //  calculate rotation
    var center = {
        x: PaintAction.center.x,
        y: PaintAction.center.y
    };
    center = Transform.point(center.x, center.y, mtx);
    var delta = Vector.diff(center, pt);
    var angle = ((Math.atan2(delta.y, delta.x) * (180 / Math.PI))) % 360;
    angle -= 90;
    angle -= PaintAction.startAngle;
    angle = (angle < 0) ? (360 + angle) : angle;
    angle = angle % 360;
    rot.setRotate(angle, center.x, center.y);
};

PaintAction.rectMouseMove = function (evt) {
    var pt = PaintAction.getScreenPt(evt);
    var delta = Vector.diff(pt, Paint.initialPoint);
    if (!PaintAction.dragging && (Vector.len(delta) > PaintAction.mindist)) {
        PaintAction.dragging = true;
    }
    if (!PaintAction.dragging) {
        return;
    }
    var w = Math.abs(delta.x);
    var h = Math.abs(delta.y);
    var new_x, new_y;
    if (evt.shiftKey) {
        w = h = Math.max(w, h);
        new_x = Paint.initialPoint.x < pt.x ? Paint.initialPoint.x : Paint.initialPoint.x - w;
        new_y = Paint.initialPoint.y < pt.y ? Paint.initialPoint.y : Paint.initialPoint.y - h;
    } else {
        new_x = Math.min(Paint.initialPoint.x, pt.x);
        new_y = Math.min(Paint.initialPoint.y, pt.y);
    }
    var attr = {
        'width': w,
        'height': h,
        'x': new_x,
        'y': new_y
    };
    for (var val in attr) {
        PaintAction.currentshape.setAttributeNS(null, val, attr[val]);
    }
};

PaintAction.triMouseMove = function (evt) {
    var pt = PaintAction.getScreenPt(evt);
    var delta = Vector.diff(pt, Paint.initialPoint);
    if (!PaintAction.dragging && (Vector.len(delta) > PaintAction.mindist)) {
        PaintAction.dragging = true;
    }
    if (!PaintAction.dragging) {
        return;
    }
    var w = delta.x;
    var h = delta.y;
    var x = Paint.initialPoint.x;
    var y = Paint.initialPoint.y;
    var cmds = [['M', x, y + h], ['L', x + w * 0.5, y], ['L', x + w, y + h], ['L', x, y + h], ['z']];
    var d = SVG2Canvas.arrayToString(cmds);
    PaintAction.currentshape.setAttribute('d', d);
};

PaintAction.pathMouseMove = function (evt) {
    var pt = PaintAction.getScreenPt(evt);
    var delta = Vector.diff(pt, Paint.initialPoint);
    if (!PaintAction.dragging && (Vector.len(delta) > PaintAction.mindist)) {
        PaintAction.dragging = true;
    }
    if (!PaintAction.dragging) {
        return;
    }
    var place = ' ' + pt.x + ',' + pt.y + ' ';
    var d = PaintAction.currentshape.getAttribute('points');
    d += place;
    PaintAction.currentshape.setAttributeNS(null, 'points', d);
};

PaintAction.ellipseMouseMove = function (evt) {
    var pt = PaintAction.getScreenPt(evt);
    var delta = Vector.diff(pt, Paint.initialPoint);
    if (!PaintAction.dragging && (Vector.len(delta) > PaintAction.mindist)) {
        PaintAction.dragging = true;
    }
    if (!PaintAction.dragging) {
        return;
    }
    var w = Math.abs(delta.x);
    var h = Math.abs(delta.y);
    var new_x, new_y;
    if (evt.shiftKey) {
        w = h = Math.max(w, h);
        new_x = Paint.initialPoint.x < pt.x ? Paint.initialPoint.x : Paint.initialPoint.x - w;
        new_y = Paint.initialPoint.y < pt.y ? Paint.initialPoint.y : Paint.initialPoint.y - h;
    } else {
        new_x = Math.min(Paint.initialPoint.x, pt.x);
        new_y = Math.min(Paint.initialPoint.y, pt.y);
    }
    var rx = w / 2;
    var cx = new_x + rx;
    var ry = h / 2;
    var cy = new_y + ry;

    var attr = {
        'cx': cx,
        'cy': cy,
        'rx': rx,
        'ry': ry
    };
    for (var val in attr) {
        PaintAction.currentshape.setAttributeNS(null, val, attr[val]);
    }
};

PaintAction.grabMouseMove = function (evt) {
    var pt = PaintAction.getScreenPt(evt);
    var delta = Vector.diff(pt, Paint.deltaPoint);
    PaintAction.movePointByDrag(delta.x, delta.y);
    PaintAction.dragging = true;
    var elem = gn(PaintAction.currentshape.getAttribute('parentid'));
    var state = SVG2Canvas.isCloseDPath(elem);
    Path.reshape(elem);
    var newstate = SVG2Canvas.isCloseDPath(elem);
    if (state != newstate) {
        PaintAction.playSnapSound(state);
    }
    if (SVG2Canvas.isCloseDPath(elem)) {
        return;
    }
    if (!Path.isTip(PaintAction.currentshape)) {
        return;
    }
    Ghost.clearLayer();
    var mt = Path.getClosestPath(pt, elem, gn('layer1'), Path.maxDistance());
    if (!mt) {
        return;
    }
    var g = SVGTools.createGroup(gn('draglayer'), 'cusorstate');
    Ghost.getKid(g, mt, 0.7);
    PaintAction.target = mt;
};

PaintAction.playSnapSound = function (state) {
    ScratchAudio.sndFX(state ? 'cut.wav' : 'snap.wav');
};

PaintAction.movePointByDrag = function (dx, dy) {
    var cx = PaintAction.currentshape.getAttribute('cx');
    var cy = PaintAction.currentshape.getAttribute('cy');
    var newcx = Number(cx) + dx;
    var newcy = Number(cy) + dy;
    PaintAction.currentshape.setAttributeNS(null, 'cx', newcx);
    PaintAction.currentshape.setAttributeNS(null, 'cy', newcy);
};


//Calls from the Mouse Up


PaintAction.rectMouseUp = function (evt) {
    var w = Number(PaintAction.currentshape.getAttribute('width'));
    var h = Number(PaintAction.currentshape.getAttribute('height'));
    var x = Number(PaintAction.currentshape.getAttribute('x'));
    var y = Number(PaintAction.currentshape.getAttribute('y'));
    var pl = [{
        x: x,
        y: y
    }, {
        x: x + w,
        y: y
    }, {
        x: x + w,
        y: y + h
    }, {
        x: x,
        y: y + h
    }];
    var shape = Path.makeRectangle(PaintAction.currentshape.parentNode, pl);
    PaintAction.currentshape.parentNode.removeChild(PaintAction.currentshape);
    PaintAction.currentshape = shape;
    var box = SVGTools.getBox(PaintAction.currentshape);
    if (SVGTools.notValidBox(box) || box.isEmpty()) {
        PaintAction.removeShape(evt);
    }
};

PaintAction.triMouseUp = function (evt) {
    var box = SVGTools.getBox(PaintAction.currentshape);
    if (SVGTools.notValidBox(box)) {
        PaintAction.removeShape(evt);
    }
};

PaintAction.ellipseMouseUp = function (evt) {
    var box = SVGTools.getBox(PaintAction.currentshape);
    if (SVGTools.notValidBox(box)) {
        PaintAction.removeShape(evt);
    } else {
        var shape = Path.makeEllipse(PaintAction.currentshape);
        PaintAction.currentshape.parentNode.removeChild(PaintAction.currentshape);
        PaintAction.currentshape = shape;
    }
};

PaintAction.rotateMouseUp = function (evt) {
    if (!PaintAction.currentshape) {
        return;
    }
    if (!PaintAction.dragging) {
        return;
    }
    PaintAction.rotateFromMouse(evt, PaintAction.currentshape);
    var erot = Transform.getRotation(PaintAction.currentshape);
    for (var i = 0; i < PaintAction.dragGroup.length; i++) {
        gn('layer1').appendChild(PaintAction.dragGroup[i]);
        if (erot.angle != 0) {
            Transform.rotateFromPoint(erot, PaintAction.dragGroup[i]);
        }
    }
    gn('layer1').removeChild(PaintAction.currentshape);
    PaintAction.currentshape = PaintAction.target;
};

PaintAction.pathMouseUp = function (evt) {
    if (PaintAction.dragging) {
        PaintAction.currentshape = Path.process(PaintAction.currentshape);
        var box1 = SVGTools.getBox(PaintAction.currentshape);
        var box2 = new Rectangle(0, 0, Paint.workspaceWidth, Paint.workspaceHeight);
        if (!box1.intersects(box2)) {
            PaintAction.removeShape(evt); // outside the working area
        } else if (!SVG2Canvas.isCloseDPath(PaintAction.currentshape)) { // check if it is a join issue
            var pt = PaintAction.getScreenPt(evt);
            var mt = Path.getClosestPath(pt, PaintAction.currentshape,
                gn('layer1'), Path.maxDistance()); // check the end
            if (!mt) {
                pt = Path.getCommands(PaintAction.currentshape.getAttribute('d'))[0].pt;
                mt = Path.getClosestPath(pt,
                    PaintAction.currentshape, gn('layer1'), Path.maxDistance()); // check the start
            }
            var s = PaintAction.currentshape.getAttribute('stroke');
            var sw = PaintAction.currentshape.getAttribute('stroke-width');
            if (mt && (s == mt.getAttribute('stroke')) && (sw == mt.getAttribute('stroke-width'))) {
                PaintAction.currentshape = Path.join(PaintAction.currentshape, mt, pt);
            }
            if (gn('staticbkg')) {
                Path.checkBackgroundCrop(PaintAction.currentshape);
            }
        }
    } else {
        PaintAction.removeShape(evt);
    }
};

PaintAction.selectMouseUp = function (evt) {
    if (PaintAction.timeoutEvent) {
        clearTimeout(PaintAction.timeoutEvent);
    }
    // do not clear the time out -- let click check for it.
    if (PaintAction.dragging) {
        PaintAction.stopDrag();
    } else {
        PaintAction.fingerUp(evt);
        if (Path.selector && (Path.selector != PaintAction.currentshape)) {
            Path.quitEditMode();
        }
        if (!PaintAction.currentshape) {
            return;
        }
        if (PaintAction.dragging && !Path.selector) {
            Path.enterEditMode(PaintAction.currentshape);
        }
    }
};

PaintAction.scissorsMouseUp = function (evt) {
    PaintAction.fingerUp(evt);
    PaintAction.selectTarget();
    if (PaintAction.currentshape && (PaintAction.currentshape.id == 'fixed')) {
        PaintAction.currentshape = null;
    }
    if (!PaintAction.currentshape) {
        return;
    }
    ScratchAudio.sndFX('cut.wav');
    var mtimage = SVGImage.getImage(PaintAction.currentshape);
    var p = PaintAction.currentshape.parentNode;
    var res = [];
    for (var i = 0; i < p.childElementCount; i++) { // remove compound paths extras
        var kid = p.childNodes[i];
        if (kid.getAttribute('relatedto') == PaintAction.currentshape.id) {
            res.push(kid);
        }
    }
    for (var j = 0; j < res.length; j++) {
        p.removeChild(res[j]);
    }
    if (mtimage) {
        SVGImage.removeClip(mtimage);
    } else if (PaintAction.currentshape.parentNode) {
        PaintAction.currentshape.parentNode.removeChild(PaintAction.currentshape);
    }
    SVGTools.cleanup(gn('layer1'));
    PaintUndo.record();
};

PaintAction.cameraMouseUp = function (evt) {
    if (isTablet) {
        PaintAction.fingerUp(evt);
    }
    if (PaintAction.currentshape == undefined) {
        return;
    }
    Camera.startFeed(PaintAction.currentshape);
    ScratchJr.onBackButtonCallback.push(function () {
        Paint.closeCameraMode();
    });
};

PaintAction.cloneMouseUp = function (evt) {
    PaintAction.fingerUp(evt);
    PaintAction.selectTarget();
    if (PaintAction.currentshape && (PaintAction.currentshape.id == 'staticbkg')) {
        PaintAction.currentshape = null;
    }
    if (!PaintAction.currentshape) {
        return;
    }
    ScratchAudio.sndFX('copy.wav');
    SVGTools.cloneSVGelement(PaintAction.currentshape);
    Ghost.clearLayer();
    PaintUndo.record();
    PaintAction.backToSelect(evt);
};

PaintAction.setStrokeSizeAndColor = function () {
    if (!PaintAction.currentshape) {
        return;
    }
    if ((PaintAction.currentshape.getAttribute('stroke') == Paint.fillcolor)
        && (PaintAction.currentshape.getAttribute('stroke-width') == Paint.strokewidth)) {
        return;
    }
    var stroke = PaintAction.currentshape.getAttribute('stroke');
    if (!stroke) {
        PaintAction.currentshape = gn(PaintAction.currentshape.id + 'Border') ?
            gn(PaintAction.currentshape.id + 'Border') : PaintAction.currentshape;
        if (PaintAction.currentshape.id.indexOf('Border') > -1) {
            PaintAction.currentshape.setAttribute('fill', Paint.fillcolor);
        }
    } else {
        PaintAction.currentshape.setAttribute('stroke', Paint.fillcolor);
        PaintAction.currentshape.setAttribute('stroke-width', Paint.strokewidth);
    }
    PaintUndo.record();
};

PaintAction.paintBucketMouseUp = function (evt) {
    PaintAction.fingerUp(evt);
    if (!PaintAction.currentshape) {
        return;
    }
    PaintAction.paintRegion(evt);
};

PaintAction.paintRegion = function () {
    ScratchAudio.sndFX('splash.wav');
    switch (PaintAction.getPaintType()) {
    case 'paths':
        Path.setData(PaintAction.currentshape);
        break;
    case 'image':
        var mt = SVGImage.getImage(PaintAction.currentshape);
        SVGImage.paint(mt);
        break;
    case 'check': // if the stroke and fill are the same and they are "relatedto" paths stokes needs to be changed too.
        var group = Layer.findGroup(PaintAction.currentshape);
        for (var i = 0; i < group.length; i++) {
            if ((group[i].id == PaintAction.currentshape.id) ||
                (group[i].getAttribute('relatedto') == PaintAction.currentshape.id)) {
                group[i].setAttribute('stroke', Paint.fillcolor);
            }
        }
        break;
    default:
        break;
    }
    PaintAction.currentshape.setAttribute('fill', Paint.fillcolor);
    PaintUndo.record();
};

PaintAction.getPaintType = function () {
    var mtimage = SVGImage.getImage(PaintAction.currentshape);
    if (mtimage) {
        return 'image';
    }
    if (!PaintAction.justPaint(PaintAction.currentshape)) {
        return 'paths';
    }
    if ((PaintAction.currentshape.getAttribute('fill') == null)
        && (PaintAction.currentshape.getAttribute('stroke') == null)) {
        return 'paths';
    }
    if (PaintAction.currentshape.getAttribute('fill') == PaintAction.currentshape.getAttribute('stroke')) {
        return 'check';
    }
    return 'none';
};

PaintAction.justPaint = function (mt) {
    //only compound the ones created with this tool
    if (mt.tagName != 'path') {
        return true;
    }
    if (SVG2Canvas.isCompoundPath(mt)) {
        return true;
    }
    return (mt.getAttribute('fill') != 'none') || (mt.getAttribute('fill') != null);
};

PaintAction.stopDrag = function () {
    if (!PaintAction.dragging) {
        return;
    }
    if (PaintAction.dragGroup.length == 0) {
        return;
    }
    for (var i = 0; i < PaintAction.dragGroup.length; i++) {
        Transform.eleminateTranslates(PaintAction.dragGroup[i]);
    }
    var box1 = SVGTools.getTransformedBox(PaintAction.dragGroup[0]);
    var box2 = {
        x: 0,
        y: 0,
        width: Paint.workspaceWidth,
        height: Paint.workspaceHeight
    };
    for (var j = 1; j < PaintAction.dragGroup.length; j++) {
        box1 = box1.union(
            SVGTools.getTransformedBox(PaintAction.dragGroup[j]).expandBy(
                SVGTools.getPenWidthForm(PaintAction.dragGroup[j])));
    }
    if (!box1.intersects(box2)) {
        ScratchAudio.sndFX('boing.wav');
        var delta = {
            x: 0,
            y: 0
        };
        if (box1.x > Paint.workspaceWidth) {
            delta.x = Math.floor(Paint.workspaceWidth - box1.x - box1.width * 0.25);
        }
        if (box1.y > box2.height) {
            delta.y = Math.floor(Paint.workspaceHeight - box1.y - box1.height * 0.25);
        }
        if (box1.x < 0) {
            delta.x = Math.floor(-box1.x - box1.width * 0.75);
        }
        if (box1.y < 0) {
            delta.y = Math.floor(-box1.y - box1.height * 0.75);
        }
        xform.setTranslate(delta.x, delta.y);
        for (var k = 0; k < PaintAction.dragGroup.length; k++) {
            Transform.translateTo(PaintAction.dragGroup[k], xform);
        }
    }
    PaintAction.dragGroup = [];
};

PaintAction.ignoreEvt = function () {};

PaintAction.backToSelect = function () {
    Paint.selectButton('select');
};

PaintAction.grabMouseUp = function (evt) {
    var elem = gn(PaintAction.currentshape.getAttribute('parentid'));
    PaintAction.currentshape.setAttributeNS(null, 'fill', Path.getDotColor(elem, PaintAction.currentshape));
    PaintAction.currentshape.setAttributeNS(null, 'r', PaintAction.currentshape.getAttribute('r') / 1.5);
    var pt = PaintAction.getScreenPt(evt);
    if (!PaintAction.dragging) {
        Path.deleteDot(PaintAction.currentshape, elem);
    } else {
        var delta = Vector.diff(pt, Paint.deltaPoint);
        PaintAction.movePointByDrag(delta.x, delta.y);
        Path.reshape(elem);
        if (Path.isTip(PaintAction.currentshape) && !SVG2Canvas.isCloseDPath(elem)) {
            var mt = Path.getClosestPath(pt, elem, gn('layer1'), Path.maxDistance());
            if (!mt) {
                return;
            }
            if (mt != elem) {
                elem = Path.join(elem, mt, pt);
            }
        }
        Path.showDots(elem);
    }
};

/////////////////////////////////////////////
//Calls for click


PaintAction.removeShape = function () {
    if (PaintAction.currentshape == undefined) {
        return;
    }
    PaintAction.currentshape.parentNode.removeChild(PaintAction.currentshape);
    PaintAction.currentshape = undefined;
};

PaintAction.rectClick = function (evt) {
    if (!PaintAction.currentshape) {
        return;
    }
    PaintAction.removeShape(evt);
    PaintAction.currentshape = SVGTools.addRect(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
    var c = PaintAction.currentshape.getAttribute('stroke');
    var attr = {
        'width': 16 / Paint.currentZoom,
        'height': 16 / Paint.currentZoom
    };
    for (var val in attr) {
        PaintAction.currentshape.setAttribute(val, attr[val]);
    }
    PaintAction.rectMouseUp(evt);
    attr = {
        'fill': c,
        'stroke-width': 4
    };
    for (var vl in attr) {
        PaintAction.currentshape.setAttribute(vl, attr[vl]);
    }
    PaintUndo.record();
};

PaintAction.ellipseClick = function (evt) {
    if (!PaintAction.currentshape) {
        return;
    }
    PaintAction.removeShape(evt);
    PaintAction.currentshape = SVGTools.addEllipse(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
    var c = PaintAction.currentshape.getAttribute('stroke');
    var attr = {
        'rx': 8 / Paint.currentZoom,
        'ry': 8 / Paint.currentZoom
    };
    for (var val in attr) {
        PaintAction.currentshape.setAttribute(val, attr[val]);
    }
    PaintAction.ellipseMouseUp(evt);
    attr = {
        'fill': c,
        'stroke-width': 4
    };
    for (var vl in attr) {
        PaintAction.currentshape.setAttribute(vl, attr[vl]);
    }
    PaintUndo.record();
};

PaintAction.pathClick = function (evt) {
    PaintAction.currentshape = Ghost.findWho(evt);
    if (!PaintAction.currentshape) {
        return;
    }
    if (PaintAction.currentshape.getAttribute('fixed') != 'yes') {
        PaintAction.setStrokeSizeAndColor();
    }
};

PaintAction.triClick = function (evt) {
    if (!PaintAction.currentshape) {
        return;
    }
    PaintAction.removeShape(evt);
    PaintAction.currentshape = SVGTools.addTriangle(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
    var w = 16 / Paint.currentZoom;
    var h = 16 / Paint.currentZoom;
    var x = Paint.initialPoint.x;
    var y = Paint.initialPoint.y;
    var cmds = [['M', x, y + h], ['L', x + w * 0.5, y], ['L', x + w, y + h], ['L', x, y + h]];
    var d = SVG2Canvas.arrayToString(cmds);
    d += 'z';
    var c = PaintAction.currentshape.getAttribute('stroke');
    var attr = {
        'fill': c,
        'stroke-width': 2,
        'd': d
    };
    for (var val in attr) {
        PaintAction.currentshape.setAttribute(val, attr[val]);
    }
    PaintUndo.record();
};

PaintAction.selectClick = function (evt) {
    if (!PaintAction.timeoutEvent) {
        return;
    }
    PaintAction.timeoutEvent = undefined;
    if (!PaintAction.currentshape) {
        return;
    }
    if (PaintAction.currentshape && PaintAction.currentshape.parentNode &&
        (PaintAction.currentshape.parentNode.tagName == 'g') && (PaintAction.currentshape.parentNode.id != 'layer1')) {
        return;
    }
    if (PaintAction.currentshape && (PaintAction.currentshape.id == 'staticbkg')) {
        return;
    }
    if (PaintAction.currentshape && (PaintAction.currentshape.tagName == 'g')) {
        return;
    }
    var pt = PaintAction.getScreenPt(evt);
    var delta = Vector.len(Vector.diff(pt, Paint.initialPoint));
    if (delta > PaintAction.mindist) {
        return;
    }
    if (Path.selector && (Path.selector == PaintAction.currentshape)) {
        Path.addDot(Path.selector);
    }
    if (!Path.selector) {
        Path.enterEditMode(PaintAction.currentshape);
    }
};

PaintAction.paintBucketClick = function () {};


//Mouse Targets and groups
///////////////////////////

PaintAction.getMouseTarget = function (evt) {
    var mt;
    if (evt == null) {
        return null;
    }
    if (window.event) {
        mt = window.event.srcElement;
    } else {
        mt = evt.target;
    }
    if (!mt) {
        return null;
    }
    if (mt.correspondingUseElement) {
        mt = mt.correspondingUseElement;
    }
    if (mt.id == 'maincanvas') {
        return mt.childNodes[0];
    }
    if (mt.id == 'workspacebkg') {
        return mt;
    }
    while (mt && (Paint.xmlns != mt.namespaceURI) && (mt != Paint.root) && (mt != frame)) {
        mt = mt.parentNode;
    }
    if (!mt) {
        return null;
    }
    if (!mt.parentNode) {
        return null;
    }
    if ((mt.parentNode.id).indexOf('group_') > -1) {
        return mt.parentNode;
    }
    return mt;
};

PaintAction.getScreenPt = function (evt) {
    var pt = Events.getTargetPoint(evt);
    return PaintAction.zoomPt(pt);
};

PaintAction.zoomPt = function (pt) {
    var mc = gn('maincanvas');
    if (!mc) {
        return pt;
    }
    var pt2 = Paint.root.createSVGPoint();
    pt2.x = pt.x;
    pt2.y = pt.y;
    var globalPoint = pt2.matrixTransform(Paint.root.getScreenCTM().inverse());
    globalPoint.x = globalPoint.x / Paint.currentZoom;
    globalPoint.y = globalPoint.y / Paint.currentZoom;
    return globalPoint;
};

/////////////////////////////////////////////////////////
//dispatch tables



PaintAction.cmdForMouseDown = {
    'select': PaintAction.selectMouseDown,
    'rotate': PaintAction.fingerDown,
    'tri': PaintAction.triMouseDown,
    'rect': PaintAction.rectMouseDown,
    'path': PaintAction.pathMouseDown,
    'ellipse': PaintAction.ellipseMouseDown,
    'grab': PaintAction.grabMouseDown,
    'paintbucket': PaintAction.fingerDown,
    'stamper': PaintAction.cloneMouseDown,
    'scissors': PaintAction.cloneMouseDown,
    'camera': PaintAction.fingerDown
};

PaintAction.cmdForMouseMove = {
    'select': PaintAction.selectMouseMove,
    'rotate': PaintAction.rotateMouseMove,
    'tri': PaintAction.triMouseMove,
    'rect': PaintAction.rectMouseMove,
    'path': PaintAction.pathMouseMove,
    'ellipse': PaintAction.ellipseMouseMove,
    'grab': PaintAction.grabMouseMove,
    'paintbucket': PaintAction.paintBucketMouseMove,
    'stamper': PaintAction.cloneMouseMove,
    'scissors': PaintAction.cloneMouseMove,
    'camera': PaintAction.fingerMove
};

PaintAction.cmdForMouseUp = {
    'select': PaintAction.selectMouseUp,
    'rotate': PaintAction.rotateMouseUp,
    'tri': PaintAction.triMouseUp,
    'rect': PaintAction.rectMouseUp,
    'path': PaintAction.pathMouseUp,
    'ellipse': PaintAction.ellipseMouseUp,
    'grab': PaintAction.grabMouseUp,
    'paintbucket': PaintAction.paintBucketMouseUp,
    'stamper': PaintAction.ignoreEvt,
    'scissors': PaintAction.scissorsMouseUp,
    'camera': PaintAction.cameraMouseUp
};

PaintAction.cmdForClick = {
    'select': PaintAction.selectClick,
    'rotate': PaintAction.ignoreEvt,
    'tri': PaintAction.triClick,
    'rect': PaintAction.rectClick,
    'path': PaintAction.pathClick,
    'ellipse': PaintAction.ellipseClick,
    'grab': PaintAction.ignoreEvt,
    'paintbucket': PaintAction.paintBucketClick,
    'stamper': PaintAction.cloneMouseUp,
    'scissors': PaintAction.ignoreEvt,
    'camera': PaintAction.ignoreEvt
};
