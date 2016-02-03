import ScratchJr from '../editor/ScratchJr';
import Paint from './Paint';
import PaintUndo from './PaintUndo';
import Path from './Path';
import SVGTools from './SVGTools';
import SVGImage from './SVGImage';
import SVG2Canvas from '../utils/SVG2Canvas';
import Transform from './Transform';
import {gn, setCanvasSize, newDiv, DEGTOR} from '../utils/lib';

let targetOffscreen = document.createElement('canvas');
let offscreen = document.createElement('canvas');

export default class Layer {
    static bringToFront (elem) {
        if (!elem) {
            return;
        }
        if (elem.getAttribute('fixed') == 'yes') {
            return;
        }
        if (!elem.parentNode) {
            return;
        }
        while (elem.parentNode && (elem.parentNode.id != 'layer1')) {
            elem = elem.parentNode;
        }
        var index = Layer.groupStartsAt(gn('layer1'), elem);
        var group = Layer.onTopOfBy(gn('layer1'), elem, 1, index, Layer.getRelated(elem));
        var p = elem.parentNode;
        for (var i = 0; i < group.length; i++) {
            p.appendChild(group[i]);
        }
        if (group.length > 1) {
            PaintUndo.record();
        }
    }

    static bringElementsToFront () {
        var res = [];
        for (var i = 0; i < gn('layer1').childElementCount; i++) {
            var mt = gn('layer1').childNodes[i];
            if (mt.getAttribute('fixed') == 'yes') {
                continue;
            }
            if (mt.getAttribute('stencil') == 'yes') {
                continue;
            }
            res.push(mt);
        }
        for (i = 0; i < res.length; i++) {
            gn('layer1').appendChild(res[i]);
        }
    }

    static onTopOf (p, index) {
        var res = [];
        for (var i = index; i < p.childElementCount; i++) {
            res.push(p.childNodes[i]);
        }
        return res;
    }

    static ordering (p, nl) {
        var res = [];
        for (var i = 0; i < p.childElementCount; i++) {
            if (nl.indexOf(p.childNodes[i]) > -1) {
                res.push(p.childNodes[i]);
            }
        }
        return res;
    }

    static groupStartsAt (p, mt) {
        for (var i = 0; i < p.childElementCount; i++) {
            if (p.childNodes[i] == mt) {
                return i;
            }
        }
        return i;
    }

    // use to be 0.5 overlap but it was too slow
    // there may be case which will miss
    // this comparision is quite slow.

    static onTopOfBy (p, mt, factor, n, list) {
        n = Math.max(0, n);
        Layer.drawInOffscreen(mt, targetOffscreen);
        for (var i = n; i < p.childElementCount; i++) {
            var elem = p.childNodes[i];
            if (elem.getAttribute('stencil') == 'yes') {
                continue;
            }
            if (elem.getAttribute('fixed') == 'yes') {
                continue;
            }
            if (elem.nodeName == 'clipPath') {
                continue;
            }
            if (elem.nodeName == 'image') {
                continue;
            }
            if (elem.id.indexOf('group_image_') > -1) {
                continue;
            }
            if (list.indexOf(elem) > -1) {
                continue;
            }
            var overlap = Layer.overlapBox(mt, elem);
            if (overlap == 1) {
                var touched = Layer.verifyCollision(mt, elem);
                if (!touched) {
                    continue;
                }
                list = list.concat(Layer.getRelated(elem));
                continue;
            }

            var checkThis = (overlap > factor) || // factor in
                ((overlap > 0.34) &&
                ((SVGTools.getArea(elem) / SVGTools.getArea(mt)) < 0.1));
            // or is a 3rd in of someting that is a light weight
            if (checkThis) {
                // commented because pixel detecting because is too slow
                touched = Layer.verifyCollision(mt, elem);
                if (!touched) {
                    continue;
                }
                if (list.indexOf(elem) < 0) {
                    list = list.concat(Layer.getRelated(elem));
                }
                Layer.onTopOfBy(p, elem, factor, i, list);
                Layer.drawInOffscreen(mt, targetOffscreen);
            }
        }
        return list;
    }

    static addFromBelow (p, mt, n, list) {
        n = Math.min(p.childElementCount, n);
        for (var i = 0; i < n; i++) {
            var elem = p.childNodes[i];
            if (elem.getAttribute('stencil') == 'yes') {
                continue;
            }
            if (elem.getAttribute('fixed') == 'yes') {
                continue;
            }
            if (elem.nodeName == 'clipPath') {
                continue;
            }
            if (elem.nodeName == 'image') {
                continue;
            }
            if (list.indexOf(elem) > -1) {
                continue;
            }
            if (elem.getAttribute('fill') != 'none') {
                continue;
            }
            if (Layer.overlapBox(mt, elem) > 0.5) {
                if (list.indexOf(elem) < 0) {
                    list = list.concat(Layer.getRelated(elem));
                }
            }
        }
        return list;
    }

