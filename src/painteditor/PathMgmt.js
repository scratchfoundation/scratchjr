var Path = function () {};

////////////////////////////////////////////////////
// Path management
////////////////////////////////////////////////////

Path.process = function (shape) {
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
};

Path.getPolyPoints = function (shape) {
    var points = shape.points;
    var pp = [];
    for (var i = 0; i < points.numberOfItems; i++) {
        pp.push(points.getItem(i));
    }
    return pp;
};

Path.smoothPoints = function (points) {
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
};

Path.addPoints = function (points) {
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
};

Path.fillWithPoints = function (points) {
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
};

Path.deletePoints = function (points) {
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
};

Path.drawBezier = function (pointslist) {
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
};

/////////////////////////////////////////////
// Make a Bezier
////////////////////////////////////////////

Path.getBezier = function (plist) {
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
};

Path.getControlPoint = function (before, here, after) {
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
};

Path.curveSeg = function (before, here, after) {
    //	var endpoint = Vector.diff(here, before);
    var c2 = Path.getControlPoint(before, here, after);
    var c1 = Vector.sum(before, Vector.diff(before, SVG2Canvas.lastcxy));
    SVG2Canvas.lastcxy = c2;
    var pt = 'C' + c1.x + ',' + c1.y + ',' + c2.x + ',' + c2.y + ',' + here.x + ',' + here.y;
    return pt;
};

////////////////////////////////////////////
// Making a Rect
////////////////////////////////////////////

Path.makeRectangle = function (p, pointslist) {
    var first = pointslist[0];
    var shape = SVGTools.addPath(p, first.x, first.y);
    var d = Path.getRectangularD(pointslist);
    shape.setAttributeNS(null, 'd', d);
    shape.setAttribute('fill', 'none');
    return shape;
};

Path.getRectangularD = function (plist) {
    var first = plist[0];
    var d = 'M' + first.x + ',' + first.y;
    for (var i = 1; i < plist.length; i++) {
        d += Path.lineSeg(plist[i]);
    }
    d += Path.lineSeg(plist[0]);
    d += 'z';
    return d;
};

Path.lineSeg = function (pt) {
    SVG2Canvas.lastcxy = pt;
    return 'L' + pt.x + ',' + pt.y;
};

Path.moveToCmd = function (pt) {
    SVG2Canvas.lastcxy = pt;
    return 'M' + pt.x + ',' + pt.y;
};

/////////////////////////
// Polygon / Polyline
/////////////////////////

Path.convertPoints = function (shape) {
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
};

Path.getStylingFrom = function (elem) {
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
};

////////////////////////////////////////////
//  Ellipse convertion to Path
////////////////////////////////////////////

Path.makeEllipse = function (shape) {
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
};

//////////////////////////////////////////////////////
//  From D to point list with CMD type
/////////////////////////////////////////////////////

Path.getAnchorpoints = function (d) {
    var list = SVG2Canvas.getCommandList(d);
    var res = [];
    for (var i = 0; i < list.length; i++) {
        var cmd = SVG2Canvas.getAbsoluteCommand(list[i]);
        if (cmd[0] != 'z') {
            res.push(SVG2Canvas.endp);
        }
    }
    return res;
};

Path.getPointsAndCmds = function (shape) {
    return Path.getCommands(shape.getAttribute('d'));
};

Path.getCommands = function (path) {
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
};

Path.getPointsForFirst = function (elem) {
    var paths = elem.getAttribute('d').match(/[M][^M]*/g);
    var d;
    if (!paths) {
        d = elem.getAttribute('d');
    } else {
        d = paths[0];
    }
    return Path.getCommands(d);
};

//////////////////////////////////////////////////////
//  From CMD points to Path D attribute
/////////////////////////////////////////////////////

Path.getDattribute = function (ptlist) {
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
};

Path.thisCommand = function (ptlist, i) {
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
};

Path.skipCmd = function (ptlist, i) {
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
};
