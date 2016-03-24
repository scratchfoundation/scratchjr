import Vector from '../geom/Vector';
import {setCanvasSize, rgb2hsb, colorToRGBA} from './lib';
import SVGImage from '../painteditor/SVGImage';

let endp;
let startp;
let curveoptions = ['C', 'c', 's', 'S'];
let qcurveoptions = ['Q', 'q', 'T', 't'];
let acurve = false;
let aqcurve = false;
let lastcxy;
let svgerror;

let strokevalues = {
    'stroke-width': 1,
    'stroke-linecap': 'butt',
    'stroke': 'rgba(0, 0, 0,0)',
    'stroke-linejoin': 'miter',
    'stroke-miterlimit': 4,
    'stroke-dasharray': 'none',
    'stroke-dashoffset': 0,
    'stroke-opacity': 1
};


////////////////////////////////////////////////////////
//  Drawing  Mask and Objects
////////////////////////////////////////////////////////

export default class SVG2Canvas {
    // Getters/setters for globally used properties
    static get endp () {
        return endp;
    }

    static get curveoptions () {
        return curveoptions;
    }

    static get lastcxy () {
        return lastcxy;
    }

    static set lastcxy (newlastcxy) {
        lastcxy = newlastcxy;
    }

    static get svgerror () {
        return svgerror;
    }

    static get strokevalues () {
        return strokevalues;
    }

    static drawInCanvas (spr) {
        svgerror = false;
        setCanvasSize(spr.outline, spr.originalImg.width, spr.originalImg.height);
        var ctx = spr.outline.getContext('2d');
        SVG2Canvas.drawImage(spr.svg, ctx);
    }

    static drawLayers (svg, ctx, fcn) {
        for (var i = 0; i < svg.childElementCount; i++) {
            var elem = svg.childNodes[i];
            fcn(elem, ctx);
        }
    }

    static drawImage (svg, ctx) {
        for (var i = 0; i < svg.childElementCount; i++) {
            SVG2Canvas.drawLayer(svg.childNodes[i], ctx);
        }
    }

    static drawLayer (elem, ctx) {
        // svg no fill means black
        ctx.fillStyle = !elem.getAttribute('fill') ?
            'black' :
            (elem.getAttribute('fill') == 'none') ? 'rgba(0, 0, 0,0)' : elem.getAttribute('fill');
        if (elem.getAttribute('opacity')) {
            ctx.fillStyle = colorToRGBA(ctx.fillStyle, elem.getAttribute('opacity'));
        }
        ctx.strokeStyle = !elem.getAttribute('stroke') ? 'rgba(0, 0, 0,0)' : elem.getAttribute('stroke');
        ctx.lineCap = elem.getAttribute('stroke-linecap') ?
            elem.getAttribute('stroke-linecap') :
            SVG2Canvas.strokevalues['stroke-linecap'];
        ctx.lineWidth = elem.getAttribute('stroke-width') ?
            Number(elem.getAttribute('stroke-width')) :
            Number(SVG2Canvas.strokevalues['stroke-width']);
        ctx.miterLimit = elem.getAttribute('stroke-miterlimit') ?
            elem.getAttribute('stroke-miterlimit') :
            SVG2Canvas.strokevalues['stroke-miterlimit'];
        ctx.linejoin = elem.getAttribute('stroke-linejoin') ?
            elem.getAttribute('stroke-linejoin') :
            SVG2Canvas.strokevalues['stroke-linejoin'];
        SVG2Canvas.processXMLnode(elem, ctx, SVG2Canvas.drawLayer);
    }

