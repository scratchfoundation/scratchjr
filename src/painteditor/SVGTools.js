
import Paint from './Paint';
import Vector from '../geom/Vector';
import {gn, getIdFor, rgb2hsb} from '../utils/lib';
import Transform from './Transform';
import SVG2Canvas from '../utils/SVG2Canvas';
import SVGImage from './SVGImage';
import Rectangle from '../geom/Rectangle';
import Layer from './Layer';
import Path from './Path';

let attributeTable = {
    'path': ['d'],
    'image': ['x', 'y', 'width', 'height'],
    'ellipse': ['cx', 'cy', 'rx', 'ry'],
    'rect': ['x', 'y', 'width', 'height'],
    'circle': ['cx', 'cy', 'r'],
    'line': ['x1', 'y1', 'x2', 'y2'],
    'text': ['x', 'y', 'font-size', 'font-family', 'font-style', 'font-weight',
        'text-anchor', 'xml:space'],
    'polyline': ['points'],
    'polygon': ['points']
};

let attributePenTable;

export default class SVGTools {
    // Getters/setters for globally used properties
    static get attributeTable () {
        return attributeTable;
    }

    static get attributePenTable () {
        return attributePenTable;
    }

    static init () {
        attributePenTable = SVGTools.getPenAttributes();
    }

    static getPenAttributes () {
        return {
            'path': SVGTools.onlyKeys(SVGTools.getPenAttr()),
            'ellipse': SVGTools.onlyKeys(SVGTools.getPenAttr()),
            'rect': SVGTools.onlyKeys(SVGTools.getPenAttr()),
            'line': SVGTools.onlyKeys(SVGTools.getPenAttr()),
            'image': [],
            'polyline': SVGTools.onlyKeys(SVGTools.getPenAttr()),
            'polygon': SVGTools.onlyKeys(SVGTools.getPenAttr())
        };
    }

    static create (parent, w, h) {
        var el = document.createElementNS(Paint.xmlns, 'svg');
        el.setAttributeNS(null, 'version', 1.1);
        if (w) {
            el.setAttributeNS(null, 'width', w);
        }
        if (h) {
            el.setAttributeNS(null, 'height', h);
        }
        parent.appendChild(el);
        return el;
    }

    static createGroup (parent, id) {
        var el = document.createElementNS(Paint.xmlns, 'g');
        if (id) {
            el.setAttribute('id', id);
        }
        if (parent) {
            parent.appendChild(el);
        }
        return el;
    }

    //////////////////////////////////////////
    // Element creation
    /////////////////////////////////////////

    static addChild (div, type, attr) {
        var shape = document.createElementNS(Paint.xmlns, type);
        for (var val in attr) {
            shape.setAttribute(val, attr[val]);
        }
        if (div) {
            div.appendChild(shape);
        }
        return shape;
    }

    static addPath (div, x, y) {
        var shape = document.createElementNS(Paint.xmlns, 'path');
        var str = 'M' + x + ',' + y;
        var attr = {
            'd': str,
            'id': getIdFor('path'),
            'opacity': 1
        };
        var drawattr = SVGTools.getPolyAttr();
        for (var val in attr) {
            shape.setAttribute(val, attr[val]);
        }
        for (var ps in drawattr) {
            shape.setAttribute(ps, drawattr[ps]);
        }
        div.appendChild(shape);
        return shape;
    }

    static addPolyline (div, x, y) {
        var shape = document.createElementNS(Paint.xmlns, 'polyline');
        var str = ' ' + x + ',' + y + ' ';
        var attr = {
            'points': str,
            'id': getIdFor('polyline'),
            'opacity': 1
        };
        var drawattr = SVGTools.getPolyAttr();
        for (var val in attr) {
            shape.setAttribute(val, attr[val]);
        }
        for (var ps in drawattr) {
            shape.setAttribute(ps, drawattr[ps]);
        }
        div.appendChild(shape);
        return shape;
    }

    static addEllipse (div, x, y) {
        var shape = document.createElementNS(Paint.xmlns, 'ellipse');
        var attr = {
            'cx': x,
            'cy': y,
            'rx': 0,
            'ry': 0,
            'id': getIdFor('ellipse'),
            'opacity': 1
        };
        for (var val in attr) {
            shape.setAttribute(val, attr[val]);
        }
        var drawattr = SVGTools.getPenAttr(shape);
        for (var ps in drawattr) {
            shape.setAttribute(ps, drawattr[ps]);
        }
        div.appendChild(shape);
        return shape;
    }

