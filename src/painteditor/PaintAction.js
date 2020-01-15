import ScratchJr from '../editor/ScratchJr';
import Paint from './Paint';
import PaintUndo from './PaintUndo';
import ScratchAudio from '../utils/ScratchAudio';
import SVGTools from './SVGTools';
import Path from './Path';
import Transform from './Transform';
import Ghost from './Ghost';
import Vector from '../geom/Vector';
import Layer from './Layer';
import SVG2Canvas from '../utils/SVG2Canvas';
import SVGImage from './SVGImage';
import Camera from './Camera';
import Events from '../utils/Events';
import Rectangle from '../geom/Rectangle';
import {gn, isTablet, getIdFor} from '../utils/lib';
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

let currentShape = undefined;
let target = undefined;
let dragGroup = [];
let startAngle = 0;
let dragging = false;
let timeoutEvent;
let mindist = 10;


//Main Events
/////////////////////////////////

export default class PaintAction {
    // Getters/setters for globally used properties
    static set target (newTarget) {
        target = newTarget;
    }

    static get dragGroup () {
        return dragGroup;
    }

    static mouseDown (evt) {
        target = undefined;
        if (!gn('layer1')) {
            return;
        }
        if (evt.touches && (evt.touches.length > 1)) {
            return;
        }
        PaintAction.clearDragGroup();
        dragging = false;
        var mt = PaintAction.getMouseTarget(evt);
        if (!mt) {
            return;
        }
        if ((mt.tagName.toLowerCase() != 'div') && (mt.tagName.toLowerCase() != 'svg')) {
            target = mt;
        }
        evt.preventDefault();
        Paint.initialPoint = PaintAction.getScreenPt(evt);
        Paint.deltaPoint = PaintAction.getScreenPt(evt);
        if (Path.hitDot(evt)) {
            Paint.mode = 'grab';
        }
        currentShape = undefined;
        PaintAction.clearEvents();
        cmdForMouseDown[Paint.mode](evt);
        PaintAction.setEvents();
    }

    static clearDragGroup () {
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
    }

    static clearEvents () {
        currentShape = undefined;
        window.ontouchmove = undefined;
        window.ontouchend = undefined;
    }

    static stopAction (e) {
        var list = ['path', 'ellipse', 'rect', 'tri'];
        var isCreator = list.indexOf(Paint.mode) > -1;
        if (currentShape && currentShape.parentNode && isCreator) {
            PaintAction.removeShape(null);
        } else {
            // olnly select, grab and rotate need special treatment
            var othertools = ['select', 'grab', 'rotate'];
            if (othertools.indexOf(Paint.mode) < 0) {
                return;
            }

            if (Paint.mode == 'select') {
                if (timeoutEvent) {
                    clearTimeout(timeoutEvent);
                }
                if (dragging) {
                    PaintAction.stopDrag();
                }
            }
            if ((Paint.mode == 'grab') || (Paint.mode == 'rotate')) {
                cmdForMouseUp[Paint.mode](e);
            }
            Ghost.clearLayer();
            if (target || currentShape) {
                PaintUndo.record();
            }
            Transform.updateAll(currentShape);
            Ghost.drawOffscreen();
        }
    }

    static setEvents () {
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
    }

    static mouseMove (evt) {
        evt.preventDefault();
        cmdForMouseMove[Paint.mode](evt);
        Paint.deltaPoint = PaintAction.getScreenPt(evt);
    }

    static mouseUp (evt) {
        evt.preventDefault();
        cmdForMouseUp[Paint.mode](evt);
        Ghost.clearLayer();
        if (!dragging) {
            var mt = PaintAction.getMouseTarget(evt);
            if (mt) {
                cmdForClick[Paint.mode](evt);
            }
        } else if (target || currentShape) {
            PaintUndo.record();
        }
        if (Paint.mode == 'grab') {
            Paint.mode = 'select';
        }
        var oldshape = currentShape;
        currentShape = undefined;
        dragGroup = [];
        dragging = false;
        Transform.updateAll(oldshape);
        PaintAction.clearEvents();
        Ghost.drawOffscreen();
    }


    //Calls from the Mouse Down


