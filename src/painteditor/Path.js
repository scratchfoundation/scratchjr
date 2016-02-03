// Originally several files (PathBkg.js, PathBkg.js, PathEdit.js, PathMgmt.js, PathTools.js)
// were all contributing utility functions to the Path object.
// To consolidate it into a single module, I've combined these below.
// A nice refactor would be to split them back into the "modules," but that will likely involve
// some serious code changes - determining where the relevant Path.X are called, if any shared
// data needs to be moved, etc. -TM

import ScratchJr from '../editor/ScratchJr';
import SVG2Canvas from '../utils/SVG2Canvas';
import SVGImage from './SVGImage';
import SVGTools from './SVGTools';
import Layer from './Layer';
import Vector from '../geom/Vector';
import Transform from './Transform';
import Paint from './Paint';
import PaintUndo from './PaintUndo';
import PaintAction from './PaintAction';
import Ghost from './Ghost';
import Events from '../utils/Events';
import {gn, getIdFor, setCanvasSize, isTablet} from '../utils/lib';

// Previous "PathEdit" globals
let lineDotColor = 'white';
let curveDotColor = '#009eff'; // "#0b72b5"
let endDotColor = '#ffaa00';
let selectedDotColor = 'lime';
let selector = undefined;
let dotsize = 6;
let idotsize = 10;

// Originally PathMgmt.js

////////////////////////////////////////////////////
// Path management
////////////////////////////////////////////////////

export default class Path {
    // Getters/setters for globally used properties
    static get endDotColor () {
        return endDotColor;
    }

    static get selectedDotColor () {
        return selectedDotColor;
    }

    static get selector () {
        return selector;
    }

    static process (shape) {
        var plist = Path.getPolyPoints(shape);
        var firstpoint = plist[0];
        plist = Path.addPoints(plist); // make sure points are evenly spaced
        plist = Path.smoothPoints(plist);
        plist.unshift(firstpoint);
        plist = Path.addPoints(plist); // make sure points are evenly spaced
        plist = Path.deletePoints(plist);
        var bezier = Path.drawBezier(plist);
        shape.parentNode.removeChild(shape);
        return bezier;
    }

    static getPolyPoints (shape) {
        var points = shape.points;
        var pp = [];
        for (var i = 0; i < points.numberOfItems; i++) {
            pp.push(points.getItem(i));
        }
        return pp;
    }

    static smoothPoints (points) {
        var n = points.length;
        var plist = [];
        var interval = 3;
        var i;
        for (i = 0; i < (n - 1); i++) {
            var ax = 0;
            var ay = 0;
            for (var j = -interval; j <= interval; j++) {
                var nj = Math.max(0, i + j);
                nj = Math.min(nj, n - 1);
                ax += points[nj].x;
                ay += points[nj].y;
            }
            ax /= ((interval * 2) + 1);
            ay /= ((interval * 2) + 1);
            plist.push({
                x: ax,
                y: ay
            });
        }
        plist.push(points[n - 1]);
        return plist;
    }

    static addPoints (points) {
        var it = 0;
        var b = true;
        while (b) {
            var result = Path.fillWithPoints(points);
            b = result[0];
            it++;
            if (it > 10) {
                return result[1];
            }
        }
        return result[1];
    }

    static fillWithPoints (points) {
        var n = points.length;
        var i = 1;
        var res = false;
        var plist = [points[0]];
        while (i < n - 1) {
            var here = points[i];
            var after = points[i + 1];
            var l2 = Vector.len(Vector.diff(after, here));
            plist.push(points[i]);
            if (l2 > 5) {
                var mp = Vector.mid(here, after);
                plist.push({
                    x: mp.x,
                    y: mp.y
                });
                res = true;
            }
            i++;
        }
        plist.push(points[n - 1]);
        return [res, plist];
    }

    static deletePoints (points) {
        var n = points.length;
        var i = 1;
        var j = 0;
        var plist = [];
        plist.push(points[0]);
        var dist = isTablet ? 40 : 30;
        var before, here, after;
        while (i < n - 1) {
            before = points[j];
            here = points[i];
            after = points[i + 1];
            var l1 = Vector.diff(before, here);
            var l2 = Vector.diff(after, here);
            var div = Vector.len(l1) * Vector.len(l2);
            if (div == 0) {
                div = 0.01;
            }
            var factor = Vector.dot(l1, l2) / div;
            if ((factor > -0.9) || (Vector.len(l2) > dist) || (Vector.len(l1) > dist)) {
                plist.push(points[i]);
                j = i;
            }
            i++;
        }
        before = points[n - 2];
        here = points[n - 1];
        if ((plist.length > 2) && (Vector.len(Vector.diff(before, here)) < 3)) {
            plist.pop();
        }
        plist.push(points[n - 1]);
        return plist;
    }

    static drawBezier (pointslist) {
        var first = pointslist[0];
        var shape = SVGTools.addPath(gn('layer1'), first.x, first.y);
        if (pointslist.length < 2) {
            return shape;
        }
        var d = Path.getBezier(pointslist);
        //	var farilyclose = Vector.len(Vector.diff(lastpoint,first)) < 20;
        //s	if (farilyclose) d+="z";
        shape.setAttributeNS(null, 'd', d);
        return shape;
    }

    /////////////////////////////////////////////
    // Make a Bezier
    ////////////////////////////////////////////

    static getBezier (plist) {
        SVG2Canvas.lastcxy = plist[0];
        var lastpoint = plist[plist.length - 1];
        var d = 'M' + SVG2Canvas.lastcxy.x + ',' + SVG2Canvas.lastcxy.y;
        var str = '';
        if (plist.length < 3) {
            str = Path.lineSeg(plist[1]);
        } else {
            var dist = Vector.len(Vector.diff(plist[0], lastpoint));
            // calculate the curves
            var startpt = Path.curveSeg(plist[0], plist[1], plist[2]);
            for (var i = 2; i < plist.length - 1; i++) {
                str += Path.curveSeg(plist[i - 1], plist[i], plist[i + 1]);
            }
            // calculate the last point whether it closes or not
            if (dist == 0) {
                str += Path.curveSeg(plist[plist.length - 2], lastpoint, plist[1]);
                // recalculate first point same command but the SVG2Canvas.lastcxy have changed
                startpt = Path.curveSeg(plist[0], plist[1], plist[2]);
            } else {
                str += Path.curveSeg(plist[plist.length - 2], lastpoint, lastpoint);
            }
            // (dist < 10) ? Path.curveSeg(plist[plist.length-2], lastpoint, plist[0]):
            d += startpt;
        }
        d += str;
        return d;
    }

    static getControlPoint (before, here, after) {
        // needs more work on the fudge factor
        var l1 = Vector.len(Vector.diff(before, here));
        var l2 = Vector.len(Vector.diff(here, after));
        var l3 = Vector.len(Vector.diff(before, after));
        var l;
        if ((l1 + l2) == 0) {
            l = 0;
        } else {
            l = l3 / (l1 + l2);
        }
        var min = Math.min(l1, l2);
        //if ((l1 + l2) >  3 * l3)	l = 0;
        var beforev = Vector.diff(before, here);
        var afterv = Vector.diff(after, here);
        var bisect = Vector.sum(Vector.norm(beforev), Vector.norm(afterv));
        var perp = Vector.perp(bisect);
        if (Vector.dot(perp, afterv) < 0) {
            perp = Vector.neg(perp);
        }
        if ((bisect.x == 0) || (bisect.y == 0)) {
            var kappa = (Math.sqrt(2) - 1) / 3 * 4;
            perp = Vector.norm(perp);
            var lx = Vector.dot(Vector.diff(here, before), perp);
            return Vector.diff(here, Vector.scale(perp, lx * kappa));
        }
        return Vector.diff(here, Vector.scale(perp, l * l * min * 0.666));
    }

    static curveSeg (before, here, after) {
        //	var endpoint = Vector.diff(here, before);
        var c2 = Path.getControlPoint(before, here, after);
        var c1 = Vector.sum(before, Vector.diff(before, SVG2Canvas.lastcxy));
        SVG2Canvas.lastcxy = c2;
        var pt = 'C' + c1.x + ',' + c1.y + ',' + c2.x + ',' + c2.y + ',' + here.x + ',' + here.y;
        return pt;
    }