    static addTriangle (div, x, y) {
        var shape = document.createElementNS(Paint.xmlns, 'path');
        var attr = {
            'id': getIdFor('path'),
            'opacity': 1
        };
        var cmds = [['M', x, y + 1], ['L', x + 0.5, y], ['L', x + 1, y + 1], ['L', x, y + 1]];
        attr.d = SVG2Canvas.arrayToString(cmds);
        var drawattr = SVGTools.getPenAttr();
        for (var val in attr) {
            shape.setAttribute(val, attr[val]);
        }
        for (var ps in drawattr) {
            shape.setAttribute(ps, drawattr[ps]);
        }
        div.appendChild(shape);
        return shape;
    }

    static addRect (div, x, y) {
        var shape = document.createElementNS(Paint.xmlns, 'rect');
        var attr = {
            'x': x,
            'y': y,
            'width': 0,
            'height': 0,
            'id': getIdFor('rect'),
            'opacity': 1
        };
        for (var val in attr) {
            shape.setAttribute(val, attr[val]);
        }
        var drawattr = SVGTools.getPenAttr(shape);
        for (var ps in drawattr) {
            shape.setAttribute(ps, drawattr[ps]);
        }
        div.appendChild(shape);
        return shape;
    }

    static getPolyAttr () {
        return {
            'fill': 'none',
            'stroke': Paint.fillcolor,
            'stroke-width': Paint.strokewidth,
            'stroke-linecap': 'round',
            'opacity': 1,
            'style': 'pointer-events:visiblePainted;'
        };
    }

    static getPenAttr () {
        return {
            'fill': 'none',
            'stroke': Paint.fillcolor,
            'stroke-width': Paint.strokewidth,
            'opacity': 1,
            'style': 'pointer-events:visiblePainted;'

        };
    }


    ///////////////////////////////////////
    // SVG clones
    ///////////////////////////////////////

    static getCopy (spr) {
        return SVGTools.toObject(SVGTools.svg2string(spr));
    }

