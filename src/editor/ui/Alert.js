var Alert = function () {};

Alert.balloon = undefined;

Alert.close = function () {
    if (!Alert.balloon) {
        return;
    }
    Alert.balloon.parentNode.removeChild(Alert.balloon);
    Alert.balloon = undefined;
};

Alert.open = function (p, obj, label, color) {
    if (Alert.balloon) {
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

    Alert.balloon = newCanvas(p, dx, dy, w, h, {
        position: 'absolute',
        zIndex: 2
    });
    Alert.balloon.icon = obj;
    var ctx = Alert.balloon.getContext('2d');
    w = 16 + getStringSize(ctx, 'bold 14px Verdana', label).width;
    if (w < 36) {
        w = 36;
    }
    dx = (globalx(obj, obj.offsetLeft) + (obj.offsetWidth / 2)) - (w + 7 * 2 + 4) * scale / 2;
    if (dx < 5 * scale) {
        dx = 5 * scale;
    }
    dx = Math.floor(dx);
    setCanvasSize(Alert.balloon, w, 36);
    setProps(Alert.balloon.style, {
        position: 'absolute',
        left: dx + 'px',
        zIndex: 1000,
        webkitTransform: 'translate(' + (-w / 2) + 'px, ' + (-h / 2) + 'px) ' +
            'scale(' + scale + ', ' + scale + ') ' +
            'translate(' + (w / 2) + 'px, ' + (h / 2) + 'px) '
    });
    Alert.draw(Alert.balloon.getContext('2d'), 6, w, h, color);
    writeText(ctx, 'bold 14px Verdana', 'white', label, 20, 8);
};

Alert.draw = function (ctx, curve, w, h, color) {
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
};