    static getRelated (elem) {
        var res = [];
        if (elem.id.indexOf('pathborder_image') > -1) {
            var imageid = elem.id.substring(String('pathborder_').length, elem.id.length);
            var group = gn('group_' + imageid);
            if (group) {
                res.push(group);
            } else {
                var img = SVGImage.getImage(elem);
                if (img) {
                    res.push(img);
                }
                var clip = SVGImage.getPathMask(elem);
                if (clip) {
                    res.push(clip);
                }
            }
        }
        res.push(elem);
        return res;
    }

    static inContactWith (p, mt, factor, n) {
        var res = [];
        for (var i = n; i < p.childElementCount; i++) {
            var elem = p.childNodes[i];
            if (elem.id == mt.id) {
                continue;
            }
            if (elem.getAttribute('stencil') == 'yes') {
                continue;
            }
            if (Layer.overlapBox(mt, elem) > 0) {
                res.push(elem);
            }
        }
        return res;
    }

    static includesBox (e1, e2) {
        var box1 = SVGTools.getBox(e1);
        var box2 = SVGTools.getBox(e2);
        if ((box2.width * box2.height) > (box1.width * box1.height)) {
            return false;
        }
        var boxi = box1.intersection(box2);
        if (boxi.isEmpty()) {
            return 0;
        }
        if (boxi.isEqual(box2)) {
            return 1;
        }
        if (boxi.isEqual(box1)) {
            return 1;
        }
        return ((boxi.width * boxi.height) / (box2.width * box2.height)) == 1;
    }


    static getContainedMost (p, elem, max, factor) {
        p = elem.parentNode;
        for (var i = 0; i < max; i++) {
            var node = p.childNodes[i];
            if (node.id == elem.id) {
                continue;
            }
            if (Layer.overlapBoxBy(elem, node, factor)) {
                return i;
            }
        }
        return null;
    }

    static overlapBox (e1, e2) {
        var box1 = SVGTools.getBox(e1);
        var box2 = SVGTools.getBox(e2);
        if ((e1.nodeName != 'g') && (e2.nodeName != 'g')) {
            var contatctPoints = Path.getPathCrossing(e2, e1);
            if ((contatctPoints.length == 0) && ((box2.width * box2.height) > (box1.width * box1.height))) {
                return 0;
            }
        }
        var boxi = box1.intersection(box2);
        if (boxi.isEmpty()) {
            return 0;
        }
        if (boxi.isEqual(box2)) {
            return 1;
        }
        //	if (boxi.isEqual(box1)) return 1;
        return (boxi.width * boxi.height) / (box2.width * box2.height);
    }

    static insideMe (e1, e2) {
        var box1 = SVGTools.getBox(e1);
        var box2 = SVGTools.getBox(e2);
        var boxi = box1.intersection(box2);
        if (boxi.isEmpty()) {
            return false;
        }
        var contatctPoints = Path.getPathCrossing(e2, e1);
        if ((contatctPoints.length == 0) && ((box2.width * box2.height) > (box1.width * box1.height))) {
            return true;
        }
        return false;
    }

    static overlapBoxBy (e1, e2, percent) {
        return Layer.overlapBox(e1, e2) >= percent;
    }

    static findUnderMe (mt) {
        var p = gn('layer1');
        var n = Layer.groupStartsAt(p, mt);
        var group = [];
        var box = SVGTools.getBox(mt);
        for (var i = n - 1; i > -1; i--) {
            var elem = p.childNodes[i];
            if (elem.id == 'staticbkg') {
                continue;
            }
            if (elem.id.indexOf('erasertemp') > -1) {
                continue;
            }
            var box2 = SVGTools.getBox(elem);
            if (!box.intersects(box2)) {
                continue;
            }
            group.push(elem);
        }
        return group;
    }

    static findGroup (mt) {
        var dt = ScratchJr.getTime();
        ScratchJr.log('findGroup start', dt, 'sec');
        setCanvasSize(ScratchJr.workingCanvas, Paint.workspaceWidth, Paint.workspaceHeight);
        var list = Layer.getRelated(mt);
        var index = Layer.groupStartsAt(mt.parentNode, mt);
        var test = (mt.getAttribute('fill') == 'none') &&
            SVG2Canvas.isCloseDPath(mt) && (mt.id.indexOf('pathborder_image') < 0);
        list = test ? Layer.addFromBelow(mt.parentNode, mt, index, list) : list;
        var newlist = Layer.onTopOfBy(mt.parentNode, mt, 0.5, index, list);
        // to keep righ laying order
        var g = Layer.ordering(mt.parentNode, newlist);
        ScratchJr.log('findGroup end', ScratchJr.getTime() - dt, 'sec');
        return g;
    }

