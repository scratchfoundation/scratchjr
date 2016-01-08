Path.lineDotColor = 'white';
Path.curveDotColor = '#009eff'; // "#0b72b5"
Path.endDotColor = '#ffaa00';
Path.selectedDotColor = 'lime';
Path.selector = undefined;
Path.dotsize = 6;
Path.idotsize = 10;

Path.maxDistance = function () {
    return 20 / Paint.currentZoom;
};

Path.importPath = function (elem) {
    var d = elem.getAttribute('d');
    var list = SVG2Canvas.getCommandList(d);
    var imported = Path.adaptPath(list);
    var path = SVG2Canvas.arrayToString(imported);
    elem.setAttribute('d', path);
};

Path.adaptPath = function (list) {
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
};

/////////////////////////////////////////////////////////////
// UI Management
////////////////////////////////////////////////////////////

Path.showDots = function (shape) {
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
    lastdot.setAttribute('fill', iscurve ? Path.curveDotColor : Path.lineDotColor);
    lastdot.setAttribute('opacity', 0.6);
    var first = Path.getDotPoint(plist[0]);
    var lastpoint = Path.getDotPoint(lastdot);
    var farilyclose = (Vector.len(Vector.diff(lastpoint, first)) < 10) && (lastdot.getAttribute('cmd') != 'Z');
    if (farilyclose) {
        lastdot.setAttribute('fill', Path.endDotColor);
    }
};

Path.getPathDotsElem = function (g, list) {
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
};

Path.reshape = function (shape) {
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
};

Path.getDotColor = function (shape, dot) {
    var cmds = Path.getPointsForFirst(shape);
    var indx = Path.getDotPos(dot);
    if (indx < 0) {
        return Path.curveDotColor;
    }
    if (indx >= (cmds.length - 1)) {
        return Path.endDotColor;
    }
    var cmd = cmds[indx].cmd;
    var iscurve = SVG2Canvas.curveoptions.indexOf(cmd) > -1;
    return iscurve ? Path.curveDotColor : Path.lineDotColor;
};

Path.getDotPos = function (dot) {
    var arr = dot.id.split(' ');
    if (arr.length < 2) {
        return -1;
    }
    if (arr[0] != 'grab') {
        return -1;
    }
    return Number(arr[1]) - 1;
};

Path.getDotPoint = function (dot) {
    var rot = Transform.extract(gn(dot.getAttribute('parentid')), 4);
    var mtx = Transform.getCombinedMatrices(gn(dot.getAttribute('parentid'))); // skips rotation matrices
    var pt = Transform.point(Number(dot.getAttribute('cx')), Number(dot.getAttribute('cy')), mtx.inverse());
    pt = Transform.point(pt.x, pt.y, rot.matrix.inverse());
    return pt;
};

Path.isTip = function (grab) {
    var indx = Path.getDotPos(grab);
    if (indx < 0) {
        return false;
    }
    if (indx == 0) {
        return true;
    }
    return indx == (gn('pathdots').childElementCount - 1);
};