    static svg2string (elem) {
        var str = (new XMLSerializer()).serializeToString(elem);
        var header = '<svg xmlns="' + Paint.xmlns + '" xmlns:xlink="' + Paint.xmlnslink + '">';
        str = str.replace(/ href="data:image/g, ' xlink:href="data:image');
        return header + str + '</svg>';
    }

    static toObject (str) {
        str.replace(/>\s*</g, '><');
        var xmlDoc = (new DOMParser()).parseFromString(str, 'text/xml');
        var node = document.importNode(xmlDoc.documentElement.firstChild, true);
        return node;
    }

    static rename (elem) {
        if (elem == undefined) {
            return;
        }
        var pname = elem.tagName;
        switch (pname) {
        case 'g':
            if (elem.id) {
                var name = ((unescape(elem.id)).replace(/[0-9]/g, '')).replace(/\s*/g, '');
                elem.id = getIdFor(name);
            }
            for (var i = 0; i < elem.childElementCount; i++) {
                SVGTools.rename(elem.childNodes[i]);
            }
            break;
        case 'image':
            var corner = Transform.point(elem.getAttribute('x'), elem.getAttribute('y'), window.xform.matrix);
            elem.setAttributeNS(null, 'x', corner.x);
            elem.setAttributeNS(null, 'y', corner.y);
            elem.id = getIdFor('image');
            if (elem.getAttribute('pathUrl')) {
                var cp = getIdFor('clippath');
                gn(elem.getAttribute('pathUrl')).id = cp;
                elem.setAttribute('pathUrl', cp);
            }
            break;
        default:
            if (elem.id) {
                name = ((unescape(elem.id)).replace(/[0-9]/g, '')).replace(/\s*/g, '');
                elem.id = getIdFor(name);
            }
            break;
        }
    }

    static saveBackground (elem, w, h) {
        var serializer = new XMLSerializer();
        var str = serializer.serializeToString(elem);
        str = str.replace(/ href/g, ' xlink:href');
        var svgdata = '<svg xmlns="' + Paint.xmlns + '" xmlns:xlink="' + Paint.xmlnslink +
            '" viewBox= "0 0 ' + w + ' ' + h + '" width="' + w + 'px" height="' + h + 'px">';
        var comment = document.createComment('Created with Scratch Jr');
        svgdata += serializer.serializeToString(comment);
        svgdata += str;
        svgdata += '</svg>';
        return svgdata.replace(/></g, '>\n<');
    }

    static cleanup (elem) {
        if (elem.childElementCount == 0) {
            if (elem.id != 'layer1') {
                elem.parentNode.removeChild(elem);
            }
            return;
        }
        for (var i = 0; i < elem.childElementCount; i++) {
            var kid = elem.childNodes[i];
            if (kid.tagName == 'g') {
                SVGTools.cleanup(kid);
            }
        }
    }

    static saveShape (shape, w, h) {
        SVGTools.cleanup(shape);
        var elem = SVGTools.getCopy(shape);
        var serializer = new XMLSerializer();
        var box = SVGTools.calculateViewBox(elem);
        w = box.width;
        h = box.height;
        var str = serializer.serializeToString(elem);
        str = str.replace(/ href/g, ' xlink:href');
        var svgdata = '<svg xmlns="' + Paint.xmlns + '" xmlns:xlink="' + Paint.xmlnslink +
            '" viewBox= "0 0 ' + w + ' ' + h + '" width="' + w + 'px" height="' + h + 'px">';
        var comment = document.createComment('Created with Scratch Jr');
        svgdata += serializer.serializeToString(comment);
        svgdata += str;
        svgdata += '</svg>';
        return svgdata.replace(/></g, '>\n<');
    }

    static calculateViewBox (elem) {
        var box = SVGTools.getBox(elem, true).rounded();
        if (SVGTools.outsideBounds(box)) {
            return {
                width: Paint.workspaceWidth,
                height: Paint.workspaceHeight
            };
        }
        box = box.expandBy(20);
        window.xform.setTranslate(-box.x, -box.y);
        Transform.translateTo(elem, window.xform);
        return box;
    }

    static outsideBounds (box) {
        if (box.x < 0) {
            return true;
        }
        if (box.y < 0) {
            return true;
        }
        if (box.width > Paint.workspaceWidth) {
            return true;
        }
        if (box.height > Paint.workspaceHeight) {
            return true;
        }
        return false;
    }

    static notValidBox (box) {
        if ((box.x + box.width) < 0) {
            return true;
        }
        if ((box.y + box.height) < 0) {
            return true;
        }
        if (box.x > Paint.workspaceWidth) {
            return true;
        }
        if (box.y > Paint.workspaceHeight) {
            return true;
        }
        return false;
    }

    static getBoxCenter (elem) {
        var box = SVGTools.getBox(elem);
        var cx = box.x + box.width / 2;
        var cy = box.y + box.height / 2;
        return {
            x: cx,
            y: cy
        };
    }

    ///////////////////////////////////////
    // Boxes
    //////////////////////////////////////

    static getTransformedBox (elem) {
        var m = Transform.getCombinedMatrices(elem); // skip rotation matrix
        var box = SVGTools.getBox(elem);
        var p = Transform.point(box.x, box.y, m);
        box.width = Math.abs(box.width * m.a);
        box.height = Math.abs(box.height * m.d);
        box.x = p.x;
        box.y = p.y;
        if (m.a < 0) {
            box.x -= box.width;
        }
        if (m.d < 0) {
            box.y -= box.height;
        }
        var angle = Transform.getRotationAngle(elem);
        if (angle != 0) {
            var rot = Transform.getRotation(elem);
            var list = [];
            list.push(Transform.point(box.x, box.y, rot.matrix));
            list.push(Transform.point(box.x + box.width, box.y, rot.matrix));
            list.push(Transform.point(box.x + box.width, box.y + box.height, rot.matrix));
            list.push(Transform.point(box.x, box.y + box.height, rot.matrix));
            box = SVGTools.getMinMax(list);
        }
        return box;
    }

    static getBox (elem, isSaving) {
        var box = new Rectangle(0, 0, 0, 0);
        if (elem == undefined) {
            return box;
        }
        switch (elem.tagName) {
        case 'circle':
            box.x = elem.getAttribute('cx') - elem.getAttribute('r');
            box.y = elem.getAttribute('cy') - elem.getAttribute('r');
            box.width = Number(elem.getAttribute('r')) * 2;
            box.height = Number(elem.getAttribute('r')) * 2;
            box = box.expandBy(SVGTools.getPenWidthForm(elem));
            break;
        case 'g':
        case 'svg':
            if (elem.childElementCount == 0) {
                return box;
            }
            box = SVGTools.getTransformedBox(elem.childNodes[0]);
            for (var i = 0; i < elem.childElementCount; i++) {
                if (isSaving && (elem.childNodes[i].tagName == 'image')) {
                    continue;
                }
                var rect = SVGTools.getTransformedBox(elem.childNodes[i]);
                if (rect.isEmpty()) {
                    continue;
                }
                box = box.union(rect);
            }
            break;
        case 'ellipse':
            box.x = elem.getAttribute('cx') - elem.getAttribute('rx');
            box.y = elem.getAttribute('cy') - elem.getAttribute('ry');
            box.width = Number(elem.getAttribute('rx')) * 2;
            box.height = Number(elem.getAttribute('ry')) * 2;
            box = box.expandBy(SVGTools.getPenWidthForm(elem));
            break;
        case 'clipPath':
            box = SVGTools.getTransformedBox(elem.childNodes[0]);
            break;
        case 'image':
            box.x = Number(elem.getAttribute('x'));
            box.y = Number(elem.getAttribute('y'));
            box.width = Number(elem.getAttribute('width'));
            box.height = Number(elem.getAttribute('height'));
            break;
        case 'path':
            box = SVGTools.getPathBox(elem).expandBy(SVGTools.getPenWidthForm(elem));
            break;
        case 'line':
            var x1 = Number(elem.getAttribute('x1'));
            var x2 = Number(elem.getAttribute('x2'));
            var y1 = Number(elem.getAttribute('y1'));
            var y2 = Number(elem.getAttribute('y2'));
            var minx = Math.min(x1, x2);
            var maxx = Math.max(x1, x2);
            var miny = Math.min(y1, y2);
            var maxy = Math.max(y1, y2);
            box = (new Rectangle(minx, miny, maxx - minx, maxy - miny)).expandBy(SVGTools.getPenWidthForm(elem));
            break;
        case 'polygon':
            var points = elem.points;
            var list = [];
            for (var j = 0; j < points.numberOfItems; j++) {
                list.push(points.getItem(j));
            }
            box = SVGTools.getMinMax(list).expandBy(SVGTools.getPenWidthForm(elem));
            break;
        }
        return box;
    }

    static getArea (elem) {
        var area = 0;
        var list;
        var sw = Number(elem.getAttribute('stroke-width')) / 2;
        switch (elem.tagName) {
        case 'g': // give an approximantion
            var box = SVGTools.getBox(elem);
            area = box.width * box.height;
            break;
        case 'circle':
            area = Math.PI * Number(elem.getAttribute('r')) * Number(elem.getAttribute('r'));
            break;
        case 'ellipse':
            area = Math.PI * Number(elem.getAttribute('rx')) * Number(elem.getAttribute('ry'));
            break;
        case 'path':
            var d;
            if (SVG2Canvas.isCompoundPath(elem)) {
                var paths = elem.getAttribute('d').match(/[M][^M]*/g);
                d = paths[0];
            } else {
                d = elem.getAttribute('d');
            }
            d = Path.isClockWise(d) ? Path.reverse(d) : d;
            list = Path.getAllPoints(d);
            if (list.length == 2) {
                list = SVGTools.getPolygon(list[0], list[1], sw);
            }
            area = SVGTools.polygonArea(list);
            break;
        case 'line':
            var x1 = Number(elem.getAttribute('x1'));
            var x2 = Number(elem.getAttribute('x2'));
            var y1 = Number(elem.getAttribute('y1'));
            var y2 = Number(elem.getAttribute('y2'));
            var poly = SVGTools.getPolygon({
                x: x1,
                y: y1
            }, {
                x: x2,
                y: y2
            }, sw);
            area = SVGTools.polygonArea(poly);
            break;
        case 'polygon':
            var points = elem.points;
            list = [];
            for (var i = 0; i < points.numberOfItems; i++) {
                list.push(points.getItem(i));
            }
            area = SVGTools.polygonArea(list);
            break;
        }
        return area;
    }

    static getPolygon (before, here, size) {
        var v1 = Vector.diff(here, before);
        var pt = Vector.scale(v1, 0.5);
        var perp = Vector.perp(pt);
        var unitvector = Vector.norm(perp);
        var pt1 = Vector.sum(before, Vector.scale(unitvector, size));
        var pt4 = Vector.sum(before, Vector.scale(unitvector, -size));
        var pt2 = Vector.sum(here, Vector.scale(unitvector, size));
        var pt3 = Vector.sum(here, Vector.scale(unitvector, -size));
        return [pt1, pt2, pt3, pt4];
    }

    static polygonArea (list) {
        var xlist = [];
        var ylist = [];
        for (var n = 0; n < list.length; n++) {
            xlist.push(list[n].x); ylist.push(list[n].y);
        }
        var len = list.length;
        var area = 0; // Accumulates area in the loop
        var j = len - 1; // The last vertex is the 'previous' one to the first
        for (var i = 0; i < len; i++) {
            area += (xlist[j] + xlist[i]) * (ylist[j] - ylist[i]);
            j = i; //j is previous vertex to i
        }
        return area / 2;
    }

    static getPenWidthForm (elem) {
        var res = elem.getAttribute('stroke-width');
        return (Number(res).toString() == 'NaN') ? 0 : Number(res);
    }

    static getMinMax (list) {
        var box = new Rectangle(0, 0, 0, 0);
        if (list.length < 1) {
            return box;
        }
        var minx = 9999999;
        var miny = 9999999;
        var maxx = -9999999;
        var maxy = -9999999;
        for (var i = 0; i < list.length; i++) {
            if (list[i].x < minx) {
                minx = list[i].x;
            }
            if (list[i].x > maxx) {
                maxx = list[i].x;
            }
            if (list[i].y < miny) {
                miny = list[i].y;
            }
            if (list[i].y > maxy) {
                maxy = list[i].y;
            }
        }
        box.x = minx;
        box.y = miny;
        box.width = maxx - minx;
        box.height = maxy - miny;
        return box;
    }

    static getPathBox (elem) {
        var box;
        var data = elem.getAttribute('d');
        var paths = data.match(/[M][^M]*/g);
        if (!paths) {
            paths = [elem.getAttribute('d')];
        }
        for (var j = 0; j < paths.length; j++) {
            var pbox = SVGTools.getOnePathBox(paths[j]);
            if (pbox.isEmpty()) {
                continue;
            }
            if (!box) {
                box = pbox;
            } else {
                box = pbox.union(box);
            }
        }
        return box;
    }

    static getOnePathBox (d) {
        var path = SVG2Canvas.getCommandList(d);
        var allpoints = [];
        for (var i = 0; i < path.length; i++) {
            var cmd = SVG2Canvas.getAbsoluteCommand(path[i]);
            if (SVG2Canvas.acurve) {
                allpoints.push({
                    x: cmd[1],
                    y: cmd[2]
                });
                if (cmd.length > 4) {
                    allpoints.push({
                        x: cmd[3],
                        y: cmd[4]
                    });
                }
            }
            allpoints.push(SVG2Canvas.endp);
        }
        var box = SVGTools.getMinMax(allpoints);
        return box;
    }

    static onlyKeys (obj) {
        var res = [];
        for (var key in obj) {
            res.push(key);
        }
        return res;
    }

    ///////////////////////////////////
    // image mask
    //////////////////////////////////


    static getDataurl (copy, w, h) {
        var serializer = new XMLSerializer();
        var header = '<svg  xmlns="' + Paint.xmlns + '"' + ' viewBox= "0 0 ' + w + ' ' + h + '"' +
            ' width=' + '"' + w + 'px' + '"' + ' height=' + '"' + h + 'px' + '">';
        var svgdata = header + '\n' + serializer.serializeToString(copy) + '</svg>';
        return 'data:image/svg+xml;base64,' + btoa(svgdata);
    }

    static getLayersAbove (p, index, w, h) {
        var serializer = new XMLSerializer();
        var svgdata = '<svg  xmlns="' + Paint.xmlns + '"' + ' viewBox= "0 0 ' + w + ' ' + h + '"' +
            ' width=' + '"' + w + 'px' + '"' + ' height=' + '"' + h + 'px' + '">';
        svgdata += '\n';
        var startat = Math.min(index + 1, p.childElementCount);
        for (var i = startat; i < p.childElementCount; i++) {
            svgdata += serializer.serializeToString(p.childNodes[i]) + '\n';
        }
        svgdata += '</svg>';
        return 'data:image/svg+xml;base64,' + btoa(svgdata);
    }

    /////////////////////////////
    // Cloning
    /////////////////////////////

    static getCount (p) {
        var n = 0;
        if (p.tagName == 'g') {
            n += p.childElementCount;
            for (var i = 0; i < p.childElementCount; i++) {
                var elem = p.childNodes[i];
                if (elem.tagName == 'g') {
                    n += SVGTools.getCount(elem);
                }
            }
        }
        return n;
    }

    static cloneSVGelement (elem) {
        var group = Layer.findGroup(elem);
        var p = gn('layer1');
        if (!p) {
            return;
        }
        window.xform.setTranslate(5, 5);
        var old = [];
        var newlist = [];
        if (SVGTools.getCount(p) > 175) {
            return;
        }
        for (var i = 0; i < group.length; i++) {
            if (SVGTools.getCount(p) > 175) {
                return;
            }
            var shape = SVGTools.getClonedElement(gn('layer1'), group[i]);
            if (!shape) {
                continue;
            }
            if (shape.tagName == 'g') {
                continue;
            }
            old.push(group[i].id);
            newlist.push(shape.id);
            if (group[i].getAttribute('id').indexOf('Boder') > -1) {
                var name = group[i].getAttribute('id').split('Border')[0];
                var k = old.indexOf(name);
                if (k > -1) {
                    shape.setAttribute('id', newlist[k] + 'Border');
                }
            }
            if (group[i].getAttribute('relatedto')) {
                var n = old.indexOf(group[i].getAttribute('relatedto'));
                if (n > -1) {
                    shape.setAttribute('relatedto', newlist[n]);
                }
            }
        }
        var elems = SVGTools.getFlatten(gn('layer1'));
        SVGTools.removeDuplicates(elems);
    }

    static removeDuplicates (list) {
        for (var i = 0; i < list.length; i++) {
            var mt = gn(list[i]);
            if (!mt) {
                continue;
            }
            if (!mt.parentNode) {
                continue;
            }
            if (mt.tagName != 'path') {
                continue;
            }
            for (var j = i + 1; j < list.length; j++) {
                var elem = gn(list[j]);
                if (!elem) {
                    continue;
                }
                if (!elem.parentNode) {
                    continue;
                }
                if (elem.tagName != 'path') {
                    continue;
                }
                if (elem.getAttribute('d') == mt.getAttribute('d')) {
                    if ((mt.id.indexOf('pathborder_image') > -1) && (elem.id.indexOf('pathborder_image') > -1)) {
                        var imageid = elem.id.substring(String('pathborder_').length, elem.id.length);
                        var group = gn('group_' + imageid);
                        if (group) {
                            group.parentNode.removeChild(group);
                        }
                    }
                    elem.parentNode.removeChild(elem);
                }
            }
        }
    }

    static getFlatten (p) {
        var res = [];
        for (var i = 0; i < p.childElementCount; i++) {
            var elem = p.childNodes[i];

            if (elem.id.indexOf('group_image_') > -1) {
                continue;
            }
            if (elem.tagName == 'g') {
                res = res.concat(SVGTools.getFlatten(elem));
            } else {
                res.push(elem.id);
            }
        }
        return res;
    }

    static getClonedElement (p, elem) {
        if (elem.id.indexOf('pathborder_image_') > -1) {
            return null;
        }
        if (elem.tagName == 'image') {
            return null;
        }
        if (elem.tagName == 'clipPath') {
            return null;
        }
        if (elem.tagName == 'g') {
            var mt = SVGImage.getImage(elem);
            if (mt) {
                return SVGImage.cloneImage(p, mt);
            }
            var old = [];
            var newlist = [];
            var g = SVGTools.createGroup(p, getIdFor('group'));
            for (var i = 0; i < elem.childElementCount; i++) {
                var shape = SVGTools.getClonedElement(g, elem.childNodes[i]);
                old.push(elem.childNodes[i].id);
                newlist.push(shape.id);
                if (elem.childNodes[i].getAttribute('id').indexOf('Border') > -1) {
                    var name = elem.childNodes[i].getAttribute('id').split('Border')[0];
                    var k = old.indexOf(name);
                    if (k > -1) {
                        shape.setAttribute('id', newlist[k] + 'Border');
                    }
                }
            }
            return g;
        } else {
            return SVGTools.getClone(p, elem);
        }
    }

    static getClone (p, elem) {
        var attr = attributeTable[elem.tagName];
        var drawattr = attributePenTable[elem.tagName];
        var shape = document.createElementNS(Paint.xmlns, elem.tagName);
        p.appendChild(shape);
        attr = attr.concat(drawattr);
        for (var i = 0; i < attr.length; i++) {
            if (elem.getAttribute(attr[i]) == null) {
                continue;
            }
            shape.setAttribute(attr[i], elem.getAttribute(attr[i]));
        }
        if (elem.getAttribute('stroke-linecap')) {
            shape.setAttribute('stroke-linecap', elem.getAttribute('stroke-linecap'));
        }
        shape.setAttribute('id', getIdFor(elem.tagName));
        var ang = Transform.getRotationAngle(elem);
        var mtx = undefined;
        if (Transform.hasScaleMatrix(elem)) {
            mtx = Transform.getScaleMatrix(elem);
        }
        if (ang != 0) {
            Transform.applyRotation(shape, ang);
        }
        if (mtx) {
            Transform.applyMatrix(shape, mtx);
        }
        Transform.translateTo(shape, window.xform);
        return shape;
    }

    ///////////////////////////////
    // Water Mark
    ///////////////////////////////

    static getWatermark (shape, color) {
        var svg = SVGTools.getCopy(shape);
        SVGTools.removeExtras(svg);
        SVGTools.changeShape(svg, color);
        return svg;
    }

    static changeShape (svg, color) {
        for (var i = 0; i < svg.childElementCount; i++) {
            var elem = svg.childNodes[i];
            if (elem.tagName == 'g') {
                SVGTools.changeShape(elem, color);
            } else {
                SVGTools.setObjectWaterMark(elem, color);
            }
        }
    }

    static removeExtras (svg) {
        var n = 0;
        var valid = n < svg.childElementCount;
        while (valid) {
            var elem = svg.childNodes[n];
            if ((elem.nodeName == 'image') || (elem.nodeName == 'clipPath')) {
                svg.removeChild(elem);
            } else {
                if (elem.tagName == 'g') {
                    SVGTools.removeExtras(elem);
                }
                n++;
            }
            valid = n < svg.childElementCount;
        }
    }

    static setObjectWaterMark (elem, color) {
        var fill = elem.getAttribute('fill');
        var stroke = elem.getAttribute('stroke') ? color : (elem.id.indexOf('Draw') > -1) ? color : 'none';
        var lw = elem.getAttribute('stroke-width') ?
            Number(elem.getAttribute('stroke-width')) :
            Number(SVG2Canvas.strokevalues['stroke-width']);
        var attr = {
            'fill': 'white',
            'stroke': stroke,
            'stroke-width': lw,
            'stroke-miterlimit': elem.getAttribute('stroke-miterlimit') ? elem.getAttribute('stroke-miterlimit') : 4,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round'
        };
        attr.fill = (fill == 'none') ? 'none' : 'white';
        if (fillWithColor()) {
            attr.fill = color;
        }

        function fillWithColor () {
            if (!fill) {
                return true;
            }
            if (fill == 'none') {
                return false;
            }
            if (elem.id.indexOf('Border') > -1) {
                return true;
            }
            if (elem.id.indexOf('Skip') > -1) {
                return false;
            }
            if (elem.id.indexOf('Draw') > -1) {
                return false;
            }
            if ((fill == '#080808') || (fill == '#000000') || (fill == 'rgba(0, 0, 0, 0)')) {
                return true;
            } //  shades of black
            // you can take this out if you rename dark layers xyzBorder
            var hsb = rgb2hsb(fill);
            var brightness = hsb[2];
            if (brightness < 0.25) {
                return true;
            }
            var dist = Vector.len(Vector.diff({
                x: 0.5,
                y: 0.5
            }, {
                x: hsb[1],
                y: hsb[2]
            }));
            return (dist < 0.25);
        }
        for (var val in attr) {
            elem.setAttribute(val, attr[val]);
        }
    }

    static isCompoundPath (elem) {
        if (elem.tagName != 'path') {
            return false;
        }
        return SVG2Canvas.isCompoundPath(elem);
    }
}