    // using canvas because SVG is not good enough
    // revise in the future
    //offscreen
    static verifyCollision (spr, other) {
        var box = SVGTools.getBox(spr);
        var box2 = SVGTools.getBox(other);
        if (!box.intersects(box2)) {
            return false;
        }
        var rect = box.intersection(box2);
        if (rect.width == 0) {
            return false;
        }
        if (rect.height == 0) {
            return false;
        }
        rect.x = Math.floor(rect.x);
        rect.y = Math.floor(rect.y);
        rect.width = Math.floor(rect.width) + 2;
        rect.height = Math.floor(rect.height) + 2;

        // write the other on the offscreen
        Layer.drawInOffscreen(other, offscreen);
        setCanvasSize(ScratchJr.workingCanvas, Paint.workspaceWidth, Paint.workspaceHeight);
        var ctx = ScratchJr.workingCanvas.getContext('2d');
        ctx.clearRect(0, 0, Paint.workspaceWidth, Paint.workspaceHeight);
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(offscreen, 0, 0);
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(targetOffscreen, 0, 0);
        ctx.restore();

        var pixels = ctx.getImageData(rect.x, rect.y, rect.width, rect.height).data;
        var max = Math.floor(pixels.length / 4);
        for (var i = 0; i < max; i++) {
            var pt = {
                x: i % rect.width,
                y: Math.floor(i / rect.width)
            };
            if (!Layer.isTransparent(pixels, pt, rect.width)) {
                return true;
            }
        }
        return false;
    }

    static drawInOffscreen (spr, cnv) {
        var ctx = cnv.getContext('2d');
        setCanvasSize(cnv, Paint.workspaceWidth, Paint.workspaceHeight);
        ctx.clearRect(0, 0, Paint.workspaceWidth, Paint.workspaceHeight);
        var lw = spr.getAttribute('stroke-width');
        ctx.save();
        Layer.drawInContext(spr, ctx, 1, lw, false);
        ctx.restore();
    }

    static isTransparent (data, node, w) {
        var dx = node.x;
        var dy = node.y;
        return data[(dx * 4) + dy * w * 4 + 3] == 0;
    }

    static drawInContext (elem, ctx, zoom, lw, isTip) {
        var rot = Transform.extract(elem, 4);
        if (rot.angle != 0) {
            Layer.rotateFromCenter(ctx, elem, rot.angle);
        }
        ctx.scale(zoom, zoom);
        ctx.fillStyle = (isTip &&
            !SVG2Canvas.isCloseDPath(elem))
            || (elem.tagName == 'image') ? '#ff00FF' : Path.endDotColor;
        ctx.lineWidth = lw;
        ctx.strokeStyle = '#ff00FF';
        // patch for jillians graphics
        if (!elem.getAttribute('fill') && !elem.getAttribute('stroke')) {
            ctx.strokeStyle = 'rgba(0,0,0,0)';
            ctx.fillStyle = '#ff00FF';
        }
        switch (elem.tagName) {
        case 'path':
            if (isTip && !SVG2Canvas.isCloseDPath(elem)) {
                if (Paint.mode != 'path') {
                    SVG2Canvas.renderPath(elem, ctx);
                }
                SVG2Canvas.renderPathTips(elem, ctx);
            } else {
                SVG2Canvas.renderPath(elem, ctx);
            }
            break;
        case 'g':
            for (var i = 0; i < elem.childElementCount; i++) {
                ctx.restore();
                ctx.save();
                Layer.drawInContext(elem.childNodes[i], ctx, zoom, lw, isTip);
                ctx.restore();
                ctx.save();
            }
            break;
        default:
            SVG2Canvas.processXMLnode(elem, ctx, true);
            break;
        }
    }

    static rotateFromCenter (ctx, group, angle) {
        var box = SVGTools.getBoxCenter(group);
        ctx.translate(box.x, box.y);
        ctx.rotate(angle * DEGTOR);
        ctx.translate(-box.x, -box.y);
    }

    /////////////////////////////
    //   Debugging hit masks
    /////////////////////////////

    static showmask () {
        var mask = newDiv(Paint.frame, 0, 0, ScratchJr.workingCanvas.width, ScratchJr.workingCanvas.height,
            {
                position: 'absolute',
                zIndex: 200000,
                visibility: 'visible'
            });
        mask.setAttribute('id', 'layermask');
        mask.appendChild(ScratchJr.workingCanvas);
    }

    static on () {
        gn('layermask').style.visibility = 'visible';
    }

    static off () {
        gn('layermask').style.visibility = 'hidden';
    }
}