    ////////////////////////////////////////////
    // Making a Rect
    ////////////////////////////////////////////

    static makeRectangle (p, pointslist) {
        var first = pointslist[0];
        var shape = SVGTools.addPath(p, first.x, first.y);
        var d = Path.getRectangularD(pointslist);
        shape.setAttributeNS(null, 'd', d);
        shape.setAttribute('fill', 'none');
        return shape;
    }

    static getRectangularD (plist) {
        var first = plist[0];
        var d = 'M' + first.x + ',' + first.y;
        for (var i = 1; i < plist.length; i++) {
            d += Path.lineSeg(plist[i]);
        }
        d += Path.lineSeg(plist[0]);
        d += 'z';
        return d;
    }

    static lineSeg (pt) {
        SVG2Canvas.lastcxy = pt;
        return 'L' + pt.x + ',' + pt.y;
    }

    static moveToCmd (pt) {
        SVG2Canvas.lastcxy = pt;
        return 'M' + pt.x + ',' + pt.y;
    }

    /////////////////////////
    // Polygon / Polyline
    /////////////////////////


    static convertPoints (shape) {
        var plist = Path.getPolyPoints(shape);
        var d = 'M' + plist[0].x + ',' + plist[0].y;
        for (var i = 1; i < plist.length; i++) {
            d += Path.lineSeg(plist[i]);
        }
        d += 'z';
        var attr = Path.getStylingFrom(shape);
        attr.d = d;
        attr.id = getIdFor('path');
        attr['stroke-miterlimit'] = shape.getAttribute('stroke-miterlimit');
        var path = SVGTools.addChild(gn('layer1'), 'path', attr);
        shape.parentNode.removeChild(shape);
        return path;
    }

    static getStylingFrom (elem) {
        var c = elem.getAttribute('fill');
        var s = elem.getAttribute('stroke');
        var sw = elem.getAttribute('stroke-width');
        var attr = {
            'opacity': 1,
            'fill': c,
            'stroke': s,
            'stroke-width': sw
        };
        return attr;
    }

    ////////////////////////////////////////////
    //  Ellipse convertion to Path
    ////////////////////////////////////////////

    static makeEllipse (shape) {
        var rx = Number(shape.getAttribute('rx'));
        var ry = Number(shape.getAttribute('ry'));
        var cx = Number(shape.getAttribute('cx'));
        var cy = Number(shape.getAttribute('cy'));
        var kappa = (Math.sqrt(2) - 1) / 3 * 4;
        var d = [['M', cx - rx, cy],
            ['C', cx - rx, cy - ry * kappa, cx - rx * kappa, cy - ry, cx, cy - ry],
            ['C', cx + rx * kappa, cy - ry, cx + rx, cy - ry * kappa, cx + rx, cy],
            ['C', cx + rx, cy + ry * kappa, cx + rx * kappa, cy + ry, cx, cy + ry],
            ['C', cx - rx * kappa, cy + ry, cx - rx, cy + ry * kappa, cx - rx, cy]];
        var attr = Path.getStylingFrom(shape);
        attr.d = SVG2Canvas.arrayToString(d);
        attr.id = getIdFor('path');
        attr['stroke-miterlimit'] = shape.getAttribute('stroke-miterlimit');
        var elem = SVGTools.addChild(gn('layer1'), 'path', attr);
        return elem;
    }

    //////////////////////////////////////////////////////
    //  From D to point list with CMD type
    /////////////////////////////////////////////////////

    static getAnchorpoints (d) {
        var list = SVG2Canvas.getCommandList(d);
        var res = [];
        for (var i = 0; i < list.length; i++) {
            var cmd = SVG2Canvas.getAbsoluteCommand(list[i]);
            if (cmd[0] != 'z') {
                res.push(SVG2Canvas.endp);
            }
        }
        return res;
    }

    static getPointsAndCmds (shape) {
        return Path.getCommands(shape.getAttribute('d'));
    }

    static getCommands (path) {
        var list = SVG2Canvas.getCommandList(path);
        var res = [];
        var first;
        for (var i = 0; i < list.length; i++) {
            var cmd = SVG2Canvas.getAbsoluteCommand(list[i]);
            if (cmd[0].toLowerCase() == 'm') {
                first = SVG2Canvas.endp;
            }
            if (cmd[0].toLowerCase() != 'z') {
                res.push({
                    cmd: cmd[0],
                    pt: SVG2Canvas.endp
                });
            } else {
                res.push({
                    cmd: cmd[0],
                    pt: first
                });
            }
        }
        return res;
    }

    static getPointsForFirst (elem) {
        var paths = elem.getAttribute('d').match(/[M][^M]*/g);
        var d;
        if (!paths) {
            d = elem.getAttribute('d');
        } else {
            d = paths[0];
        }
        return Path.getCommands(d);
    }

    //////////////////////////////////////////////////////
    //  From CMD points to Path D attribute
    /////////////////////////////////////////////////////

    static getDattribute (ptlist) {
        // plist data structure is
        // CMD - pt;
        SVG2Canvas.lastcxy = ptlist[0].pt;
        var d = 'M' + SVG2Canvas.lastcxy.x + ',' + SVG2Canvas.lastcxy.y;
        //paths always start with "M"
        // first CMD after M and last CMDS are calculated at the end of the loop
        var str = '';
        // two points line;
        if (ptlist.length < 3) {
            return (ptlist[1].cmd.toLowerCase() == 'z') ? null : d + Path.lineSeg(ptlist[1].pt);
        }
        Paint.skipNext = false;
        // any other shape;
        var startpt = Path.thisCommand(ptlist, 1);
        var first = ptlist[1];
        var last = ptlist[ptlist.length - 1];
        var dist = Vector.len(Vector.diff(ptlist[0].pt, last.pt));
        var shapetype = ((first.cmd == 'C') && (last.cmd == 'C') && (dist == 0)) ? 'ellipse' :
            ((first.cmd == 'C') &&
            (ptlist[ptlist.length - 2].cmd == 'C') && (last.cmd.toLowerCase() == 'z')) ? 'closecurve' :
                ((first.cmd == 'L') && (ptlist[ptlist.length - 2].cmd == 'L') && (dist == 0)) ? 'polygon' :
                    ((first.cmd == 'C') && (last.cmd == 'C')) ? 'curve' : 'line';
        for (var i = 2; i < ptlist.length - 1; i++) {
            str += Path.thisCommand(ptlist, i);
        }
        switch (shapetype) {
        case 'ellipse':
            str += Path.curveSeg(ptlist[ptlist.length - 2].pt, last.pt, first.pt);
            // recalculate first point same command because the SVG2Canvas.lastcxy have changed
            startpt = Path.curveSeg(ptlist[0].pt, first.pt, ptlist[2].pt);
            break;
        case 'closecurve':
            //	str+= Path.curveSeg(ptlist[ptlist.length-2].pt, last.pt, first.pt);
            str += 'z';
            break;
        case 'polygon':
            str += 'z';
            break;

        case 'curve':
            str += Path.curveSeg(ptlist[ptlist.length - 2].pt, last.pt, last.pt);
            break;
        case 'line':
            str += (last.cmd.toLowerCase() == 'z') ? 'z' : Path.lineSeg(last.pt);
            break;
        default:
            str += Path.lineSeg(last.pt);
            break;
        }
        return d + startpt + str;
    }

    static thisCommand (ptlist, i) {
        var str;
        var kind = ptlist[i].cmd;
        var pt = ptlist[i].pt;
        if (Paint.skipNext) {
            Paint.skipNext = false;
            return '';
        }
        if (Path.skipCmd(ptlist, i)) {
            return '';
        }
        switch (kind.toUpperCase()) {
        case 'C':
        case 'S':
            var ptbefore = ptlist[i - 1].pt;
            var ptafter = ptlist[i + 1].pt;
            str = Path.curveSeg(ptbefore, pt, ptafter);
            break;
        case 'Z':
            str = 'Z';
            break;
        case 'M':
            str = Path.moveToCmd(pt);
            break;
        default:
            str = Path.lineSeg(pt);
            break;
        }
        return str;
    }

