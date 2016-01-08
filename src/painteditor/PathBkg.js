///////////////////////////////////////////////////
// Background Cropping with Path
///////////////////////////////////////////////////

Path.checkBackgroundCrop = function (shape) {
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
};

Path.someOverlaps = function (shape, list) {
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
};

Path.createStencil = function (shape, mt) {
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
};

Path.cutBoard = function (p, ptsincontact, shape, mt, n) {
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
};

Path.moveToEdge = function (last) {
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
};

Path.atEdge = function (pt) {
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
};

Path.endsSameSide = function (shape) {
    var cmds = Path.getPointsAndCmds(shape);
    var last = cmds[cmds.length - 1].pt;
    var first = cmds[0].pt;
    return Path.findEdge(first) == Path.findEdge(last);
};

Path.findEdge = function (pt) {
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
};

Path.createFromBkg = function (shape) {
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
};

Path.withinBounds = function (box, box2) {
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
};

Path.strechEdges = function (shape) {
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
};

///////////////////////
// path management
///////////////////////

Path.getContactPoints = function (eraser, hitobj) {
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
};

Path.makeAcut = function (eraser, list, other, goin, goout, attr) {
    var epathdata = SVG2Canvas.getSVGcommands(eraser);
    attr.d = Path.chopSection(list, epathdata, other, goin, goout);
    attr.id = getIdFor('path');
    var newpath = SVGTools.addChild(gn('layer1'), 'path', attr);
    newpath.setAttribute('d', Path.flip(newpath));
    return newpath;
};

Path.chopSection = function (list, edata, other, goin, goout) {
    var d = 'M' + goin[2].x + ',' + goin[2].y;
    d += SVG2Canvas.arrayToString(edata.slice(goin[0], goout[0]));
    d += Path.lineSeg(goout[2]);
    var joinIn = goin[1];
    var joinOut = goout[1];
    var plist = Path.getShapeFromPoints(joinIn, joinOut, goin[2], other);
    return Path.fromPointsToPath(d, plist);
};

Path.getShapeFromPoints = function (joinIn, joinOut, pt, other) {
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
};

Path.fromPointsToPath = function (d, plist) {
    var prev = plist[0];
    d += Path.lineSeg(prev.pt);
    for (var i = 1; i < plist.length - 1; i++) {
        d += Path.getNextCmd(i, prev, plist);
        prev = plist[i];
    }
    d += Path.lineSeg(plist[plist.length - 1].pt);
    return d;
};

Path.getNextCmd = function (i, prev, plist, endpt) {
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
};

Path.getComplement = function (eraser, hitobj, goin, goout) {
    var edata = SVG2Canvas.getSVGcommands(eraser);
    var other = Path.getPointsAndCmds(hitobj);
    var d = 'M' + goin[2].x + ',' + goin[2].y;
    d += SVG2Canvas.arrayToString(edata.slice(goin[0], goout[0]));
    d += Path.lineSeg(goout[2]);
    var joinIn = goin[1];
    var joinOut = goout[1];
    var plist = Path.getFromPoints(joinIn, joinOut, goin[2], other);
    return Path.fromPointsToPath(d, plist);
};

Path.getFromPoints = function (joinIn, joinOut, pt, other) {
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
};

Path.updateContactPoints = function (myseamin, myseamout, elist, newlist) {
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
};

Path.extendSearch = function (start, end, list, other) {
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
};

Path.updateContact = function (n, elist, newlist) {
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
};

Path.isValidSegment = function (hp) {
    if (hp == null) {
        return false;
    }
    if ((hp[0][1] == hp[1][1]) || (hp[0][2] == hp[1][1])) {
        return false;
    }
    return true;
};