    static selectMouseDown (evt) {
        PaintAction.fingerDown(evt);
        if (currentShape) {
            currentShape = currentShape.getAttribute('stencil') == 'yes' ?
                null : currentShape;
        }
        var holdit = getValidHold();
        if (holdit) {
            PaintAction.startHold(evt);
        }
        function getValidHold () {
            if (!currentShape) {
                return false;
            }
            if (currentShape.getAttribute('stencil') == 'yes') {
                return false;
            }
            return true;
        }
    }

    static fingerDown (evt) { // Paint Target is the one given by the
        currentShape = Ghost.findTarget(evt);
        target = currentShape ? currentShape : target;
        dragGroup = [];
    }

    static fingerUp (evt) {
        currentShape = undefined;
        target = undefined;
        PaintAction.fingerDown(evt);
    }

    static startHold () {
        //  console.log ("startHold", currentShape);
        if (!currentShape) {
            return;
        }
        var repeat = function () {
            //	console.log ("callback", currentShape);
            Layer.bringToFront(currentShape);
            timeoutEvent = null;
        };
        timeoutEvent = setTimeout(repeat, 600);
    }

    static cloneMouseDown (evt) {
        PaintAction.fingerDown(evt);
        PaintAction.selectTarget();
        if (currentShape && (currentShape.id == 'staticbkg')) {
            currentShape = null;
        }
    }