    static drawElementHole (elem, ctx) {
        ctx.fillStyle = (!elem.getAttribute('fill') ||
            (elem.getAttribute('fill') == 'none')) ? 'black' : elem.getAttribute('fill');
        ctx.strokeStyle = !elem.getAttribute('stroke') ? 'rgba(0, 0, 0,0)' : elem.getAttribute('stroke');
        ctx.lineCap = elem.getAttribute('stroke-linecap') ?
            elem.getAttribute('stroke-linecap') :
            SVG2Canvas.strokevalues['stroke-linecap'];
        ctx.lineWidth = elem.getAttribute('stroke-width') ?
            Number(elem.getAttribute('stroke-width')) :
            Number(SVG2Canvas.strokevalues['stroke-width']);
        ctx.miterLimit = elem.getAttribute('stroke-miterlimit') ?
            elem.getAttribute('stroke-miterlimit') :
            SVG2Canvas.strokevalues['stroke-miterlimit'];
        ctx.linejoin = elem.getAttribute('stroke-linejoin') ?
            elem.getAttribute('stroke-linejoin') :
            SVG2Canvas.strokevalues['stroke-linejoin'];
        if (elem.tagName) {
            SVG2Canvas.processXMLnode(elem, ctx, SVG2Canvas.drawElementHole);
        } else {
            // drawElementMask no tag name
        }
    }

    static drawElementMask (elem, ctx) {
        if (elem.nodeName == 'image') {
            return;
        }
        if (elem.nodeName == 'clipPath') {
            return;
        }
        if (elem.id.indexOf('pathborder_image') > -1) {
            ctx.fillStyle = 'white';
        } else {
            ctx.fillStyle = (elem.getAttribute('fill') == 'none') ? 'rgba(0, 0, 0,0)' : 'white';
        }
        ctx.strokeStyle = elem.getAttribute('stroke') ? 'white' : 'rgba(0, 0, 0,0)';
        ctx.lineCap = elem.getAttribute('stroke-linecap') ?
            elem.getAttribute('stroke-linecap') :
            SVG2Canvas.strokevalues['stroke-linecap'];
        ctx.lineWidth = elem.getAttribute('stroke-width') ?
            Number(elem.getAttribute('stroke-width')) :
            Number(SVG2Canvas.strokevalues['stroke-width']);
        ctx.miterLimit = elem.getAttribute('stroke-miterlimit') ?
            elem.getAttribute('stroke-miterlimit') :
            SVG2Canvas.strokevalues['stroke-miterlimit'];
        ctx.linejoin = elem.getAttribute('stroke-linejoin') ?
            elem.getAttribute('stroke-linejoin') :
            SVG2Canvas.strokevalues['stroke-linejoin'];
        SVG2Canvas.processXMLnode(elem, ctx, SVG2Canvas.drawElementMask);
    }

    static drawElementOutline (elem, ctx) {
        if (elem.nodeName == 'image') {
            return;
        }
        if (elem.nodeName == 'clipPath') {
            return;
        }
        if (elem.id.indexOf('pathborder_image') > -1) {
            ctx.fillStyle = window.Settings.spriteOutlineColor;
        } else {
            ctx.fillStyle = (elem.getAttribute('fill') == 'none') ?
                'rgba(0, 0, 0,0)' : window.Settings.spriteOutlineColor;
        }
        ctx.strokeStyle = window.Settings.spriteOutlineColor;
        ctx.lineCap = 'round';
        ctx.lineWidth = elem.getAttribute('stroke-width') ? Number(elem.getAttribute('stroke-width')) + 12 : 12;
        ctx.miterLimit = 2;
        ctx.linejoin = 'round';
        SVG2Canvas.processXMLnode(elem, ctx, SVG2Canvas.drawElementOutline);
    }

    static drawBorder (svg, ctx) {
        for (var i = 0; i < svg.childElementCount; i++) {
            SVG2Canvas.drawElementOutline(svg.childNodes[i], ctx);
        }
    }

    static drawWaterMark (svg, ctx) {
        for (var i = 0; i < svg.childElementCount; i++) {
            var elem = svg.childNodes[i];
            if (elem.tagName == 'g') {
                SVG2Canvas.drawWaterMark(elem, ctx);
            } else {
                SVG2Canvas.drawObjectWaterMark(elem, ctx);
            }
        }
    }