Path.getDot = function (g, cmd, pt) {
    cmd = cmd.toUpperCase();
    var iscurve = SVG2Canvas.curveoptions.indexOf(cmd) > -1;
    var radius = Math.floor((isTablet ? Path.idotsize : Path.dotsize) / Paint.currentZoom) + 1;
    var skip = (cmd == 'Z');
    var cp = SVGTools.addChild(g, 'circle', {
        'id': getIdFor('grab'),
        'fill': iscurve ? Path.curveDotColor : Path.lineDotColor,
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
};

Path.highlightDot = function (e) {
    var shape = e.target;
    shape.setAttribute('fill', '#00ffff');
    shape.setAttribute('opacity', 1);
};

Path.unhighlightDot = function (e) {
    var shape = e.target;
    if (!shape) {
        return;
    }
    var isbez = SVG2Canvas.curveoptions.indexOf(shape.getAttribute('cmd')) > -1;
    shape.setAttribute('fill', isbez ? Path.curveDotColor : Path.lineDotColor);
    shape.setAttribute('opacity', 0.6);
};

Path.hideDots = function (shape) {
    if (shape) {
        shape.setAttribute('style', 'pointer-events:visiblePainted;');
    }
    var g = gn('pathdots');
    if (!g) {
        return;
    }
    g.parentNode.removeChild(g);
};

Path.getDotsCoodinates = function () {
    var pointslist = [];
    for (var i = 0; i < gn('pathdots').childElementCount; i++) {
        var dot = gn('pathdots').childNodes[i];
        pointslist.push({
            cmd: dot.getAttribute('cmd'),
            pt: Path.getDotPoint(dot)
        });
    }
    return pointslist;
};

Path.getDots = function () {
    var pointslist = [];
    for (var i = 0; i < gn('pathdots').childElementCount; i++) {
        pointslist.push(gn('pathdots').childNodes[i]);
    }
    return pointslist;
};

Path.addDot = function (shape) {
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
};

Path.getHitIndex = function (ctx, commands, pt) {
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
};

Path.getHitPointIndex = function (list, pt) {
    for (var i = 0; i < list.length; i++) {
        if (Vector.len(Vector.diff(list[i].pt, pt)) == 0) {
            return i;
        }
    }
    return -1;
};

Path.addPoint = function (shape, ctx, newpt) {
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
};

Path.inLine = function (C, indx, list) {
    var A = list[indx - 1].pt;
    var B = list[indx].pt;
    var norm = Vector.norm(Vector.diff(B, A));
    var K = Vector.dot(norm, Vector.diff(C, A));
    var pt = Vector.sum(A, Vector.scale(norm, K));
    return pt;
};

Path.deleteDot = function (dot, shape) {
    var list1 = Path.getPointsForFirst(shape);
    var list = Path.getPointsAndCmds(shape);
    var mustdelteboth = (gn('pathdots').childNodes[gn('pathdots').childElementCount - 1]).getAttribute('cmd') == 'x';
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
};

////////////////////////////////////////
// Enter modes
///////////////////////////////////////

Path.enterEditMode = function (mt) {
    Path.selector = SVGImage.getPathBorder(mt);
    Path.showDots(Path.selector);
};

Path.quitEditMode = function () {
    Path.hideDots(Path.selector);
    Path.selector = undefined;
};

Path.hitDot = function (evt) {
    if (!Path.selector) {
        return false;
    }
    var pt = PaintAction.getScreenPt(evt);
    var closestdot = Path.getClosestDotTo(pt,
        Math.floor((isTablet ? Path.idotsize + 4 : Path.dotsize) / Paint.currentZoom) * 2);
    if (closestdot) {
        PaintAction.target = closestdot;
    }
    return closestdot != null;
};

Path.getClosestDotTo = function (pt, range) {
    var list = Path.getDotsCoodinates(Path.selector);
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
};

Path.hitLine = function (shape, pt) {
    return Path.getPointIndex(shape, pt) > -1;
};

Path.getPointIndex = function (shape, pt) {
    var rot = Transform.extract(shape, 4);
    var newpt = Transform.point(pt.x, pt.y, rot.matrix.inverse());
    setCanvasSize(ScratchJr.workingCanvas, Paint.root.getAttribute('width'), Paint.root.getAttribute('height'));
    var ctx = ScratchJr.workingCanvas.getContext('2d');
    ctx.clearRect(0, 0, ScratchJr.workingCanvas.width, ScratchJr.workingCanvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.lineWidth = Ghost.linemask;
    ctx.strokeStyle = '#ff00FF';
    return Path.getHitIndex(ctx, SVG2Canvas.getSVGcommands(shape), Vector.floor(newpt));
};

Path.getClosestPath = function (pt, current, layer, mindist) {
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
};

///////////////////////////////
// Join Path algorithm
///////////////////////////////

Path.getStartPoint = function (elem) {
    var d = elem.getAttribute('d');
    var list = Path.getAnchorpoints(d);
    return list[0];
};

Path.getLastPoint = function (elem) {
    var d = elem.getAttribute('d');
    var list = Path.getAnchorpoints(d);
    return list[list.length - 1];
};

Path.join = function (cs, mt, pt) {
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
};