    static skipCmd (ptlist, i) {
        var cmd1 = ptlist[i].cmd.toLowerCase();
        var cmd2 = ptlist[i + 1].cmd.toLowerCase();
        if ((cmd1 == 'm') && (cmd2 == 'm')) {
            return true;
        }
        if ((cmd1 == 'm') && (cmd2 == 'z')) {
            Paint.skipNext = true;
            return true;
        }
        return false;
    }

    // Originally PathEdit.js

    static maxDistance () {
        return 20 / Paint.currentZoom;
    }

    static importPath (elem) {
        var d = elem.getAttribute('d');
        var list = SVG2Canvas.getCommandList(d);
        var imported = Path.adaptPath(list);
        var path = SVG2Canvas.arrayToString(imported);
        elem.setAttribute('d', path);
    }

    static adaptPath (list) {
        var res = [];
        var lastpt = {
            x: list[0][1],
            y: list[0][2]
        };
        var l;
        res.push(list[0]);
        for (var i = 1; i < list.length; i++) {
            var pts = list[i].concat();
            var cmd = pts.shift();
            switch (cmd.toLowerCase()) {
            case 'h':
                lastpt = {
                    x: pts[0],
                    y: lastpt.y
                };
                res.push(['L', lastpt.x, lastpt.y]);
                break;
            case 'v':
                lastpt = {
                    x: lastpt.x,
                    y: pts[0]
                };
                res.push(['L', lastpt.x, lastpt.y]);
                break;
            case 'l':
                lastpt = {
                    x: pts[0],
                    y: pts[1]
                };
                res.push(['L', lastpt.x, lastpt.y]);
                break;
            case 'c':
                l = pts.length;
                var nextpt = {
                    x: pts[l - 2],
                    y: pts[l - 1]
                };
                var thisPt = {
                    x: pts[0],
                    y: pts[1]
                };
                var diff = Math.floor(Vector.len(Vector.diff(lastpt, thisPt)));
                if (diff == 0) {
                    res.push(['L', lastpt.x, lastpt.y]);
                }
                //		if (diff == 0) console.log (i, "added at beginging");
                res.push(list[i]);
                var startAt = {
                    x: pts[l - 4],
                    y: pts[l - 3]
                };
                var diffend = Math.floor(Vector.len(Vector.diff(startAt, nextpt)));
                if (diffend == 0) {
                    res.push(['L', nextpt.x, nextpt.y]);
                }
                //		if (diffend == 0) console.log (i, "added at end");
                lastpt = nextpt;
                break;
            case 'z':
                res.push(list[i]);
                break;
            default:
                l = pts.length;
                lastpt = {
                    x: pts[l - 2],
                    y: pts[l - 1]
                };
                res.push(list[i]);
                break;
            }
        }
        return res;
    }

    /////////////////////////////////////////////////////////////
    // UI Management
    ////////////////////////////////////////////////////////////

    static showDots (shape) {
        Transform.applyToCmds(shape, Transform.combineAll(shape));
        Transform.eliminateAll(shape);
        var list = Path.getPointsForFirst(shape);
        //	if (Vector.len (Vector.diff (list[0].pt, list[list.length -1].pt)) == 0) list[list.length -1].cmd = "Z";
        var g = gn('pathdots');
        if (g != null) {
            g.parentNode.removeChild(g);
        }
        g = document.createElementNS(Paint.xmlns, 'g');
        g.setAttribute('style', 'pointer-events:none');
        g.setAttribute('id', 'pathdots');
        var p = document.getElementById('layer1').parentNode;
        p.appendChild(g);
        var plist = Path.getPathDotsElem(g, list);
        for (var k = 0; k < plist.length; k++) {
            plist[k].setAttribute('parentid', shape.id);
        }
        shape.setAttribute('style', 'pointer-events:visibleStroke;');
        var lastdot = plist[plist.length - 1];
        var iscurve = SVG2Canvas.curveoptions.indexOf(lastdot.getAttribute('cmd')) > -1;
        lastdot.setAttribute('fill', iscurve ? curveDotColor : lineDotColor);
        lastdot.setAttribute('opacity', 0.6);
        var first = Path.getDotPoint(plist[0]);
        var lastpoint = Path.getDotPoint(lastdot);
        var farilyclose = (Vector.len(Vector.diff(lastpoint, first)) < 10) && (lastdot.getAttribute('cmd') != 'Z');
        if (farilyclose) {
            lastdot.setAttribute('fill', endDotColor);
        }
    }

    static getPathDotsElem (g, list) {
        var res = [];
        var first;
        var cp;
        for (var j = 0; j < list.length - 1; j++) {
            var pt = list[j].pt;
            var cmd = list[j].cmd;
            if (cmd == 'M') {
                first = pt;
            }
            cp = Path.getDot(g, cmd, pt);
            res.push(cp);
            cp.onmouseover = function (evt) {
                Path.highlightDot(evt);
            };
            cp.onmouseout = function (evt) {
                Path.unhighlightDot(evt);
            };
        }
        var last = list[list.length - 1];
        pt = last.pt;
        cmd = last.cmd;
        var prev = list[list.length - 2];
        if ((cmd.toLowerCase() != 'z') && (Vector.len(Vector.diff(first, pt)) == 0)) {
            cmd = 'x';
            cp = Path.getDot(g, cmd, pt);
            cp.style.visibility = 'hidden';
        } else {
            if ((Vector.len(Vector.diff(first, pt)) == 0) &&
                (cmd.toLowerCase() == 'z') &&
                (Vector.len(Vector.diff(first, prev.pt)) == 0)) {
                cp.setAttribute('cmd', 'x');
                cp.style.visibility = 'hidden';
            } else {
                if (cmd.toLowerCase() == 'z') {
                    cmd = (prev.cmd == 'C') ? 'C' : 'L';
                }
                cp = Path.getDot(g, cmd, pt);
            }
        }
        res.push(cp);
        cp.onmouseover = function (evt) {
            Path.highlightDot(evt);
        };
        cp.onmouseout = function (evt) {
            Path.unhighlightDot(evt);
        };
        return res;
    }

    static reshape (shape) {
        var list = Path.getDotsCoodinates(shape);
        //	console.log (list.length, list[0]);
        var cmds = Path.getPointsForFirst(shape);
        var dist = Vector.len(Vector.diff(list[0].pt, list[list.length - 1].pt));
        var valid = list[list.length - 1].cmd.toLowerCase() != 'x';
        var res = [];
        for (var i = 0; i < cmds.length; i++) {
            if (list.length == 0) {
                res.push(cmds[i]);
            } else {
                if (list[0].cmd.toLowerCase() == 'x') { // elipse and rect have force close to keep joint
                    list[0].cmd = cmds[i].cmd;
                    list[0].pt = res[0].pt;
                }
                res.push(list[0]);
                list.shift();
            }
        }
        if (valid) {
            if ((dist < 10) && (res.length > 3)) {
                res[res.length - 1].cmd = 'z';
                res[0].pt = {
                    x: res[res.length - 1].pt.x,
                    y: res[res.length - 1].pt.y
                };
            } else {
                res[res.length - 1].cmd = (res[1].cmd == 'L') ? 'L' : 'C';
            }
        }
        var d = Path.getDattribute(res);
        if (SVG2Canvas.isCompoundPath(shape)) {
            var paths = shape.getAttribute('d').match(/[M][^M]*/g);
            for (var j = 1; j < paths.length; j++) {
                d += paths[j];
            }
        }
        shape.setAttributeNS(null, 'd', d);
        if (SVGImage.getImage(shape)) {
            SVGImage.rotatePointsOf(shape);
        }
    }

    static getDotColor (shape, dot) {
        var cmds = Path.getPointsForFirst(shape);
        var indx = Path.getDotPos(dot);
        if (indx < 0) {
            return curveDotColor;
        }
        if (indx >= (cmds.length - 1)) {
            return endDotColor;
        }
        var cmd = cmds[indx].cmd;
        var iscurve = SVG2Canvas.curveoptions.indexOf(cmd) > -1;
        return iscurve ? curveDotColor : lineDotColor;
    }

    static getDotPos (dot) {
        var arr = dot.id.split(' ');
        if (arr.length < 2) {
            return -1;
        }
        if (arr[0] != 'grab') {
            return -1;
        }
        return Number(arr[1]) - 1;
    }

