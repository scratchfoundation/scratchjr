let startx = 0;
let starty = 0;
let pathx = 0;
let pathy = 0;

export default class DrawPath {
    static render (ctx, path) {
        pathx = 0;
        pathy = 0; // start top left
        for (var i in path) {
            DrawPath.drawSection(path[i], ctx);
        }
    }

    static drawSection (item, ctx) {
        var cx, cy, px, py;
        switch ((String(item[0])).toLowerCase()) {
        case 'm': DrawPath.absoluteMove(item[1], item[2]);
            ctx.moveTo(pathx, pathy);
            startx = item[1];  starty = item[2];
            break;
        case 'l': DrawPath.relativeMove(item[1], item[2]); ctx.lineTo(pathx, pathy);
            break;
        case 'h': pathx += item[1]; ctx.lineTo(pathx, pathy);
            break;
        case 'v': pathy += item[1]; ctx.lineTo(pathx, pathy);
            break;
        case 'q':
            cx = pathx + item[1];
            cy = pathy + item[2];
            px = pathx + item[3];
            py = pathy + item[4];
            ctx.quadraticCurveTo(cx, cy, px, py);
            DrawPath.relativeMove(item[3], item[4]);
            break;
        case 'c': // beziers
            cx = pathx + item[1];
            cy = pathy + item[2];
            var c2x = pathx + item[3];
            var c2y = pathy + item[4];
            px = pathx + item[5];
            py = pathy + item[6];
            ctx.bezierCurveTo(cx, cy, c2x, c2y, px, py);
            DrawPath.relativeMove(item[5], item[6]);
            break;
        case 'z': DrawPath.absoluteMove(startx, starty);
            ctx.lineTo(pathx, pathy);
            break;
        default: // Command not implemented
            break;
        }
    }

    static absoluteMove (dx, dy) {
        pathx = dx;
        pathy = dy;
    }

    static relativeMove (dx, dy) {
        pathx += dx;
        pathy += dy;
    }
}