    static drawObjectWaterMark (elem, ctx) {
        if (elem.nodeName == 'image') {
            return;
        }
        if (elem.nodeName == 'clipPath') {
            return;
        }
        if (elem.id.indexOf('pathborder_image') > -1) {
            ctx.fillStyle = 'black';
        }
        var fill = elem.getAttribute('fill');
        ctx.fillStyle = (fill == 'none') ? 'rgba(0, 0, 0,0)' : 'black';
        ctx.strokeStyle = elem.getAttribute('stroke') ? 'black' : 'rgba(0, 0, 0,0)';
        ctx.lineCap = 'round';
        ctx.lineWidth = elem.getAttribute('stroke-width') ?
            Number(elem.getAttribute('stroke-width')) :
            Number(SVG2Canvas.strokevalues['stroke-width']);
        ctx.miterLimit = elem.getAttribute('stroke-miterlimit') ?
            elem.getAttribute('stroke-miterlimit') :
            SVG2Canvas.strokevalues['stroke-miterlimit'];
        ctx.linejoin = 'round';
        if (ctx.lineWidth < 2) {
            ctx.lineWidth = 2;
        }
        ctx.save();
        SVG2Canvas.processXMLnode(elem, ctx);
        ctx.restore();
        if (skipFill()) {
            return;
        }
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(0, 0, 0,0)';
        ctx.globalCompositeOperation = 'destination-out';
        SVG2Canvas.processXMLnode(elem, ctx);
        ctx.restore();
        function skipFill () {
            if (elem.id.indexOf('pathborder_image') > -1) {
                return false;
            }
            if (fill == 'none') {
                return true;
            }
            if (!fill) {
                return true;
            }
            if ((fill == '#080808') || (fill == '#000000')) {
                return true;
            }
            if (fill == 'rgba(0, 0, 0, 0)') {
                return true;
            }
            var brightness = rgb2hsb(fill)[2];
            return (brightness < 0.25);
        }
    }

    ////////////////////////////////////////////////////////
    //  Drawing SVG path commands
    ////////////////////////////////////////////////////////


    static processXMLnode (elem, ctx, fcn) {
        if (!elem) {
            return;
        }
        switch (elem.tagName) {
        case 'g':
            SVG2Canvas.drawLayers(elem, ctx, fcn);
            break;
        case 'text':
            SVG2Canvas.drawText(elem, ctx);
            break;
        case 'image':
            var p = elem.parentNode;
            while (p.tagName != 'svg') {
                p = p.parentNode;
            }
            // Note: previously, we used only p.getElementById(targetPath)
            // In iOS 9, this broke and started returning null.
            // getElementsByTagName('path') includes the right element, so we
            // iterate through those and find the one with the matching ID.
            var targetPathId = 'pathborder_' + elem.id;
            var targetPathElement = p.getElementById(targetPathId);
            if (!targetPathElement) {
                var paths = p.getElementsByTagName('path');
                for (var i = 0; i < paths.length; i++) {
                    if (paths[i].id == targetPathId) {
                        targetPathElement = paths[i];
                    }
                }
            }
            SVGImage.draw(elem, targetPathElement, ctx);
            break;
        case 'clipPath':
            break;
        case 'line':
            SVG2Canvas.drawLine(elem, ctx);
            break;
        case 'rect':
            SVG2Canvas.drawRect(elem, ctx);
            break;
        case 'ellipse':
            SVG2Canvas.drawEllipse(elem, ctx);
            break;
        case 'circle':
            SVG2Canvas.drawCircle(elem, ctx);
            break;
        case 'polygon':
            SVG2Canvas.drawStraightLines(elem, ctx);
            break;
        case 'path':
            SVG2Canvas.renderPath(elem, ctx);
            break;
        case 'polyline':
            SVG2Canvas.drawPolyline(elem, ctx);
            break;
        default:
            svgerror = true;
            break;
        }
    }