    static getDotPoint (dot) {
        var rot = Transform.extract(gn(dot.getAttribute('parentid')), 4);
        var mtx = Transform.getCombinedMatrices(gn(dot.getAttribute('parentid'))); // skips rotation matrices
        var pt = Transform.point(Number(dot.getAttribute('cx')), Number(dot.getAttribute('cy')), mtx.inverse());
        pt = Transform.point(pt.x, pt.y, rot.matrix.inverse());
        return pt;
    }

    static isTip (grab) {
        var indx = Path.getDotPos(grab);
        if (indx < 0) {
            return false;
        }
        if (indx == 0) {
            return true;
        }
        return indx == (gn('pathdots').childElementCount - 1);
    }

    static getDot (g, cmd, pt) {
        cmd = cmd.toUpperCase();
        var iscurve = SVG2Canvas.curveoptions.indexOf(cmd) > -1;
        var radius = Math.floor((isTablet ? idotsize : dotsize) / Paint.currentZoom) + 1;
        var skip = (cmd == 'Z');
        var cp = SVGTools.addChild(g, 'circle', {
            'id': getIdFor('grab'),
            'fill': iscurve ? curveDotColor : lineDotColor,
            'r': radius,
            'stroke': skip ? 'none' : '#064268',
            'stroke-width': 1,
            'pointer-events': skip ? 'none' : 'all',
            opacity: skip ? 0 : 0.8
        });
        cp.setAttributeNS(null, 'cx', pt.x);
        cp.setAttributeNS(null, 'cy', pt.y);
        cp.setAttribute('cmd', cmd);
        return cp;
    }

    static highlightDot (e) {
        var shape = e.target;
        shape.setAttribute('fill', '#00ffff');
        shape.setAttribute('opacity', 1);
    }

    static unhighlightDot (e) {
        var shape = e.target;
        if (!shape) {
            return;
        }
        var isbez = SVG2Canvas.curveoptions.indexOf(shape.getAttribute('cmd')) > -1;
        shape.setAttribute('fill', isbez ? curveDotColor : lineDotColor);
        shape.setAttribute('opacity', 0.6);
    }

    static hideDots (shape) {
        if (shape) {
            shape.setAttribute('style', 'pointer-events:visiblePainted;');
        }
        var g = gn('pathdots');
        if (!g) {
            return;
        }
        g.parentNode.removeChild(g);
    }

    static getDotsCoodinates () {
        var pointslist = [];
        for (var i = 0; i < gn('pathdots').childElementCount; i++) {
            var dot = gn('pathdots').childNodes[i];
            pointslist.push({
                cmd: dot.getAttribute('cmd'),
                pt: Path.getDotPoint(dot)
            });
        }
        return pointslist;
    }

    static getDots () {
        var pointslist = [];
        for (var i = 0; i < gn('pathdots').childElementCount; i++) {
            pointslist.push(gn('pathdots').childNodes[i]);
        }
        return pointslist;
    }

    static addDot (shape) {
        var g = gn('pathdots');
        g.parentNode.removeChild(g);
        var rot = Transform.extract(shape, 4);
        var newpt = Transform.point(Paint.initialPoint.x, Paint.initialPoint.y, rot.matrix.inverse());
        setCanvasSize(
            ScratchJr.workingCanvas,
            Paint.root.getAttribute('width') * Paint.currentZoom,
            Paint.root.getAttribute('height') * Paint.currentZoom
        );
        var ctx = ScratchJr.workingCanvas.getContext('2d');
        // uncomment for testing offscreen rendering for hit test
        //	Paint.root.parentNode.appendChild(ScratchJr.workingCanvas);
        //	setProps(ScratchJr.workingCanvas.style, {position: "absolute", left: "0px", top: "0px"});
        ctx.clearRect(0, 0, ScratchJr.workingCanvas.width, ScratchJr.workingCanvas.height);
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.lineWidth = Ghost.linemask;
        ctx.strokeStyle = '#ff00FF';
        shape.setAttribute('d', Path.addPoint(shape, ctx, newpt));
        Path.showDots(shape);
        PaintUndo.record();
    }

    static getHitIndex (ctx, commands, pt) {
        ctx.save();
        ctx.beginPath();
        for (var i = 0; i < commands.length; i++) {
            SVG2Canvas.drawCommand(ctx, commands[i]);
            ctx.stroke();
            pt = Vector.floor(pt);
            var pixel = ctx.getImageData(pt.x, pt.y, 1, 1).data;
            if (pixel[3] != 0) {
                return i;
            }
        }
        ctx.stroke();
        ctx.restore();
        return -1;
    }

    static getHitPointIndex (list, pt) {
        for (var i = 0; i < list.length; i++) {
            if (Vector.len(Vector.diff(list[i].pt, pt)) == 0) {
                return i;
            }
        }
        return -1;
    }

    static addPoint (shape, ctx, newpt) {
        var mycmds = SVG2Canvas.getSVGcommands(shape);
        var list = Path.getPointsAndCmds(shape);
        var newCmd;
        var indx = Path.getHitIndex(ctx, mycmds, Vector.floor(newpt));
        if (indx > -1) {
            var prevcmd = list[indx].cmd;
            if ((SVG2Canvas.curveoptions.indexOf(prevcmd) > -1) || (prevcmd.toLowerCase() == 'z')) {
                newCmd = {
                    cmd: 'C',
                    pt: newpt
                };
            } else {
                newCmd = {
                    cmd: 'L',
                    pt: Path.inLine(newpt, indx, list)
                };
            }
            list.splice(indx, 0, newCmd);
        }
        return Path.getDattribute(list);
    }

    static inLine (C, indx, list) {
        var A = list[indx - 1].pt;
        var B = list[indx].pt;
        var norm = Vector.norm(Vector.diff(B, A));
        var K = Vector.dot(norm, Vector.diff(C, A));
        var pt = Vector.sum(A, Vector.scale(norm, K));
        return pt;
    }

    static deleteDot (dot, shape) {
        var list1 = Path.getPointsForFirst(shape);
        var list = Path.getPointsAndCmds(shape);
        var mustdelteboth = (
                (gn('pathdots').childNodes[gn('pathdots').childElementCount - 1]).getAttribute('cmd') == 'x'
            );
        if ((list.length != list1.length) && (list1.length < 5)) {
            return;
        } else if (list.length < (mustdelteboth ? 6 : 3)) {
            return;
        } // polygons have M,L,Z to represent first and last point
        var pt = Path.getDotPoint(dot);
        var indx = Path.getHitPointIndex(list, pt);
        if (indx > 0) {
            list.splice(indx, 1);
        }
        if (indx == 0) {
            var pt1 = list[0].pt;
            var pt2 = list[list.length - 1].pt;
            if (Vector.len(Vector.diff(pt1, pt2)) == 0) {
                list.splice(indx, 1);
                if (mustdelteboth) {
                    list.splice(list.length - 1, 1);
                    list[0].cmd = 'M';
                    var lastpt = {
                        x: list[0].pt.x,
                        y: list[0].pt.y
                    };
                    list[list.length - 1].pt = lastpt;
                    var np = {
                        cmd: 'z',
                        pt: lastpt
                    };
                    list.push(np);
                }
                list[list.length - 1].pt = list[0].pt;
            } else {
                list.splice(indx, 1);
                if (list.length == 2) {
                    list[0].cmd = 'M';
                    list[list.length - 1].cmd = 'L';
                }
            }
        }
        var d = Path.getDattribute(list);
        var img = SVGImage.getImage(shape);
        if (d == null) {
            Path.hideDots(shape);
            shape.parentNode.removeChild(shape);
            if (img) {
                SVGImage.removeClip(img);
            }
        } else {
            shape.setAttribute('d', d);
            Path.showDots(shape);
            if (img) {
                SVGImage.rotatePointsOf(shape);
            }
        }
        PaintUndo.record();
    }

    ////////////////////////////////////////
    // Enter modes
    ///////////////////////////////////////

    static enterEditMode (mt) {
        selector = SVGImage.getPathBorder(mt);
        Path.showDots(selector);
    }

    static quitEditMode () {
        Path.hideDots(selector);
        selector = undefined;
    }

    static hitDot (evt) {
        if (!selector) {
            return false;
        }
        var pt = PaintAction.getScreenPt(evt);
        var closestdot = Path.getClosestDotTo(pt,
            Math.floor((isTablet ? idotsize + 4 : dotsize) / Paint.currentZoom) * 2);
        if (closestdot) {
            PaintAction.target = closestdot;
        }
        return closestdot != null;
    }

