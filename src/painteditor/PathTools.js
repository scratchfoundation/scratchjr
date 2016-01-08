/////////////////////////////////////////////
// Path direction
////////////////////////////////////////////

Path.isClockWise = function (d) {
    return Path.getTurnType(Path.getAnchorpoints(d)) == 'clockwise';
};

Path.getTurnType = function (list) {
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
};

Path.findGreaterThanIndex = function (list, min) {
    var lastmin = 99999999;
    var pos;
    for (var i = 0; i < list.length; i++) {
        if ((list[i].index > min) && (list[i].index < lastmin)) {
            lastmin = list[i].index;
            pos = list[i];
        }
    }
    return pos;
};

Path.triangleAreaDir = function (a, b, c) {
    var area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (area > 0) {
        return 'clockwise';
    }
    if (area < 0) {
        return 'counterclockwise';
    }
    return 'colinear';
};

Path.getMinMaxPoints = function (list) {
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
};

////////////////////////////////////////////
//  Flip Element
////////////////////////////////////////////

Path.flip = function (elem) {
    var paths = elem.getAttribute('d').match(/[M][^M]*/g);
    var d = '';
    for (var i = 0; i < paths.length; i++) {
        d += Path.reverse(paths[i]);
    }
    return d;
};

Path.reverse = function (d) {
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
};

Path.setData = function (mt) {
    if (mt.getAttribute('relatedto')) {
        Path.breakRelationship(mt, mt.getAttribute('relatedto'));
    } else {
        Path.makeCompoundPath(mt);
    }
};

Path.breakRelationship = function (mt, family) {
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
};

Path.getMatchPathIndex = function (mt, paths) {
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
};

Path.countMatchingPoints = function (list, other) {
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
};

Path.makeCompoundPath = function (mt) {
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
};

Path.findIntersecting = function (mt) {
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
};

Path.containsImage = function (objlist) {
    for (var i = 0; i < objlist.length; i++) {
        if (objlist[i].nodeName == 'image') {
            return true;
        }
    }
    return false;
};

Path.anyCrossing = function (objlist, mt) {
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
};

Path.getPathCrossing = function (obj, mt) {
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
};

Path.getAllPoints = function (d) {
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
};

////////////////////////////////////////////////////////////
// from C to bezier points
////////////////////////////////////////////////////////////

Path.getBezierPoints = function (points) {
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
};

// for debugging
Path.placePoint = function (p, pt, c) {
    var el = SVGTools.addEllipse(p, pt.x, pt.y);
    el.setAttributeNS(null, 'stroke-width', 0.5);

    el.setAttributeNS(null, 'rx', 4);
    el.setAttributeNS(null, 'ry', 4);
    el.setAttributeNS(null, 'fill', c);
};
// Path.placePoint(gn("testlayer"), pt, c ? c : "#0093ff");


Path.cleanBezier = function (points, dist) {
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
};

Path.processCompoundPath = function (mt, list) {
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
};