    static drawRect (shape, ctx) {
        ctx.save();
        var x = Number(shape.getAttribute('x'));
        var y = Number(shape.getAttribute('y'));
        var w = Number(shape.getAttribute('width'));
        var h = Number(shape.getAttribute('height'));
        if (ctx.strokeStyle && (ctx.strokeStyle != 'rgba(0, 0, 0,0)')) {
            ctx.strokeRect(x, y, w, h);
        }
        if (ctx.fillStyle && (ctx.fillStyle != 'rgba(0, 0, 0,0)')) {
            ctx.fillRect(x, y, w, h);
        }
        ctx.restore();
    }

    static drawLine (shape, ctx) {
        var x1 = Number(shape.getAttribute('x1'));
        var y1 = Number(shape.getAttribute('y1'));
        var x2 = Number(shape.getAttribute('x2'));
        var y2 = Number(shape.getAttribute('y2'));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
    }

    static drawEllipse (shape, ctx) {
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
        d = SVG2Canvas.arrayToString(d);
        var commands = SVG2Canvas.getCommandList(d);
        if (!commands) {
            return;
        }
        acurve = false;
        aqcurve = false;
        ctx.save();
        ctx.beginPath();
        for (var i = 0; i < commands.length; i++) {
            SVG2Canvas.drawCommand(ctx, commands[i]);
        }
        if (commands[commands.length - 1].indexOf('z') > -1) {
            ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    static drawCircle (shape, ctx) {
        var r = Number(shape.getAttribute('r'));
        var cx = Number(shape.getAttribute('cx'));
        var cy = Number(shape.getAttribute('cy'));
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    static drawText (kid, ctx) {
        ctx.font = kid.getAttribute('font-weight') + ' ' +
            kid.getAttribute('font-size') + 'px ' + kid.getAttribute('font-family');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(kid.textContent, 0, 0);
    }

    static renderPath (spr, ctx) {
        var d = spr.getAttribute('d');
        var commands = SVG2Canvas.getCommandList(d);
        if (!commands) {
            return;
        }
        acurve = false;
        aqcurve = false;
        ctx.save();
        ctx.beginPath();
        for (var i = 0; i < commands.length; i++) {
            SVG2Canvas.drawCommand(ctx, commands[i]);
        }
        if (commands[commands.length - 1].indexOf('z') > -1) {
            ctx.closePath();
        }
        ctx.fill();
        // fixing ios8 bug
        if (ctx.globalCompositeOperation != 'destination-in') {
            ctx.stroke();
        }
        // end of fix
        ctx.restore();
    }

    static renderPathTips (spr, ctx) {
        var d = spr.getAttribute('d');
        var commands = SVG2Canvas.getCommandList(d);
        if (!commands) {
            return;
        }
        acurve = false;
        aqcurve = false;
        SVG2Canvas.getAbsoluteCommand(commands[0]);
        SVG2Canvas.drawTip(ctx, endp.x, endp.y, 4);
        for (var i = 1; i < commands.length; i++) {
            SVG2Canvas.getAbsoluteCommand(commands[i]);
        }
        SVG2Canvas.drawTip(ctx, endp.x, endp.y, 4);
        ctx.restore();
    }

    static drawTip (ctx, cx, cy, r) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    static getLastPathCommand (spr) {
        var d = spr.getAttribute('d');
        var commands = d.match(/[A-DF-Za-df-z][^A-Za-df-z]*/g);
        return (commands.length > 0) ? commands[commands.length - 1].charAt(0) : null;
    }

    static isCloseDPath (elem) {
        if (elem.tagName != 'path') {
            return true;
        }
        if (SVG2Canvas.isCompoundPath(elem)) {
            return true;
        }
        var d = elem.getAttribute('d');
        var commands = d.match(/[A-DF-Za-df-z][^A-Za-df-z]*/g);
        if (commands.length < 2) {
            return false;
        }
        var lastCmd = commands[commands.length - 1];
        if (lastCmd.charAt(0) == 'z') {
            return true;
        }
        if (commands.length < 4) {
            return false;
        }
        var firstCmd = commands[0];

        if (lastCmd.charAt(0).toLocaleUpperCase() != lastCmd.charAt(0)) {
            return false;
        }
        var firstdata = SVG2Canvas.splitNumericArgs(firstCmd.substr(1, firstCmd.length));
        var lastdata = SVG2Canvas.splitNumericArgs(lastCmd.substr(1, lastCmd.length));

        if (firstdata.length < 2) {
            return false;
        }
        if (lastdata.length < 2) {
            return false;
        }

        var pt1 = {
            x: firstdata[firstdata.length - 2],
            y: firstdata[firstdata.length - 1]
        };
        var pt2 = {
            x: lastdata[lastdata.length - 2],
            y: lastdata[lastdata.length - 1]
        };
        return Vector.len(Vector.diff(pt1, pt2)) < 10;
    }

    static isCompoundPath (shape) {
        var paths = shape.getAttribute('d').match(/[M][^M]*/g);
        if (!paths) {
            return false;
        }
        return paths.length > 1;
    }

    static drawCommand (ctx, cmd) {
        var key = cmd[0];
        dispatchDrawCmd[key](ctx, cmd);
        acurve = curveoptions.indexOf(cmd[0]) > -1;
        aqcurve = qcurveoptions.indexOf(cmd[0]) > -1;
    }

    static splitNumericArgs (str) {
        var res = [];
        if (!str) {
            return res;
        }
        var list = str.match(/(?:\+|-)?\d+(?:\.\d+)?(?:e(?:\+|-)?\d+)?/g);
        for (var i = 0; i < list.length; i++) {
            res.push(Number(list[i]));
        }
        return res;
    }

    // moves
    static absoulteMove (ctx, cmd) {
        endp = {
            x: cmd[1],
            y: cmd[2]
        };
        ctx.moveTo(endp.x, endp.y);
        startp = endp;
    }

    static relativeMove (ctx, cmd) {
        endp = Vector.sum(endp, {
            x: cmd[1],
            y: cmd[2]
        });
        ctx.moveTo(endp.x, endp.y);
        startp = endp;
    }

    // lines
    static closePath (ctx) {
        endp = startp;
        ctx.lineTo(endp.x, endp.y);
    }

    static absoluteLine (ctx, cmd) {
        endp = {
            x: cmd[1],
            y: cmd[2]
        };
        ctx.lineTo(endp.x, endp.y);
    }

    static relativeLine (ctx, cmd) {
        endp = Vector.sum(endp, {
            x: cmd[1],
            y: cmd[2]
        });
        ctx.lineTo(endp.x, endp.y);
    }

    static absoluteHLine (ctx, cmd) {
        var dx = cmd[1];
        endp = {
            x: dx,
            y: endp.y
        };
        ctx.lineTo(endp.x, endp.y);
    }

    static relativeHLine (ctx, cmd) {
        var dx = endp.x + cmd[1];
        endp = {
            x: dx,
            y: endp.y
        };
        ctx.lineTo(endp.x, endp.y);
    }

    static absoluteVLine (ctx, cmd) {
        var dy = cmd[1];
        endp = {
            x: endp.x,
            y: dy
        };
        ctx.lineTo(endp.x, endp.y);
    }

    static relativeVLine (ctx, cmd) {
        var dy = endp.y + cmd[1];
        endp = {
            x: endp.x,
            y: dy
        };
        ctx.lineTo(endp.x, endp.y);
    }

    // curves
    static absoluteCurve (ctx, cmd) {
        ctx.bezierCurveTo(cmd[1], cmd[2], cmd[3], cmd[4], cmd[5], cmd[6]);
        lastcxy = {
            x: cmd[3],
            y: cmd[4]
        };
        endp = {
            x: cmd[5],
            y: cmd[6]
        };
    }

    static relativeCurve (ctx, cmd) {
        var pt1 = {
            x: cmd[1],
            y: cmd[2]
        };
        var pt2 = {
            x: cmd[3],
            y: cmd[4]
        };
        var pt3 = {
            x: cmd[5],
            y: cmd[6]
        };
        var c1 = Vector.sum(endp, pt1);
        var c2 = Vector.sum(endp, pt2);
        lastcxy = c2;
        var endat = Vector.sum(endp, pt3);
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, endat.x, endat.y);
        endp = endat;
    }

    static absoluteSmooth (ctx, cmd) {
        var c1 = acurve ?
            Vector.sum(endp, Vector.diff(endp, lastcxy)) :
            endp;
        var c2 = {
            x: cmd[1],
            y: cmd[2]
        };
        var endat = {
            x: cmd[3],
            y: cmd[4]
        };
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, endat.x, endat.y);
        endp = endat;
        lastcxy = c2;
    }

    static relativeSmooth (ctx, cmd) {
        var c1 = acurve ?
            Vector.sum(endp, Vector.diff(endp, lastcxy)) :
            endp;
        var c2 = Vector.sum(endp, {
            x: cmd[1],
            y: cmd[2]
        });
        var endat = Vector.sum(endp, {
            x: cmd[3],
            y: cmd[4]
        });
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, endat.x, endat.y);
        endp = endat;
        lastcxy = c2;
    }