    static getClosestDotTo (pt, range) {
        var list = Path.getDotsCoodinates(selector);
        var min = 99999;
        var dot = null;
        for (var i = 0; i < list.length; i++) {
            var pt2 = list[i].pt;
            var dist = Vector.len(Vector.diff(pt2, pt));
            if (dist < min) {
                min = dist;
                dot = i + 1;
            }
        }
        if (min <= range) {
            return gn('grab ' + dot);
        }
        return null;
    }

    static hitLine (shape, pt) {
        return Path.getPointIndex(shape, pt) > -1;
    }

    static getPointIndex (shape, pt) {
        var rot = Transform.extract(shape, 4);
        var newpt = Transform.point(pt.x, pt.y, rot.matrix.inverse());
        setCanvasSize(ScratchJr.workingCanvas, Paint.root.getAttribute('width'), Paint.root.getAttribute('height'));
        var ctx = ScratchJr.workingCanvas.getContext('2d');
        ctx.clearRect(0, 0, ScratchJr.workingCanvas.width, ScratchJr.workingCanvas.height);
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.lineWidth = Ghost.linemask;
        ctx.strokeStyle = '#ff00FF';
        return Path.getHitIndex(ctx, SVG2Canvas.getSVGcommands(shape), Vector.floor(newpt));
    }

    static getClosestPath (pt, current, layer, mindist) {
        var min = 999999;
        var kid;
        for (var i = 0; i < layer.childElementCount; i++) {
            var elem = layer.childNodes[i];
            if (elem.id == current.id) {
                continue;
            }
            if (SVG2Canvas.isCloseDPath(elem)) {
                continue;
            }
            var pt2 = Path.getStartPoint(elem);
            var dist = Events.distance(pt2.x - pt.x, pt2.y - pt.y);
            if (dist < min) {
                min = dist;
                kid = elem;
            }
        }
        return (min <= mindist) ? kid : null;
    }

    ///////////////////////////////
    // Join Path algorithm
    ///////////////////////////////

    static getStartPoint (elem) {
        var d = elem.getAttribute('d');
        var list = Path.getAnchorpoints(d);
        return list[0];
    }

    static getLastPoint (elem) {
        var d = elem.getAttribute('d');
        var list = Path.getAnchorpoints(d);
        return list[list.length - 1];
    }

    static join (cs, mt, pt) {
        Transform.applyToCmds(mt, Transform.combineAll(mt));
        Transform.applyToCmds(cs, Transform.combineAll(cs));
        var cslist = Path.getCommands(cs.getAttribute('d'));
        var diffstart = Vector.len(Vector.diff(pt, cslist[0].pt));
        var diffend = Vector.len(Vector.diff(pt, cslist[cslist.length - 1].pt));
        var isEnd = diffstart > diffend;
        var mtlist = Path.getCommands(mt.getAttribute('d'));
        var res;
        if (isEnd) {
            if (diffend < diffstart) {
                cslist[0].cmd = 'C';
                res = mtlist.concat(cslist.reverse());
            } else {
                mtlist.shift();
                res = cslist.concat(mtlist);
            }
        } else {
            if (diffstart < diffend) {
                mtlist[0].cmd = 'L';
                cslist[0].cmd = 'C';
                res = (cslist.reverse()).concat(mtlist);
            } else {
                cslist[0].cmd = 'L';
                res = mtlist.concat(cslist);
            }
        }
        var d = Path.getDattribute(res);
        if (Vector.len(Vector.diff(res[0].pt, res[res.length - 1].pt)) < 10) {
            var char = d.charAt(d.length - 1);
            if (char != 'z') {
                d += 'z';
            }
        }
        cs.setAttributeNS(null, 'd', d);
        var attr = Path.getStylingFrom(mt);
        for (var val in attr) {
            cs.setAttribute(val, attr[val]);
        }
        if (mt.parentNode) {
            mt.parentNode.removeChild(mt);
        }
        return cs;
    }

    // Originally PathBkg.js
    ///////////////////////////////////////////////////
    // Background Cropping with Path
    ///////////////////////////////////////////////////

    static checkBackgroundCrop (shape) {
        var ocmds = Path.getPointsAndCmds(shape);
        var list = Layer.findUnderMe(shape);
        var iscropped = (list.length == 0) ? Path.createFromBkg(shape) : Path.someOverlaps(shape, list);
        if (iscropped) {
            shape.parentNode.removeChild(shape, list);
            Layer.bringElementsToFront();
        } else {
            var d = Path.getDattribute(ocmds);
            shape.setAttribute('d', d);
        }
    }

    static someOverlaps (shape, list) {
        var cropped = false;
        Path.strechEdges(shape);
        var box = SVGTools.getBox(shape);
        var box2 = {
            x: 0,
            y: 0,
            width: 480,
            height: 360
        };
        if (Path.withinBounds(box, box2)) {
            return cropped;
        }
        if (!Path.isClockWise(shape.getAttribute('d'))) {
            shape.setAttribute('d', Path.flip(shape));
        }
        for (var i = 0; i < list.length; i++) {
            var node = list[i];
            if (node.tagName.toLowerCase() == 'image') {
                continue;
            }
            if (node.tagName == 'clipPath') {
                continue;
            }
            var contatctPoints = Path.getContactPoints(shape, node);
            if (contatctPoints.length < 2) {
                continue;
            }
            var cantcrop = (node.id.indexOf('staticbkg') < 0) && (node.getAttribute('stencil') != 'yes');
            if (cantcrop) {
                continue;
            }
            if (!Path.withinBounds(box, box2)) {
                continue;
            }
            if (Path.endsSameSide(shape)) {
                continue;
            }
            if (Path.isClockWise(node.getAttribute('d'))) {
                node.setAttribute('d', Path.flip(node));
            }
            if (Path.createStencil(shape, node)) {
                cropped = true;
            }
        }
        return cropped;
    }

    static createStencil (shape, mt) {
        var isimage = SVGImage.getImage(mt) != null;
        var list = Path.getPointsAndCmds(shape);
        var other = Path.getPointsAndCmds(mt);
        var index = Layer.groupStartsAt(gn('layer1'), mt);
        var group = Layer.onTopOf(gn('layer1'), index);
        //Layer.onTopOfBy(gn("layer1"), mt, 0.1, index, [mt]);
        var p = mt.parentNode;
        for (var i = 0; i < group.length; i++) {
            p.appendChild(group[i]);
        }
        var contatctPoints = Path.getContactPoints(shape, mt);
        //	console.log ("createStencil", contatctPoints, "shape", shape.id, "mt", mt.id);
        if (contatctPoints.length < 2) {
            return false;
        }
        var attr = Path.getStylingFrom(mt);
        if (isimage) {
            attr.fill = 'none';
        }
        var path = Path.makeAcut(shape, list, other, contatctPoints[0], contatctPoints[1], attr);
        path.setAttribute('stencil', 'yes');
        gn('layer1').appendChild(path);
        var attr2 = Path.getStylingFrom(shape);
        attr2.fill = isimage ? 'none' : mt.getAttribute('fill');
        attr2['stroke-width'] = isimage ? 0 : Paint.strokewidth;
        for (var val in attr2) {
            mt.setAttribute(val, attr2[val]);
        }
        attr2.id = getIdFor('path');
        attr2.d = mt.getAttribute('d');
        if (isimage) {
            mt = SVGTools.addChild(gn('layer1'), 'path', attr2);
        }
        mt.setAttribute('d', Path.getComplement(shape, mt, contatctPoints[0], contatctPoints[1]));
        mt.setAttribute('d', Path.flip(mt));
        mt.setAttribute('stencil', 'yes');
        for (var j = 0; j < group.length; j++) {
            p.appendChild(group[j]);
        } // make sure to bring to front the old stuff
        if (contatctPoints.length > 2) {
            Path.cutBoard(gn('layer1'), contatctPoints, shape, path, 2);
        }
        return !isimage;
    }