    static pathMouseDown () {
        currentShape = SVGTools.addPolyline(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
        var mt = Path.getClosestPath(Paint.initialPoint, currentShape, gn('layer1'), Path.maxDistance());
        if (!mt) {
            return;
        }
        var s = currentShape.getAttribute('stroke');
        var sw = currentShape.getAttribute('stroke-width');
        if ((s != mt.getAttribute('stroke')) || (sw != mt.getAttribute('stroke-width'))) {
            return;
        }
        var g = SVGTools.createGroup(gn('draglayer'), 'cusorstate');
        Ghost.getKid(g, mt, 0.7);
        target = mt;
    }

    static selectTarget () {
        if (!currentShape) {
            return;
        }
        while ((currentShape.parentNode.tagName == 'g')
                && (currentShape.parentNode.id != 'layer1')) {
            currentShape = currentShape.parentNode;
        }
    }

    static makeAgroup (group) {
        var p = gn('layer1');
        var g = SVGTools.createGroup(p, getIdFor('group'));
        for (var i = 0; i < group.length; i++) {
            p.removeChild(group[i]);
            g.appendChild(group[i]);
        }
        return g;
    }

    static ellipseMouseDown () {
        currentShape = SVGTools.addEllipse(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
    }
    static rectMouseDown () {
        currentShape = SVGTools.addRect(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
    }
    static triMouseDown () {
        currentShape = SVGTools.addTriangle(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
    }

    static grabMouseDown () {
        currentShape = target;
        currentShape.setAttributeNS(null, 'fill', Path.selectedDotColor);
        currentShape.setAttributeNS(null, 'r', currentShape.getAttribute('r') * 1.5);
    }


    //Calls from the Mouse Move


    static selectMouseMove (evt) {
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
    }

    static moveObject (evt) {
        if (!target) {
            return;
        }
        var pt = PaintAction.getScreenPt(evt);
        var delta = Vector.diff(pt, Paint.initialPoint);
        if (!dragging && (Vector.len(delta) > mindist)) {
            PaintAction.startDragShape(evt);
        }
        if (!dragging) {
            return;
        }
        for (var i = 0; i < dragGroup.length; i++) {
            Transform.extract(dragGroup[i], 2).setTranslate(delta.x, delta.y);
        }
        Transform.extract(gn('ghostgroup'), 2).setTranslate(delta.x, delta.y);
    }

    static onBackground () {
        if (!currentShape) {
            return true;
        }
        if ((target.id.indexOf('staticbkg') > -1)
            || (currentShape.getAttribute('stencil') == 'yes')) {
            return true;
        }
        return false;
    }

    static paintBucketMouseMove (evt) {
        Ghost.findTarget(evt);
    }

    static isMoving (evt) {
        if (dragging) {
            return true;
        }
        var pt = PaintAction.getScreenPt(evt);
        var delta = Vector.diff(pt, Paint.initialPoint);
        return !dragging && (Vector.len(delta) > mindist);
    }

    static fingerMove (evt) {
        Ghost.findTarget(evt);
    }

    static cloneMouseMove (evt) {
        Ghost.findTarget(evt);
    }

    static startDragShape () {
        if (timeoutEvent) {
            clearTimeout(timeoutEvent);
        }
        PaintAction.selectTarget();
        timeoutEvent = undefined;
        Path.quitEditMode();
        dragGroup = Layer.findGroup(currentShape);
        for (var i = 0; i < dragGroup.length; i++) {
            Transform.eleminateTranslates(dragGroup[i]);
            gn('layer1').appendChild(dragGroup[i]);
        }
        Ghost.highlight(dragGroup);
        for (var j = 0; j < dragGroup.length; j++) {
            Transform.appendForMove(dragGroup[j], Transform.getTranslateTransform());
        }
        Transform.appendForMove(gn('ghostgroup'), Transform.getTranslateTransform());
        dragging = true;
    }

    static rotateMouseMove (evt) {
        if (!target) {
            return;
        }
        var pt = PaintAction.getScreenPt(evt);
        var delta = Vector.diff(pt, Paint.initialPoint);
        if (!dragging && (Vector.len(delta) > mindist)) {
            PaintAction.startRotateShape(evt);
        }
        if (!currentShape) {
            return;
        }
        if (!dragging) {
            return;
        }
        PaintAction.rotateFromMouse(evt, currentShape);
        PaintAction.rotateFromMouse(evt, gn('ghostgroup'));
    }

    static startRotateShape (evt) {
        PaintAction.selectTarget();
        if (!currentShape) {
            return;
        }
        if (currentShape && (currentShape.tagName.toLowerCase() == 'svg')) {
            currentShape = undefined;
        }
        if (PaintAction.onBackground()) {
            currentShape = undefined;
        }
        if (!currentShape) {
            return;
        }
        dragGroup = Layer.findGroup(currentShape);
        Ghost.highlight(dragGroup);
        currentShape = PaintAction.makeAgroup(dragGroup);
        var pt = PaintAction.getScreenPt(evt);
        var mtx = Transform.getCombinedMatrices(currentShape); // skips rotation matrices
        PaintAction.center = SVGTools.getBoxCenter(currentShape);
        var center = {
            x: PaintAction.center.x,
            y: PaintAction.center.y
        };
        center = Transform.point(center.x, center.y, mtx);
        var delta = Vector.diff(center, pt);
        startAngle = ((Math.atan2(delta.y, delta.x) * (180 / Math.PI))) % 360;
        startAngle -= 90;
        SVGTools.getBoxCenter(currentShape);
        dragging = true;
    }


    static rotateFromMouse (evt, elem) {
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
        angle -= startAngle;
        angle = (angle < 0) ? (360 + angle) : angle;
        angle = angle % 360;
        rot.setRotate(angle, center.x, center.y);
    }

    static rectMouseMove (evt) {
        var pt = PaintAction.getScreenPt(evt);
        var delta = Vector.diff(pt, Paint.initialPoint);
        if (!dragging && (Vector.len(delta) > mindist)) {
            dragging = true;
        }
        if (!dragging) {
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
            currentShape.setAttributeNS(null, val, attr[val]);
        }
    }

    static triMouseMove (evt) {
        var pt = PaintAction.getScreenPt(evt);
        var delta = Vector.diff(pt, Paint.initialPoint);
        if (!dragging && (Vector.len(delta) > mindist)) {
            dragging = true;
        }
        if (!dragging) {
            return;
        }
        var w = delta.x;
        var h = delta.y;
        var x = Paint.initialPoint.x;
        var y = Paint.initialPoint.y;
        var cmds = [['M', x, y + h], ['L', x + w * 0.5, y], ['L', x + w, y + h], ['L', x, y + h], ['z']];
        var d = SVG2Canvas.arrayToString(cmds);
        currentShape.setAttribute('d', d);
    }

    static pathMouseMove (evt) {
        var pt = PaintAction.getScreenPt(evt);
        var delta = Vector.diff(pt, Paint.initialPoint);
        if (!dragging && (Vector.len(delta) > mindist)) {
            dragging = true;
        }
        if (!dragging) {
            return;
        }
        var place = ' ' + pt.x + ',' + pt.y + ' ';
        var d = currentShape.getAttribute('points');
        d += place;
        currentShape.setAttributeNS(null, 'points', d);
    }

    static ellipseMouseMove (evt) {
        var pt = PaintAction.getScreenPt(evt);
        var delta = Vector.diff(pt, Paint.initialPoint);
        if (!dragging && (Vector.len(delta) > mindist)) {
            dragging = true;
        }
        if (!dragging) {
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
            currentShape.setAttributeNS(null, val, attr[val]);
        }
    }

    static grabMouseMove (evt) {
        var pt = PaintAction.getScreenPt(evt);
        var delta = Vector.diff(pt, Paint.deltaPoint);
        PaintAction.movePointByDrag(delta.x, delta.y);
        dragging = true;
        var elem = gn(currentShape.getAttribute('parentid'));
        var state = SVG2Canvas.isCloseDPath(elem);
        Path.reshape(elem);
        var newstate = SVG2Canvas.isCloseDPath(elem);
        if (state != newstate) {
            PaintAction.playSnapSound(state);
        }
        if (SVG2Canvas.isCloseDPath(elem)) {
            return;
        }
        if (!Path.isTip(currentShape)) {
            return;
        }
        Ghost.clearLayer();
        var mt = Path.getClosestPath(pt, elem, gn('layer1'), Path.maxDistance());
        if (!mt) {
            return;
        }
        var g = SVGTools.createGroup(gn('draglayer'), 'cusorstate');
        Ghost.getKid(g, mt, 0.7);
        target = mt;
    }

    static playSnapSound (state) {
        ScratchAudio.sndFX(state ? 'cut.wav' : 'snap.wav');
    }

    static movePointByDrag (dx, dy) {
        var cx = currentShape.getAttribute('cx');
        var cy = currentShape.getAttribute('cy');
        var newcx = Number(cx) + dx;
        var newcy = Number(cy) + dy;
        currentShape.setAttributeNS(null, 'cx', newcx);
        currentShape.setAttributeNS(null, 'cy', newcy);
    }


    //Calls from the Mouse Up


    static rectMouseUp (evt) {
        var w = Number(currentShape.getAttribute('width'));
        var h = Number(currentShape.getAttribute('height'));
        var x = Number(currentShape.getAttribute('x'));
        var y = Number(currentShape.getAttribute('y'));
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
        var shape = Path.makeRectangle(currentShape.parentNode, pl);
        currentShape.parentNode.removeChild(currentShape);
        currentShape = shape;
        var box = SVGTools.getBox(currentShape);
        if (SVGTools.notValidBox(box) || box.isEmpty()) {
            PaintAction.removeShape(evt);
        }
    }

    static triMouseUp (evt) {
        var box = SVGTools.getBox(currentShape);
        if (SVGTools.notValidBox(box)) {
            PaintAction.removeShape(evt);
        }
    }

    static ellipseMouseUp (evt) {
        var box = SVGTools.getBox(currentShape);
        if (SVGTools.notValidBox(box)) {
            PaintAction.removeShape(evt);
        } else {
            var shape = Path.makeEllipse(currentShape);
            currentShape.parentNode.removeChild(currentShape);
            currentShape = shape;
        }
    }

    static rotateMouseUp (evt) {
        if (!currentShape) {
            return;
        }
        if (!dragging) {
            return;
        }
        PaintAction.rotateFromMouse(evt, currentShape);
        var erot = Transform.getRotation(currentShape);
        for (var i = 0; i < dragGroup.length; i++) {
            gn('layer1').appendChild(dragGroup[i]);
            if (erot.angle != 0) {
                Transform.rotateFromPoint(erot, dragGroup[i]);
            }
        }
        gn('layer1').removeChild(currentShape);
        currentShape = target;
    }

    static pathMouseUp (evt) {
        if (dragging) {
            currentShape = Path.process(currentShape);
            var box1 = SVGTools.getBox(currentShape);
            var box2 = new Rectangle(0, 0, Paint.workspaceWidth, Paint.workspaceHeight);
            if (!box1.intersects(box2)) {
                PaintAction.removeShape(evt); // outside the working area
            } else if (!SVG2Canvas.isCloseDPath(currentShape)) { // check if it is a join issue
                var pt = PaintAction.getScreenPt(evt);
                var mt = Path.getClosestPath(pt, currentShape,
                    gn('layer1'), Path.maxDistance()); // check the end
                if (!mt) {
                    pt = Path.getCommands(currentShape.getAttribute('d'))[0].pt;
                    mt = Path.getClosestPath(pt,
                        currentShape, gn('layer1'), Path.maxDistance()); // check the start
                }
                var s = currentShape.getAttribute('stroke');
                var sw = currentShape.getAttribute('stroke-width');
                if (mt && (s == mt.getAttribute('stroke')) && (sw == mt.getAttribute('stroke-width'))) {
                    currentShape = Path.join(currentShape, mt, pt);
                }
                if (gn('staticbkg')) {
                    Path.checkBackgroundCrop(currentShape);
                }
            }
        } else {
            PaintAction.removeShape(evt);
        }
    }

    static selectMouseUp (evt) {
        if (timeoutEvent) {
            clearTimeout(timeoutEvent);
        }
        // do not clear the time out -- let click check for it.
        if (dragging) {
            PaintAction.stopDrag();
        } else {
            PaintAction.fingerUp(evt);
            if (Path.selector && (Path.selector != currentShape)) {
                Path.quitEditMode();
            }
            if (!currentShape) {
                return;
            }
            if (dragging && !Path.selector) {
                Path.enterEditMode(currentShape);
            }
        }
    }

    static scissorsMouseUp (evt) {
        PaintAction.fingerUp(evt);
        PaintAction.selectTarget();
        if (currentShape && (currentShape.id == 'fixed')) {
            currentShape = null;
        }
        if (!currentShape) {
            return;
        }
        ScratchAudio.sndFX('cut.wav');
        var mtimage = SVGImage.getImage(currentShape);
        var p = currentShape.parentNode;
        var res = [];
        for (var i = 0; i < p.childElementCount; i++) { // remove compound paths extras
            var kid = p.childNodes[i];
            if (kid.getAttribute('relatedto') == currentShape.id) {
                res.push(kid);
            }
        }
        for (var j = 0; j < res.length; j++) {
            p.removeChild(res[j]);
        }
        if (mtimage) {
            SVGImage.removeClip(mtimage);
        } else if (currentShape.parentNode) {
            currentShape.parentNode.removeChild(currentShape);
        }
        SVGTools.cleanup(gn('layer1'));
        PaintUndo.record();
    }

    static cameraMouseUp (evt) {
        if (isTablet) {
            PaintAction.fingerUp(evt);
        }
        if (currentShape == undefined) {
            return;
        }
        Camera.startFeed(currentShape);
        ScratchJr.onBackButtonCallback.push(function () {
            Paint.closeCameraMode();
        });
    }

    static cloneMouseUp (evt) {
        PaintAction.fingerUp(evt);
        PaintAction.selectTarget();
        if (currentShape && (currentShape.id == 'staticbkg')) {
            currentShape = null;
        }
        if (!currentShape) {
            return;
        }
        ScratchAudio.sndFX('copy.wav');
        SVGTools.cloneSVGelement(currentShape);
        Ghost.clearLayer();
        PaintUndo.record();
        PaintAction.backToSelect(evt);
    }

    static setStrokeSizeAndColor () {
        if (!currentShape) {
            return;
        }
        if ((currentShape.getAttribute('stroke') == Paint.fillcolor)
            && (currentShape.getAttribute('stroke-width') == Paint.strokewidth)) {
            return;
        }
        var stroke = currentShape.getAttribute('stroke');
        if (!stroke) {
            currentShape = gn(currentShape.id + 'Border') ?
                gn(currentShape.id + 'Border') : currentShape;
            if (currentShape.id.indexOf('Border') > -1) {
                currentShape.setAttribute('fill', Paint.fillcolor);
            }
        } else {
            currentShape.setAttribute('stroke', Paint.fillcolor);
            currentShape.setAttribute('stroke-width', Paint.strokewidth);
        }
        PaintUndo.record();
    }

    static paintBucketMouseUp (evt) {
        PaintAction.fingerUp(evt);
        if (!currentShape) {
            return;
        }
        PaintAction.paintRegion(evt);
    }

    static paintRegion () {
        ScratchAudio.sndFX('splash.wav');
        switch (PaintAction.getPaintType()) {
        case 'paths':
            Path.setData(currentShape);
            break;
        case 'image':
            var mt = SVGImage.getImage(currentShape);
            SVGImage.paint(mt);
            break;
        // if the stroke and fill are the same and they are "relatedto" paths stokes needs to be changed too.
        case 'check':
            var group = Layer.findGroup(currentShape);
            for (var i = 0; i < group.length; i++) {
                if ((group[i].id == currentShape.id) ||
                    (group[i].getAttribute('relatedto') == currentShape.id)) {
                    group[i].setAttribute('stroke', Paint.fillcolor);
                }
            }
            break;
        default:
            break;
        }
        currentShape.setAttribute('fill', Paint.fillcolor);
        PaintUndo.record();
    }

    static getPaintType () {
        var mtimage = SVGImage.getImage(currentShape);
        if (mtimage) {
            return 'image';
        }
        if (!PaintAction.justPaint(currentShape)) {
            return 'paths';
        }
        if ((currentShape.getAttribute('fill') == null)
            && (currentShape.getAttribute('stroke') == null)) {
            return 'paths';
        }
        if (currentShape.getAttribute('fill') == currentShape.getAttribute('stroke')) {
            return 'check';
        }
        return 'none';
    }

    static justPaint (mt) {
        //only compound the ones created with this tool
        if (mt.tagName != 'path') {
            return true;
        }
        if (SVG2Canvas.isCompoundPath(mt)) {
            return true;
        }
        return (mt.getAttribute('fill') != 'none') || (mt.getAttribute('fill') != null);
    }

    static stopDrag () {
        if (!dragging) {
            return;
        }
        if (dragGroup.length == 0) {
            return;
        }
        for (var i = 0; i < dragGroup.length; i++) {
            Transform.eleminateTranslates(dragGroup[i]);
        }
        var box1 = SVGTools.getTransformedBox(dragGroup[0]);
        var box2 = {
            x: 0,
            y: 0,
            width: Paint.workspaceWidth,
            height: Paint.workspaceHeight
        };
        for (var j = 1; j < dragGroup.length; j++) {
            box1 = box1.union(
                SVGTools.getTransformedBox(dragGroup[j]).expandBy(
                    SVGTools.getPenWidthForm(dragGroup[j])));
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
            window.xform.setTranslate(delta.x, delta.y);
            for (var k = 0; k < dragGroup.length; k++) {
                Transform.translateTo(dragGroup[k], window.xform);
            }
        }
        dragGroup = [];
    }

    static ignoreEvt () {}

    static backToSelect () {
        Paint.selectButton('select');
    }

    static grabMouseUp (evt) {
        var elem = gn(currentShape.getAttribute('parentid'));
        currentShape.setAttributeNS(null, 'fill', Path.getDotColor(elem, currentShape));
        currentShape.setAttributeNS(null, 'r', currentShape.getAttribute('r') / 1.5);
        var pt = PaintAction.getScreenPt(evt);
        if (!dragging) {
            Path.deleteDot(currentShape, elem);
        } else {
            var delta = Vector.diff(pt, Paint.deltaPoint);
            PaintAction.movePointByDrag(delta.x, delta.y);
            Path.reshape(elem);
            if (Path.isTip(currentShape) && !SVG2Canvas.isCloseDPath(elem)) {
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
    }

    /////////////////////////////////////////////
    //Calls for click


    static removeShape () {
        if (currentShape == undefined) {
            return;
        }
        currentShape.parentNode.removeChild(currentShape);
        currentShape = undefined;
    }

    static rectClick (evt) {
        if (!currentShape) {
            return;
        }
        PaintAction.removeShape(evt);
        currentShape = SVGTools.addRect(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
        var c = currentShape.getAttribute('stroke');
        var attr = {
            'width': 16 / Paint.currentZoom,
            'height': 16 / Paint.currentZoom
        };
        for (var val in attr) {
            currentShape.setAttribute(val, attr[val]);
        }
        PaintAction.rectMouseUp(evt);
        attr = {
            'fill': c,
            'stroke-width': 4
        };
        for (var vl in attr) {
            currentShape.setAttribute(vl, attr[vl]);
        }
        PaintUndo.record();
    }

    static ellipseClick (evt) {
        if (!currentShape) {
            return;
        }
        PaintAction.removeShape(evt);
        currentShape = SVGTools.addEllipse(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
        var c = currentShape.getAttribute('stroke');
        var attr = {
            'rx': 8 / Paint.currentZoom,
            'ry': 8 / Paint.currentZoom
        };
        for (var val in attr) {
            currentShape.setAttribute(val, attr[val]);
        }
        PaintAction.ellipseMouseUp(evt);
        attr = {
            'fill': c,
            'stroke-width': 4
        };
        for (var vl in attr) {
            currentShape.setAttribute(vl, attr[vl]);
        }
        PaintUndo.record();
    }

    static pathClick (evt) {
        currentShape = Ghost.findWho(evt);
        if (!currentShape) {
            return;
        }
        if (currentShape.getAttribute('fixed') != 'yes') {
            PaintAction.setStrokeSizeAndColor();
        }
    }

    static triClick (evt) {
        if (!currentShape) {
            return;
        }
        PaintAction.removeShape(evt);
        currentShape = SVGTools.addTriangle(gn('layer1'), Paint.initialPoint.x, Paint.initialPoint.y);
        var w = 16 / Paint.currentZoom;
        var h = 16 / Paint.currentZoom;
        var x = Paint.initialPoint.x;
        var y = Paint.initialPoint.y;
        var cmds = [['M', x, y + h], ['L', x + w * 0.5, y], ['L', x + w, y + h], ['L', x, y + h]];
        var d = SVG2Canvas.arrayToString(cmds);
        d += 'z';
        var c = currentShape.getAttribute('stroke');
        var attr = {
            'fill': c,
            'stroke-width': 2,
            'd': d
        };
        for (var val in attr) {
            currentShape.setAttribute(val, attr[val]);
        }
        PaintUndo.record();
    }

    static selectClick (evt) {
        if (!timeoutEvent) {
            return;
        }
        timeoutEvent = undefined;
        if (!currentShape) {
            return;
        }
        if (currentShape && currentShape.parentNode &&
            (currentShape.parentNode.tagName == 'g') && (currentShape.parentNode.id != 'layer1')) {
            return;
        }
        if (currentShape && (currentShape.id == 'staticbkg')) {
            return;
        }
        if (currentShape && (currentShape.tagName == 'g')) {
            return;
        }
        var pt = PaintAction.getScreenPt(evt);
        var delta = Vector.len(Vector.diff(pt, Paint.initialPoint));
        if (delta > mindist) {
            return;
        }
        if (Path.selector && (Path.selector == currentShape)) {
            Path.addDot(Path.selector);
        }
        if (!Path.selector) {
            Path.enterEditMode(currentShape);
        }
    }

    static paintBucketClick () {}


    //Mouse Targets and groups
    ///////////////////////////

    static getMouseTarget (evt) {
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
        while (mt && (Paint.xmlns != mt.namespaceURI) && (mt != Paint.root) && (mt != Paint.frame)) {
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
    }

    static getScreenPt (evt) {
        var pt = Events.getTargetPoint(evt);
        return PaintAction.zoomPt(pt);
    }

    static zoomPt (pt) {
        var mc = gn('maincanvas');
        if (!mc) {
            return pt;
        }
        var pt2 = Paint.root.createSVGPoint();
        pt2.x = pt.x;
        pt2.y = pt.y;
        var screenMatrix = Paint.root.getScreenCTM();
        var globalPoint = pt2.matrixTransform(screenMatrix.inverse());
        // screenMatrix should include the currentScale, if it doesn't match, apply scaling
        if (screenMatrix.a != Paint.currentZoom) {
            globalPoint.x = globalPoint.x / Paint.currentZoom;
            globalPoint.y = globalPoint.y / Paint.currentZoom;
        }
        return globalPoint;
    }
}
/////////////////////////////////////////////////////////
//dispatch tables



let cmdForMouseDown = {
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

let cmdForMouseMove = {
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

let cmdForMouseUp = {
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

let cmdForClick = {
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