    // 	Quadratic
    static absoluteQCurve (ctx, cmd) {
        var c1 = {
            x: cmd[1],
            y: cmd[2]
        };
        endp = {
            x: cmd[3],
            y: cmd[4]
        };
        ctx.quadraticCurveTo(c1.x, c1.y, endp.x, endp.y);
        lastcxy = c1;
    }

    static relativeQCurve (ctx, cmd) {
        var c1 = Vector.sum(endp, {
            x: cmd[1],
            y: cmd[2]
        });
        endp = Vector.sum(endp, {
            x: cmd[3],
            y: cmd[4]
        });
        lastcxy = c1;
        ctx.quadraticCurveTo(c1.x, c1.y, endp.x, endp.y);
    }

    static absoluteQSmooth (ctx, cmd) {
        var c1 = aqcurve ?
            Vector.sum(endp, Vector.diff(endp, lastcxy)) :
            endp;
        endp = {
            x: cmd[1],
            y: cmd[2]
        };
        lastcxy = c1;
        ctx.quadraticCurveTo(c1.x, c1.y, endp.x, endp.y);
    }

    static relativeQSmooth (ctx, cmd) {
        var c1 = aqcurve ?
            Vector.sum(endp, Vector.diff(endp, lastcxy)) :
            endp;
        endp = Vector.sum(endp, {
            x: cmd[1],
            y: cmd[2]
        });
        lastcxy = c1;
        ctx.quadraticCurveTo(c1.x, c1.y, endp.x, endp.y);
    }