    static cutBoard (p, ptsincontact, shape, mt, n) {
        if (n > ptsincontact.length - 2) {
            return;
        }
        if (Path.isClockWise(mt.getAttribute('d'))) {
            mt.setAttribute('d', Path.flip(mt));
        }
        var list = Path.getPointsAndCmds(shape);
        var other = Path.getPointsAndCmds(mt);
        var seam1 = ptsincontact[n];
        var seam2 = ptsincontact[n + 1];
        var attr = Path.getStylingFrom(mt);
        var hitpoints = Path.updateContactPoints(seam1, seam2, list, other);
        if (Path.isValidSegment(hitpoints)) {
            var path = Path.makeAcut(shape, list, other, hitpoints[0], hitpoints[1], attr);
            p.appendChild(path);
            path.setAttribute('stencil', 'yes');
            gn('layer1').appendChild(path);
            var attr2 = Path.getStylingFrom(shape);
            attr2.fill = mt.getAttribute('fill');
            attr2['stroke-width'] = Paint.strokewidth;
            for (var val in attr2) {
                mt.setAttribute(val, attr2[val]);
            }
            mt.setAttribute('d', Path.getComplement(shape, mt, hitpoints[0], hitpoints[1]));
            mt.setAttribute('d', Path.flip(mt));
            mt.setAttribute('stencil', 'yes');
            Path.cutBoard(p, ptsincontact, shape, path, n + 2);
        }
    }

    static moveToEdge (last) {
        if (last.x <= -10) {
            return null;
        }
        if (last.x >= 490) {
            return null;
        }
        if (last.y >= 370) {
            return null;
        }
        if (last.y <= -10) {
            return null;
        }
        if (last.x <= 0) {
            return {
                x: -10,
                y: last.y
            };
        }
        if (last.y <= 0) {
            return {
                x: last.x,
                y: -10
            };
        }
        if (last.x >= 480) {
            return {
                x: 490,
                y: last.y
            };
        }
        if (last.y >= 360) {
            return {
                x: last.x,
                y: 370
            };
        }
        return null;
    }

    static atEdge (pt) {
        if (pt.x <= -10) {
            return true;
        }
        if (pt.x >= 490) {
            return true;
        }
        if (pt.y >= 370) {
            return true;
        }
        if (pt.y <= -10) {
            return true;
        }
        return false;
    }

    static endsSameSide (shape) {
        var cmds = Path.getPointsAndCmds(shape);
        var last = cmds[cmds.length - 1].pt;
        var first = cmds[0].pt;
        return Path.findEdge(first) == Path.findEdge(last);
    }

    static findEdge (pt) {
        if (pt.x <= 0) {
            return 'W';
        }
        if (pt.x >= 480) {
            return 'E';
        }
        if (pt.y >= 360) {
            return 'S';
        }
        return 'N';
    }

    static createFromBkg (shape) {
        //console.log ("createFromBkg");
        Path.strechEdges(shape);
        var box = SVGTools.getBox(shape);
        var box2 = {
            x: 0,
            y: 0,
            width: 480,
            height: 360
        };
        if (Path.withinBounds(box, box2)) {
            return false;
        }
        if (Path.endsSameSide(shape)) {
            return false;
        }
        // get a duplicate of the background
        var attr2 = {
            'id': getIdFor('path'),
            'opacity': 1,
            fill: 'white'
        };
        var cmds = [['M', -10, -10], ['L', 490, -10], ['L', 490, 370], ['L', -10, 370], ['L', -10, -10]];
        attr2.d = SVG2Canvas.arrayToString(cmds);
        var mt = SVGTools.addChild(gn('layer1'), 'path', attr2);
        mt.setAttribute('stencil', 'yes');
        if (!Path.isClockWise(shape.getAttribute('d'))) {
            shape.setAttribute('d', Path.flip(shape));
        }
        if (Path.isClockWise(mt.getAttribute('d'))) {
            mt.setAttribute('d', Path.flip(mt));
        }
        var attr = Path.getStylingFrom(gn('staticbkg'));
        for (var val in attr) {
            mt.setAttribute(val, attr[val]);
        }
        return Path.createStencil(shape, mt);
    }

    static withinBounds (box, box2) {
        if ((box.x <= box2.x) && ((box.width + box.x) >= box2.width)) {
            return false;
        }
        if (box.y > box2.y) {
            return true;
        }
        if ((box.height + box.y) < box2.height) {
            return true;
        }
        return false;
    }

    static strechEdges (shape) {
        var cmds = Path.getPointsAndCmds(shape);
        var last = cmds[cmds.length - 1].pt;
        var newpt;
        if (!Path.atEdge(last)) {
            var addtoend = Path.moveToEdge(last);
            if (addtoend) {
                cmds.push({
                    cmd: 'C',
                    pt: addtoend
                });
            } else {
                newpt = Vector.sum(last, Vector.diff(last, cmds[cmds.length - 2].pt));
                cmds.push({
                    cmd: 'C',
                    pt: newpt
                });
            }
        }
        var first = cmds[0].pt;
        if (!Path.atEdge(first)) {
            cmds[0].cmd = 'L';
            var addtostart = Path.moveToEdge(first);
            if (addtostart) {
                cmds.unshift({
                    cmd: 'M',
                    pt: addtostart
                });
            } else { // add fudge factor
                newpt = Vector.sum(first, Vector.diff(first, cmds[1].pt));
                cmds.unshift({
                    cmd: 'M',
                    pt: newpt
                });
            }
        }
        var d = Path.getDattribute(cmds);
        shape.setAttribute('d', d);
    }

    ///////////////////////
    // path management
    ///////////////////////

    static getContactPoints (eraser, hitobj) {
        //	console.log ("getContactPoints", eraser.id, hitobj.id);
        var list = Path.getPointsAndCmds(eraser);
        var other = Path.getPointsAndCmds(hitobj);
        var res = [];
        for (var i = 1; i < list.length; i++) {
            var v1 = list[i - 1].pt;
            var v2 = list[i].pt;
            for (var j = 1; j < other.length; j++) {
                var v3 = other[j - 1].pt;
                var v4 = other[j].pt;
                var pt = Vector.lineIntersect(v1, v2, v3, v4);
                if (pt) {
                    res.push([i, j, pt]);
                }
            }
        }
        return res;
    }

    static makeAcut (eraser, list, other, goin, goout, attr) {
        var epathdata = SVG2Canvas.getSVGcommands(eraser);
        attr.d = Path.chopSection(list, epathdata, other, goin, goout);
        attr.id = getIdFor('path');
        var newpath = SVGTools.addChild(gn('layer1'), 'path', attr);
        newpath.setAttribute('d', Path.flip(newpath));
        return newpath;
    }

    static chopSection (list, edata, other, goin, goout) {
        var d = 'M' + goin[2].x + ',' + goin[2].y;
        d += SVG2Canvas.arrayToString(edata.slice(goin[0], goout[0]));
        d += Path.lineSeg(goout[2]);
        var joinIn = goin[1];
        var joinOut = goout[1];
        var plist = Path.getShapeFromPoints(joinIn, joinOut, goin[2], other);
        return Path.fromPointsToPath(d, plist);
    }

    static getShapeFromPoints (joinIn, joinOut, pt, other) {
        var plist = [];
        if (joinOut > joinIn) {
            var indx = other.length;
            //Vector.len (Vector.diff(other[0].pt, other[other.length - 1].pt)) == 0 ? other.length - 1 : other.length;
            plist = other.slice(joinOut, indx);
            plist = plist.concat(other.slice(0, joinIn));

        } else if (joinOut != joinIn) {
            plist = other.slice(joinOut, joinIn);
        }
        plist.push({
            cmd: 'L',
            pt: pt
        });
        return plist;
    }

    static fromPointsToPath (d, plist) {
        var prev = plist[0];
        d += Path.lineSeg(prev.pt);
        for (var i = 1; i < plist.length - 1; i++) {
            d += Path.getNextCmd(i, prev, plist);
            prev = plist[i];
        }
        d += Path.lineSeg(plist[plist.length - 1].pt);
        return d;
    }

    static getNextCmd (i, prev, plist, endpt) {
        var next = '';
        switch (plist[i].cmd.toUpperCase()) {
        case 'M':
            if (prev.cmd == 'C') {
                var ptafter = endpt ? endpt : plist[i + 1].pt;
                next = Path.curveSeg(prev.pt, plist[i].pt, ptafter);
            } else {
                next = Path.lineSeg(plist[i].pt);
            }
            break;
        case 'C':
        case 'S':
            next = Path.curveSeg(prev.pt, plist[i].pt,  endpt ? endpt : plist[i + 1].pt);
            break;
        default:
            next = Path.lineSeg(plist[i].pt);
            break;
        }
        return next;
    }

