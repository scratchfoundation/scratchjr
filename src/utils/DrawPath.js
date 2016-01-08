var DrawPath = function () {};

DrawPath.startx = 0;
DrawPath.starty = 0;
DrawPath.pathx = 0;
DrawPath.pathy = 0;
DrawPath.aCurve = false;

DrawPath.render = function (ctx, path) {
    DrawPath.pathx = 0;
    DrawPath.pathy = 0; // start top left
    DrawPath.aCurve = false;
    for (var i in path) {
        DrawPath.drawSection(path[i], ctx);
    }
};

DrawPath.drawSection = function (item, ctx) {
    var cx, cy, px, py;
    switch ((String(item[0])).toLowerCase()) {
    case 'm': DrawPath.absoluteMove(item[1], item[2]);
        ctx.moveTo(DrawPath.pathx, DrawPath.pathy);
        DrawPath.startx = item[1];  DrawPath.starty = item[2];
        break;
    case 'l': DrawPath.relativeMove(item[1], item[2]); ctx.lineTo(DrawPath.pathx, DrawPath.pathy);
        break;
    case 'h': DrawPath.pathx += item[1]; ctx.lineTo(DrawPath.pathx, DrawPath.pathy);
        break;
    case 'v': DrawPath.pathy += item[1]; ctx.lineTo(DrawPath.pathx, DrawPath.pathy);
        break;
    case 'q':
        cx = DrawPath.pathx + item[1];
        cy = DrawPath.pathy + item[2];
        px = DrawPath.pathx + item[3];
        py = DrawPath.pathy + item[4];
        ctx.quadraticCurveTo(cx, cy, px, py);
        DrawPath.relativeMove(item[3], item[4]);
        break;
    case 'c': // beziers
        cx = DrawPath.pathx + item[1];
        cy = DrawPath.pathy + item[2];
        var c2x = DrawPath.pathx + item[3];
        var c2y = DrawPath.pathy + item[4];
        px = DrawPath.pathx + item[5];
        py = DrawPath.pathy + item[6];
        ctx.bezierCurveTo(cx, cy, c2x, c2y, px, py);
        DrawPath.relativeMove(item[5], item[6]);
        break;
    case 'z': DrawPath.absoluteMove(DrawPath.startx, DrawPath.starty);
        ctx.lineTo(DrawPath.pathx, DrawPath.pathy);
        break;
    default: // Command not implemented
        break;
    }
};

DrawPath.absoluteMove = function (dx, dy) {
    DrawPath.pathx = dx;
    DrawPath.pathy = dy;
};

DrawPath.relativeMove = function (dx, dy) {
    DrawPath.pathx += dx;
    DrawPath.pathy += dy;
};