    ////////////////////////////////////////
    // Drawing Polygon
    ////////////////////////////////////////

    static drawStraightLines (elem, ctx) {
        var points = elem.points;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(points.getItem(0).x, points.getItem(0).y);
        for (var i = 1; i < points.numberOfItems; i++) {
            ctx.lineTo(points.getItem(i).x, points.getItem(i).y);
        }
        ctx.lineTo(points.getItem(0).x, points.getItem(0).y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    static drawPolyline (elem, ctx) {
        var points = elem.points;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(points.getItem(0).x, points.getItem(0).y);
        for (var i = 1; i < points.numberOfItems; i++) {
            ctx.lineTo(points.getItem(i).x, points.getItem(i).y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }


    ////////////////////////////////////////////////////
    // Relative to Absolute Path conversion
    ///////////////////////////////////////////////////

    static setAbsolutePath (spr) {
        var d = spr.getAttribute('d');
        var commands = SVG2Canvas.getCommandList(d);
        if (!commands) {
            return;
        }
        var absolute = SVG2Canvas.getAbsoluteCommands(commands);
        var path = SVG2Canvas.arrayToString(absolute);
        spr.setAttribute('d', path);
    }

    static getSVGcommands (shape) {
        return SVG2Canvas.getCommandList(shape.getAttribute('d'));
    }

    static getCommandList (d) {
        if (!d) {
            return null;
        }
        var commands = d.match(/[A-DF-Za-df-z][^A-Za-df-z]*/g);
        if (!commands) {
            return null;
        }
        var res = [];
        for (var i = 0; i < commands.length; i++) {
            var cmd = commands[i];
            var ct = cmd.charAt(0);
            var cmddata = (ct.toLowerCase() == 'z') ? [] : SVG2Canvas.splitNumericArgs(cmd.substr(1, cmd.length));
            cmddata.unshift(ct);
            res.push(cmddata);
        }
        return res;
    }

    static arrayToString (res) {
        var str = '';
        for (var i = 0; i < res.length; i++) {
            var cmd = res[i];
            str += cmd[0];
            if (cmd.length > 1) {
                cmd.shift();
                str += cmd.toString();
            }
        }
        return str;
    }

    static getAbsoluteCommands (list) {
        var res = [];
        for (var i = 0; i < list.length; i++) {
            res.push(SVG2Canvas.getAbsoluteCommand(list[i]));
        }
        return res;
    }

    static getAbsoluteCommand (cmd) {
        var key = cmd[0];
        acurve = curveoptions.indexOf(key) > -1;
        aqcurve = qcurveoptions.indexOf(key) > -1;
        return dispatchAbsouluteCmd[key](cmd);
    }

    // moves
    static setAbsoluteMove (cmd) {
        acurve = false;
        aqcurve = false;
        endp = {
            x: cmd[1],
            y: cmd[2]
        };
        startp = endp;
        lastcxy = endp;
        return cmd;
    }

    static setRelativeMove (cmd) {
        endp = {
            x: cmd[1],
            y: cmd[2]
        };
        startp = endp;
        return ['M', endp.x, endp.y];
    }

    // lines
    static setClosePath (cmd) {
        endp = startp;
        return cmd;
    }

    static setAbsoluteLine (cmd) {
        endp = {
            x: cmd[1],
            y: cmd[2]
        };
        return cmd;
    }

    static setRelativeLine (cmd) {
        endp = Vector.sum(endp, {
            x: cmd[1],
            y: cmd[2]
        });
        return ['L', endp.x, endp.y];
    }

    static setAbsoluteHLine (cmd) {

        endp = {
            x: cmd[1],
            y: endp.y
        };
        return ['L', endp.x, endp.y];
    }

    static setRelativeHLine (cmd) {
        endp = {
            x: endp.x + cmd[1],
            y: endp.y
        };
        return ['L', endp.x, endp.y];
    }

    static setAbsoluteVLine (cmd) {
        endp = {
            x: endp.x,
            y: cmd[1]
        };
        return ['L', endp.x, endp.y];
    }

    static setRelativeVLine (cmd) {
        endp = {
            x: endp.x,
            y: endp.y + cmd[1]
        };
        return ['L', endp.x, endp.y];
    }

    // curves
    // Cubic
    static setAbsoluteCurve (cmd) {
        lastcxy = {
            x: cmd[3],
            y: cmd[4]
        };
        endp = {
            x: cmd[5],
            y: cmd[6]
        };
        return cmd;
    }

    static setRelativeCurve (cmd) {
        var pt1 = {
            x: cmd[1],
            y: cmd[2]
        };
        var pt2 = {
            x: cmd[3],
            y: cmd[4]
        };
        var pt3 = {
            x: cmd[5],
            y: cmd[6]
        };
        var c1 = Vector.sum(endp, pt1);
        var c2 = Vector.sum(endp, pt2);
        lastcxy = c2;
        endp = Vector.sum(endp, pt3);
        return ['C', c1.x, c1.y, c2.x, c2.y, endp.x, endp.y];
    }

    static setAbsoluteSmooth (cmd) {
        lastcxy = {
            x: cmd[1],
            y: cmd[2]
        };
        endp = {
            x: cmd[3],
            y: cmd[4]
        };
        return cmd;
    }

    static setRelativeSmooth (cmd) {
        var c1 = acurve ?
            Vector.sum(endp, Vector.diff(endp, lastcxy)) :
            endp;
        var c2 = Vector.sum(endp, {
            x: cmd[1],
            y: cmd[2]
        });
        var endat = Vector.sum(endp, {
            x: cmd[3],
            y: cmd[4]
        });
        endp = endat;
        lastcxy = c2;
        // change it to absolute "C"
        return ['C', c1.x, c1.y, c2.x, c2.y, endat.x, endat.y];
    }

    // 	Quadratic
    static setAbsoluteQCurve (cmd) {
        lastcxy = {
            x: cmd[1],
            y: cmd[2]
        };
        endp = {
            x: cmd[3],
            y: cmd[4]
        };
        return cmd;
    }

    static setRelativeQCurve (cmd) {
        lastcxy = Vector.sum(endp, {
            x: cmd[1],
            y: cmd[2]
        });
        endp = Vector.sum(endp, {
            x: cmd[3],
            y: cmd[4]
        });
        return ['Q', lastcxy.x, lastcxy.y, null, null];
    }

    static setAbsoluteQSmooth (cmd) {
        var c1 = aqcurve ?
            Vector.sum(endp, Vector.diff(endp, lastcxy)) :
            endp;
        endp = {
            x: cmd[1],
            y: cmd[2]
        };
        lastcxy = c1;
        return cmd;
    }

    static setRelativeQSmooth (cmd) {
        lastcxy = aqcurve ?
            Vector.sum(endp, Vector.diff(endp, lastcxy)) :
            endp;
        endp = Vector.sum(endp, {
            x: cmd[1],
            y: cmd[2]
        });
        return ['T', endp.x, endp.y];
    }
}

//////////////////////////////////////
// Dispatch tables
//////////////////////////////////////

let dispatchDrawCmd = {
    'M': SVG2Canvas.absoulteMove,
    'm': SVG2Canvas.relativeMove,
    'L': SVG2Canvas.absoluteLine,
    'l': SVG2Canvas.relativeLine,
    'H': SVG2Canvas.absoluteHLine,
    'h': SVG2Canvas.relativeHLine,
    'V': SVG2Canvas.absoluteVLine,
    'v': SVG2Canvas.relativeVLine,
    'C': SVG2Canvas.absoluteCurve,
    'c': SVG2Canvas.relativeCurve,
    'S': SVG2Canvas.absoluteSmooth,
    's': SVG2Canvas.relativeSmooth,
    'Q': SVG2Canvas.absoluteQCurve,
    'q': SVG2Canvas.relativeQCurve,
    'T': SVG2Canvas.absoluteQSmooth,
    't': SVG2Canvas.relativeQSmooth,
    'Z': SVG2Canvas.closePath,
    'z': SVG2Canvas.closePath
};

let dispatchAbsouluteCmd = {
    'M': SVG2Canvas.setAbsoluteMove,
    'm': SVG2Canvas.setRelativeMove,
    'L': SVG2Canvas.setAbsoluteLine,
    'l': SVG2Canvas.setRelativeLine,
    'H': SVG2Canvas.setAbsoluteHLine,
    'h': SVG2Canvas.setRelativeHLine,
    'V': SVG2Canvas.setAbsoluteVLine,
    'v': SVG2Canvas.setRelativeVLine,
    'C': SVG2Canvas.setAbsoluteCurve,
    'c': SVG2Canvas.setRelativeCurve,
    'S': SVG2Canvas.setAbsoluteSmooth,
    's': SVG2Canvas.setRelativeSmooth,
    'Q': SVG2Canvas.setAbsoluteQCurve,
    'q': SVG2Canvas.setRelativeQCurve,
    'T': SVG2Canvas.setAbsoluteQSmooth,
    't': SVG2Canvas.setRelativeQSmooth,
    'Z': SVG2Canvas.setClosePath,
    'z': SVG2Canvas.setClosePath
};