    static getComplement (eraser, hitobj, goin, goout) {
        var edata = SVG2Canvas.getSVGcommands(eraser);
        var other = Path.getPointsAndCmds(hitobj);
        var d = 'M' + goin[2].x + ',' + goin[2].y;
        d += SVG2Canvas.arrayToString(edata.slice(goin[0], goout[0]));
        d += Path.lineSeg(goout[2]);
        var joinIn = goin[1];
        var joinOut = goout[1];
        var plist = Path.getFromPoints(joinIn, joinOut, goin[2], other);
        return Path.fromPointsToPath(d, plist);
    }

    static getFromPoints (joinIn, joinOut, pt, other) {
        var plist = [];
        if (joinIn >= joinOut) {
            var indx = other.length;
            plist = other.slice(joinIn, indx);
            plist = plist.concat(other.slice(0, joinOut));
        } else {
            plist = other.slice(joinIn, joinOut);
        }
        if (plist.length > 0) {
            plist.reverse();
        }
        plist.push({
            cmd: 'L',
            pt: pt
        });
        return plist;
    }

    static updateContactPoints (myseamin, myseamout, elist, newlist) {
        // in logic
        var hitout, hitin;
        var seamin1 = Path.updateContact(myseamin[0], elist, newlist);
        if (seamin1 == null) {
            var res1 = Path.extendSearch(myseamin[0], (myseamout[0]) - 1, elist, newlist);
            if (res1 != null) {
                hitin = [res1[0], res1[1], res1[2]];
            } else {
                return null;
            }
        } else {
            hitin = [myseamin[0], seamin1, myseamin[2]];
        }

        // out logic
        var seamout1 = Path.updateContact(myseamout[0], elist, newlist);
        if (seamout1 == null) {
            var res2 = Path.extendSearch((myseamin[0]) + 1, (myseamout[0]) + 1, elist, newlist);
            if (res2 != null) {
                hitout = [res2[0], res2[1], res2[2]];
            } else {
                return null;
            }
        } else {
            hitout = [myseamout[0], seamout1, myseamout[2]];
        }
        return [hitin, hitout];
    }

    static extendSearch (start, end, list, other) {
        for (var i = start; i < list.length; i++) {
            var v1 = list[i - 1].pt;
            var v2 = list[i].pt;
            for (var j = 1; j < other.length; j++) {
                var v3 = other[j - 1].pt;
                var v4 = other[j].pt;
                var pt = Vector.lineIntersect(v1, v2, v3, v4);
                if (pt) {
                    return [i, j, pt];
                }
            }
        }
        return null;
    }

    static updateContact (n, elist, newlist) {
        var v1 = elist[n - 1].pt;
        var v2 = elist[n].pt;
        for (var j = 1; j < newlist.length; j++) {
            var v3 = newlist[j - 1].pt;
            var v4 = newlist[j].pt;
            var pt = Vector.lineIntersect(v1, v2, v3, v4);
            if (pt) {
                return j;
            }
        }
        return null;
    }

    static isValidSegment (hp) {
        if (hp == null) {
            return false;
        }
        if ((hp[0][1] == hp[1][1]) || (hp[0][2] == hp[1][1])) {
            return false;
        }
        return true;
    }

    // Originally PathTools.js
    /////////////////////////////////////////////
    // Path direction
    ////////////////////////////////////////////

    static isClockWise (d) {
        return Path.getTurnType(Path.getAnchorpoints(d)) == 'clockwise';
    }

    static getTurnType (list) {
        if (list.length < 3) {
            return 'colinear';
        }
        var limitpoints = Path.getMinMaxPoints(list);
        var a = Path.findGreaterThanIndex(limitpoints, -1);
        if (!a) {
            return 'colinear';
        }
        var b = Path.findGreaterThanIndex(limitpoints, a.index);
        if (!b) {
            return 'colinear';
        }
        var c = Path.findGreaterThanIndex(limitpoints, b.index);
        if (!c) {
            return 'colinear';
        }
        return Path.triangleAreaDir(a, b, c);
    }

    static findGreaterThanIndex (list, min) {
        var lastmin = 99999999;
        var pos;
        for (var i = 0; i < list.length; i++) {
            if ((list[i].index > min) && (list[i].index < lastmin)) {
                lastmin = list[i].index;
                pos = list[i];
            }
        }
        return pos;
    }

    static triangleAreaDir (a, b, c) {
        var area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        if (area > 0) {
            return 'clockwise';
        }
        if (area < 0) {
            return 'counterclockwise';
        }
        return 'colinear';
    }

    static getMinMaxPoints (list) {
        var res = [0, 0, 0, 0];
        if (list.length < 1) {
            return res;
        }
        var minx = 9999999;
        var miny = 9999999;
        var maxx = -9999999;
        var maxy = -9999999;
        for (var i = 0; i < list.length; i++) {
            if (list[i].x < minx) {
                minx = list[i].x;
                res[0] = {
                    type: 'minx',
                    x: list[i].x,
                    y: list[i].y,
                    index: i
                };
            }
            if (list[i].x > maxx) {
                maxx = list[i].x;
                res[2] = {
                    type: 'maxx',
                    x: list[i].x,
                    y: list[i].y,
                    index: i
                };
            }

            if (list[i].y < miny) {
                miny = list[i].y;
                res[1] = {
                    type: 'miny',
                    x: list[i].x,
                    y: list[i].y,
                    index: i
                };
            }
            if (list[i].y > maxy) {
                maxy = list[i].y;
                res[3] = {
                    type: 'maxy',
                    x: list[i].x,
                    y: list[i].y,
                    index: i
                };
            }
        }
        return res;
    }

    ////////////////////////////////////////////
    //  Flip Element
    ////////////////////////////////////////////

    static flip (elem) {
        var paths = elem.getAttribute('d').match(/[M][^M]*/g);
        var d = '';
        for (var i = 0; i < paths.length; i++) {
            d += Path.reverse(paths[i]);
        }
        return d;
    }

    static reverse (d) {
        var list = Path.getCommands(d);
        if (list.length < 2) {
            return '';
        }
        var lastcmd = list[list.length - 1].cmd.toLowerCase();
        if (lastcmd == 'z') {
            list[0].cmd = 'z';
        } else {
            list[0].cmd = lastcmd.toUpperCase();
        }
        list[list.length - 1].cmd = 'M';
        list = list.reverse();
        return Path.getDattribute(list);
    }

    static setData (mt) {
        if (mt.getAttribute('relatedto')) {
            Path.breakRelationship(mt, mt.getAttribute('relatedto'));
        } else {
            Path.makeCompoundPath(mt);
        }
    }

    static breakRelationship (mt, family) {
        var elem = gn(family);
        if (!elem) {
            return;
        }
        var paths = elem.getAttribute('d').match(/[M][^M]*/g);
        var findPlace = Path.getMatchPathIndex(mt, paths);
        if (findPlace < 0) {
            return;
        }
        paths.splice(findPlace, 1);
        var d = '';
        for (var i = 0; i < paths.length; i++) {
            d += paths[i];
        }
        elem.setAttribute('d', d);
        mt.setAttribute('d', Path.flip(mt));
        mt.removeAttribute('relatedto');
    }

