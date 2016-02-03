import DrawPath from '../../utils/DrawPath';
import {globalx, globaly, scaleMultiplier, newCanvas,
    setCanvasSize, setProps, writeText, getStringSize} from '../../utils/lib';

let balloon = undefined;

export default class Alert {
    static get balloon () {
        return balloon;
    }

    static close () {
        if (!balloon) {
            return;
        }
        balloon.parentNode.removeChild(balloon);
        balloon = undefined;
    }

    static open (p, obj, label, color) {
        if (balloon) {
            Alert.close();
        }
        var scale = scaleMultiplier;
        var w = 80;
        var h = 24;
        var dx = (globalx(obj, obj.offsetLeft) + (obj.offsetWidth / 2)) - (w + 7 * 2 + 4) * scale / 2;
        var dy = globaly(obj, obj.offsetTop) - (24 * scale);
        if (dy < 5 * scale) {
            dy = 5 * scale;
        }

        balloon = newCanvas(p, dx, dy, w, h, {
            position: 'absolute',
            zIndex: 2
        });
        balloon.icon = obj;
        var ctx = balloon.getContext('2d');
        w = 16 + getStringSize(ctx, 'bold 14px Verdana', label).width;
        if (w < 36) {
            w = 36;
        }
        dx = (globalx(obj, obj.offsetLeft) + (obj.offsetWidth / 2)) - (w + 7 * 2 + 4) * scale / 2;
        if (dx < 5 * scale) {
            dx = 5 * scale;
        }
        dx = Math.floor(dx);
        setCanvasSize(balloon, w, 36);
        setProps(balloon.style, {
            position: 'absolute',
            left: dx + 'px',
            zIndex: 1000,
            webkitTransform: 'translate(' + (-w / 2) + 'px, ' + (-h / 2) + 'px) ' +
                'scale(' + scale + ', ' + scale + ') ' +
                'translate(' + (w / 2) + 'px, ' + (h / 2) + 'px) '
        });
        Alert.draw(balloon.getContext('2d'), 6, w, h, color);
        writeText(ctx, 'bold 14px Verdana', 'white', label, 20, 8);
    }

    static draw (ctx, curve, w, h, color) {
        curve = 10;
        var path = new Array(['M', 0, curve], ['q', 0, -curve, curve, -curve], ['h', w - curve * 2],
            ['q', curve, 0, curve, curve], ['v', h - curve * 2], ['q', 0, curve, -curve, curve],
            ['h', -(w / 2) + 7 + curve], ['l', -7, 7], ['l', -7, -7], ['h', -(w / 2) + 7 + curve],
            ['q', -curve, 0, -curve, -curve], ['Z']
        );
        ctx.clearRect(0, 0, Math.max(ctx.canvas.width, w), Math.max(ctx.canvas.height, h));
        ctx.fillStyle = color;
        ctx.beginPath();
        DrawPath.render(ctx, path);
        ctx.fill();
    }
}