    static getMatchPathIndex (mt, paths) {
        var mypoints = Path.getPointsAndCmds(mt);
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            var yourpoints = Path.getCommands(path);
            var count = Path.countMatchingPoints(mypoints, yourpoints);
            if (count >= mypoints.length) {
                return i;
            }
        }
        return -1;
    }

    static countMatchingPoints (list, other) {
        var count = 0;
        for (var i = 0; i < list.length; i++) {
            var v1 = list[i].pt;
            for (var j = 0; j < other.length; j++) {
                var v2 = other[j].pt;
                if (Vector.len(Vector.diff(v1, v2)) == 0) {
                    count++;
                }
            }
        }
        return count;
    }

    static makeCompoundPath (mt) {
        var list = Path.findIntersecting(mt);
        if ((list.length == 0) || Path.containsImage(list) || (Path.anyCrossing(list, mt))) {
            mt.setAttribute('fill', Paint.fillcolor);
        } else {
            var filled = false;
            list.sort(function (l1, l2) {
                var a = SVGTools.getArea(l1);
                var b = SVGTools.getArea(l2);
                return a > b ? -1 : (a < b ? 1 : 0);
            });
            var res = [];

            for (var i = 0; i < list.length; i++) {
                if (list[i].getAttribute('fill') != 'none') {
                    filled = true;
                }
                if (list[i].nodeName == 'image') {
                    filled = true;
                }
                if ((list[i].tagName == 'path') && !SVG2Canvas.isCloseDPath(list[i])) {
                    filled = true;
                }
                if (i == 0) {
                    res.push(list[i]);
                }
                if (i > 0) {
                    if (!Layer.insideMe(list[i], list[i - 1])) {
                        res.push(list[i]);
                    }
                }
            }
            if (filled) {
                mt.setAttribute('fill', Paint.fillcolor);
            } else {
                Path.processCompoundPath(mt, res);
            }
        }
    }

    static findIntersecting (mt) {
        var rpos = Paint.root.createSVGRect();
        var box = SVGTools.getBox(mt);
        rpos.x = box.x;
        rpos.y = box.y;
        rpos.width = box.width;
        rpos.height = box.height;
        var list = Paint.root.getIntersectionList(rpos, null);
        var res = [];
        if (list != null) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].parentNode.id == 'ghostlayer') {
                    continue;
                }
                if (list[i].id == mt.id) {
                    continue;
                }
                if (Layer.includesBox(mt, list[i])) {
                    res.push(list[i]);
                }
            }
        }
        return res;
    }

    static containsImage (objlist) {
        for (var i = 0; i < objlist.length; i++) {
            if (objlist[i].nodeName == 'image') {
                return true;
            }
        }
        return false;
    }

    static anyCrossing (objlist, mt) {
        for (var i = 0; i < objlist.length; i++) {
            if (mt == objlist[i]) {
                continue;
            }
            if (objlist[i].nodeName == 'g') {
                continue;
            }
            var contatctPoints = Path.getPathCrossing(objlist[i], mt);
            if (contatctPoints.length > 0) {
                return true;
            }
        }
        return false;
    }

    static getPathCrossing (obj, mt) {
        var list = Path.getAllPoints(obj.getAttribute('d'));
        var other = Path.getAllPoints(mt.getAttribute('d'));
        var res = [];
        for (var i = 1; i < list.length; i++) {
            var v1 = list[i - 1];
            var v2 = list[i];
            for (var j = 1; j < other.length; j++) {
                var v3 = other[j - 1];
                var v4 = other[j];
                var pt = Vector.lineIntersect(v1, v2, v3, v4);
                if (pt) {
                    res.push([i, j, pt]);
                }
            }
        }
        return res;
    }

    static getAllPoints (d) {
        var list = SVG2Canvas.getCommandList(d);
        if (list.length == 0) {
            return [];
        }
        var res = [];
        var lastpt = {
            x: list[0][1],
            y: list[0][2]
        };
        res.push(lastpt);
        for (var i = 1; i < list.length; i++) {
            var pts = list[i];
            var cmd = pts.shift();
            switch (cmd.toLowerCase()) {
            case 'l':
                lastpt = {
                    x: pts[0],
                    y: pts[1]
                };
                res.push(lastpt);
                break;
            case 'c':
                pts.unshift(lastpt.y); // add last point y;
                pts.unshift(lastpt.x); // add last point y;
                var l = pts.length;
                lastpt = {
                    x: pts[l - 2],
                    y: pts[l - 1]
                };
                var seg = Path.getBezierPoints(pts);
                res = res.concat(seg);
                break;
            case 'z':
                lastpt = {
                    x: res[0].x,
                    y: res[0].y
                };
                res.push(lastpt);
                break;
            }
        }
        l = Path.cleanBezier(res, 5);
        return (l.length < 5) ? res : l;
    }

    ////////////////////////////////////////////////////////////
    // from C to bezier points
    ////////////////////////////////////////////////////////////

    static getBezierPoints (points) {
        if (points.length < 8) {
            return [];
        }
        var p1x, p2x, p3x, p4x, p1y, p2y, p3y, p4y;
        p1x = points[0];
        p1y = points[1];
        p2x = points[2];
        p2y = points[3];
        p3x = points[4];
        p3y = points[5];
        p4x = points[6];
        p4y = points[7];

        var x, y, t;

        var xl = p1x - 1;
        var yl = p1y - 1;
        t = 0;
        var f = 1;

        var k = 1.1;
        //Array to hold all points on the bezier curve
        var curvePoints = new Array();

        var n = 0;
        while ((t <= 1) && (t >= 0)) { // t goes from 0 to 1
            n++;
            x = 0;
            y = 0;
            x = (1 - t) * (1 - t) * (1 - t) * p1x + 3 * (1 - t) * (1 - t) *
                t * p2x + 3 * (1 - t) * t * t * p3x + t * t * t * p4x;
            y = (1 - t) * (1 - t) * (1 - t) * p1y + 3 * (1 - t) * (1 - t) *
                t * p2y + 3 * (1 - t) * t * t * p3y + t * t * t * p4y;
            x = Math.round(x);
            y = Math.round(y);
            if (x != xl || y != yl) {
                if (t == 0) {
                    xl = x;
                    yl = y;
                }
                if (x - xl > 1 || y - yl > 1 || xl - x > 1 || yl - y > 1) {
                    t -= f;
                    f = f / k;
                } else {
                    curvePoints[curvePoints.length] = {
                        x: x,
                        y: y
                    };
                    xl = x;
                    yl = y;
                }
            } else {
                t -= f;
                f = f * k;
            }
            t += f;
        }
        return curvePoints;
    }

    // for debugging
    static placePoint (p, pt, c) {
        var el = SVGTools.addEllipse(p, pt.x, pt.y);
        el.setAttributeNS(null, 'stroke-width', 0.5);

        el.setAttributeNS(null, 'rx', 4);
        el.setAttributeNS(null, 'ry', 4);
        el.setAttributeNS(null, 'fill', c);
    }
    // Path.placePoint(gn("testlayer"), pt, c ? c : "#0093ff");


    static cleanBezier (points, dist) {
        var n = points.length;
        var i = 1;
        var j = 0;
        var plist = [];
        plist.push(points[0]);
        while (i < n - 1) {
            var before = points[j];
            var here = points[i];
            var after = points[i + 1];
            var l1 = Vector.diff(before, here);
            var l2 = Vector.diff(after, here);
            if ((Vector.len(l2) > dist) || (Vector.len(l1) > dist)) {
                plist.push(points[i]);
                j = i;
            }
            i++;
        }
        return plist;
    }

    static processCompoundPath (mt, list) {
        var dir = Path.isClockWise(mt.getAttribute('d'));
        // take out all matrices out of original shape
        Transform.applyToCmds(mt, Transform.combineAll(mt));
        Transform.eliminateAll(mt);
        var d = mt.getAttribute('d');
        var yourdir;
        for (var i = 0; i < list.length; i++) {
            if (list[i] == mt) {
                continue;
            }
            if (list[i].getAttribute('fill') != 'none') {
                list[i].parentNode.appendChild(list[i]);
                continue;
            }
            list[i].setAttribute('relatedto', mt.id);
            if (SVG2Canvas.isCompoundPath(list[i])) {
                Transform.applyToCmds(list[i], Transform.combineAll(list[i]));
                Transform.eliminateAll(list[i]);
                var paths = list[i].getAttribute('d').match(/[M][^M]*/g);
                yourdir = Path.isClockWise(paths[0]);
                if (dir == yourdir) {
                    d += Path.reverse(paths[0]);
                } else {
                    d += paths[0];
                }
            } else {
                yourdir = Path.isClockWise(list[i].getAttribute('d'));
                if (dir == yourdir) {
                    list[i].setAttribute('d', Path.flip(list[i]));
                // take out matrices
                }
                Transform.applyToCmds(list[i], Transform.combineAll(list[i]));
                Transform.eliminateAll(list[i]);
                d += list[i].getAttribute('d');
            }
        }
        mt.setAttribute('d', d);
    }
}
