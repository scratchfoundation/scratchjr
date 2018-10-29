export var frame;
// XXX: isTablet is legacy code that can be used to detect if we're running on a desktop browser
// There are references to it throughout the codebase, should possibly be removed at some point
export const isTablet = (window.orientation != 'undefined');
export const DEGTOR = Math.PI / 180;
export const WINDOW_INNER_HEIGHT = window.innerHeight;
export const WINDOW_INNER_WIDTH = window.innerWidth;
export const scaleMultiplier = WINDOW_INNER_HEIGHT / 768.0;
export const fullscreenScaleMultiplier = 136;

export const isiOS = (typeof AndroidInterface == 'undefined');
export const isAndroid = (typeof AndroidInterface != 'undefined');

export function libInit () {
    frame = document.getElementById('frame');
}
/**
 * Takes a string and evaluates all ${} as JavaScript and returns the resulting string.
 */
export function preprocess (s) {
    var result = '';
    var len = s.length;
    var i = 0;
    var j;
    while ((i < len) && ((j = s.indexOf('$', i)) != -1)) {
        result += s.substring(i, j);
        i = j + 1;
        if ((i < (len - 1)) && (s[i] === '{')) {
            var start = i + 1;
            var end = s.indexOf('}', start);
            if (end != -1) {
                var expression = s.substring(start, end);
                result += eval(expression);
                i = end + 1;
            } else {
                result += '$';
            }
        } else {
            result += '$';
        }
    }
    if (i < len) {
        result += s.substring(i);
    }
    return result;
}

/**
 * Load the URL synchronously (fine because it's file://), preprocess the result and return the string.
 */
export function preprocessAndLoad (url) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', url, false);
    xmlhttp.send();
    return preprocess(xmlhttp.responseText);
}

/**
 * Load a CSS file, preprocess it using preprocessAndLoad() and then returns it as a style tag.
 * Also rewrites all instances of url() with a different base
 */
export function preprocessAndLoadCss (baseUrl, url) {
    var cssData = preprocessAndLoad(url);
    cssData = cssData.replace(/url\('/g, 'url(\'' + baseUrl + '/');
    cssData = cssData.replace(/url\(([^'])/g, 'url(' + baseUrl + '/$1');

    const head = document.head;
    let style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet) {
        style.styleSheet.cssText = cssData;
    } else {
        style.appendChild(document.createTextNode(cssData));
    }
    head.appendChild(style);
}

export function rl () {
    window.location.reload();
}

export function newDiv (parent, x, y, w, h, styles) {
    var el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.top = y + 'px';
    el.style.left = x + 'px';
    if (w) {
        el.style.width = w + 'px';
    }
    if (h) {
        el.style.height = h + 'px';
    }
    setProps(el.style, styles);
    parent.appendChild(el);
    return el;
}

export function newImage (parent, src, styles) {
    var img = document.createElement('img');
    img.src = src;
    setProps(img.style, styles);
    if (parent) {
        parent.appendChild(img);
    }
    return img;
}

export function newCanvas (parent, x, y, w, h, styles) {
    var canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = y + 'px';
    canvas.style.left = x + 'px';
    setCanvasSize(canvas, w, h);
    setProps(canvas.style, styles);
    parent.appendChild(canvas);
    return canvas;
}

export function newHTML (type, c, p) {
    var e = document.createElement(type);
    if (c) {
        e.setAttribute('class', c);
    }
    if (p) {
        p.appendChild(e);
    }
    return e;
}

export function newP (parent, text, styles) {
    var p = document.createElement('p');
    p.appendChild(document.createTextNode(text));
    setProps(p.style, styles);
    parent.appendChild(p);
    return p;
}

export function hitRect (c, pt) {
    if (!pt) {
        return false;
    }
    if (!c) {
        return false;
    }
    var x = pt.x;
    var y = pt.y;
    if (c.offsetLeft == undefined) {
        return false;
    }
    if (c.offsetTop == undefined) {
        return false;
    }
    if (x < c.offsetLeft) {
        return false;
    }
    if (x > c.offsetLeft + c.offsetWidth) {
        return false;
    }
    if (y < c.offsetTop) {
        return false;
    }
    if (y > c.offsetTop + c.offsetHeight) {
        return false;
    }
    return true;
}

export function hit3DRect (c, pt) {
    if (!pt) {
        return;
    }
    var x = pt.x;
    var y = pt.y;
    var mtx = new WebKitCSSMatrix(window.getComputedStyle(c).webkitTransform);
    if (mtx.m41 == undefined) {
        return false;
    }
    if (mtx.m42 == undefined) {
        return false;
    }
    if (x < mtx.m41) {
        return false;
    }
    if (x > mtx.m41 + c.offsetWidth) {
        return false;
    }
    if (y < mtx.m42) {
        return false;
    }
    if (y > mtx.m42 + c.offsetHeight) {
        return false;
    }
    return true;
}

export function hitTest (c, pt) {
    if (!pt) {
        return;
    }
    var x = pt.x;
    var y = pt.y;
    if (x < c.offsetLeft) {
        return false;
    }
    if (x > c.offsetLeft + c.offsetWidth) {
        return false;
    }
    if (y < c.offsetTop) {
        return false;
    }
    if (y > c.offsetTop + c.offsetHeight) {
        return false;
    }
    var dx = pt.x - c.offsetLeft,
        dy = pt.y - c.offsetTop;
    var ctx = c.getContext('2d');
    var pixel = ctx.getImageData(dx, dy, 1, 1).data;
    if (pixel[3] == 0) {
        return false;
    }
    return true;
}

export function setCanvasSize (c, w, h) {
    c.width = w;
    c.height = h;
    c.style.width = w + 'px';
    c.style.height = h + 'px';
}

export function setCanvasSizeScaledToWindowDocumentHeight (c, w, h) {
    var multiplier = window.devicePixelRatio * scaleMultiplier;
    var scaledWidth = Math.floor(w * multiplier);
    var scaledHeight = Math.floor(h * multiplier);
    c.width = scaledWidth;
    c.height = scaledHeight;
    c.style.width = scaledWidth + 'px';
    c.style.height = scaledHeight + 'px';
    c.style.zoom = scaleMultiplier / multiplier;
}

export function localx (el, gx) {
    var lx = gx;
    while (el && el.offsetTop != undefined) {
        lx -= el.offsetLeft + el.clientLeft +
            (new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform)).m41;
        el = el.parentNode;
    }
    return lx;
}

export function globalx (el) {
    var lx = 0;
    while (el && el.offsetLeft != undefined) {
        var webkitTransform = new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform);
        var transformScale = webkitTransform.m11;
        lx += (el.clientWidth - (transformScale * el.clientWidth)) / 2;
        var transformX = webkitTransform.m41;
        lx += transformX;
        lx += el.offsetLeft + el.clientLeft;
        el = el.parentNode;
    }
    return lx;
}

export function localy (el, gy) {
    var ly = gy;
    while (el && el.offsetTop != undefined) {
        ly -= el.offsetTop + el.clientTop + (new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform)).m42;
        el = el.parentNode;
    }
    return ly;
}

export function globaly (el) {
    var ly = 0;
    while (el && el.offsetTop != undefined) {
        var webkitTransform = new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform);
        var transformScale = webkitTransform.m22;
        ly += (el.clientHeight - (transformScale * el.clientHeight)) / 2;
        var transformY = webkitTransform.m42;
        ly += transformY;
        ly += el.offsetTop + el.clientTop;
        el = el.parentNode;
    }
    return ly;
}

export function setProps (object, props) {
    for (var i in props) {
        object[i] = props[i];
    }
}

// ["ease", "linear", "ease-in", "ease-out", "ease-in-out", "step-start", "step-end"];
export function CSSTransition (el, obj) {
    // default
    var duration = 1;
    var transition = 'ease';
    var style = {
        left: el.offsetLeft + 'px',
        top: el.offsetTop + 'px'
    };
    if (obj.duration) {
        duration = obj.duration;
    }
    if (obj.transition) {
        transition = obj.transition;
    }
    if (obj.style) {
        style = obj.style;
    }
    var items = '';
    for (var key in style) {
        items += key + ' ' + duration + 's ' + transition + ', ';
    }
    items = items.substring(0, items.length - 2);
    el.style.webkitTransition = items;
    el.addEventListener('webkitTransitionEnd', transitionDene, true);
    setProps(el.style, style);
    function transitionDene () {
        el.style.webkitTransition = '';
        if (obj.onComplete) {
            obj.onComplete();
        }
    }
}

export function CSSTransition3D (el, obj) {
    // default
    var duration = 1;
    var transition = 'ease';
    var style = {
        left: el.left + 'px',
        top: el.top + 'px'
    }; // keepit where it is
    if (obj.duration) {
        duration = obj.duration;
    }
    if (obj.transition) {
        transition = obj.transition;
    }
    if (obj.style) {
        for (var key in obj.style) {
            style[key] = obj.style[key];
        }
    }
    var items = '-webkit-transform ' + duration + 's ' + transition;
    var translate = 'translate3d(' + style.left + ',' + style.top + ',0px)';
    el.addEventListener('webkitTransitionEnd', transitionDone, true);
    el.style.webkitTransition = items;
    el.style.webkitTransform = translate;
    function transitionDone () {
        el.style.webkitTransition = '';
        var mtx = new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform);
        el.left = mtx.m41;
        el.top = mtx.m42;
        if (obj.onComplete) {
            obj.onComplete();
        }
    }
}

export function drawThumbnail (img, c) {
    // naturalWidth Height it gets the zoom scaling properly
    var w = img.naturalWidth ? img.naturalWidth : img.width;
    var h = img.naturalHeight ? img.naturalHeight : img.height;
    var dx = (c.width - w) / 2;
    var dy = (c.height - h) / 2;
    var dw = c.width / w;
    var dh = c.height / h;
    var wi = w;
    var he = h;
    switch (getFit(dw, dh)) {
    case 'noscale':
        break;
    case 'scaleh':
        wi = w * dh;
        he = h * dh;
        dx = (c.width - wi) / 2;
        dy = (c.height - he) / 2;
        break;
    case 'scalew':
        wi = w * dw;
        he = h * dw;
        dx = (c.width - wi) / 2;
        dy = (c.height - he) / 2;
        break;
    }
    var ctx = c.getContext('2d');
    ctx.drawImage(img, dx, dy, wi, he);
}

// Like drawThumbnail, but scales up if needed
export function drawScaled (img, c) {
    var imgWidth = img.naturalWidth ? img.naturalWidth : img.width;
    var imgHeight = img.naturalHeight ? img.naturalHeight : img.height;
    var boxWidth = c.width;
    var boxHeight = c.height;
    var scale = boxWidth / imgWidth;
    var w = imgWidth * scale;
    var h = imgHeight * scale;
    if (h > boxHeight) {
        scale = boxHeight / imgHeight;
        w = imgWidth * scale;
        h = imgHeight * scale;
    }
    var x0 = (boxWidth - w) / 2;
    var y0 = (boxHeight - h) / 2;
    var ctx = c.getContext('2d');
    ctx.drawImage(img, x0, y0, w, h);
}

export function fitInRect (srcw, srch, destw, desth) {
    var dx = (destw - srcw) / 2;
    var dy = (desth - srch) / 2;
    var dw = destw / srcw;
    var dh = desth / srch;
    var wi = srcw;
    var he = srch;
    switch (getFit(dw, dh)) {
    case 'noscale':
        break;
    case 'scaleh':
        wi = srcw * dh;
        he = srch * dh;
        dx = (destw - wi) / 2;
        dy = (desth - he) / 2;
        break;
    case 'scalew':
        wi = srcw * dw;
        he = srch * dw;
        dx = (destw - wi) / 2;
        dy = (desth - he) / 2;
        break;
    }
    return [dx, dy, wi, he];
}

export function getFit (dw, dh) {
    if ((dw >= 1) && (dh >= 1)) {
        return 'noscale';
    }
    if ((dw >= 1) && (dh < 1)) {
        return 'scaleh';
    }
    if ((dw < 1) && (dh >= 1)) {
        return 'scalew';
    }
    if (dw < dh) {
        return 'scalew';
    }
    return 'scaleh';
}

export function getDocumentHeight () {
    return Math.max(document.body.clientHeight, document.documentElement.clientHeight);
}

export function getDocumentWidth () {
    return Math.max(document.body.clientWidth, document.documentElement.clientWidth);
}

export function getStringSize (ctx, f, label) {
    ctx.font = f;
    return ctx.measureText(label);
}

export function writeText (ctx, f, c, label, dy, dx) {
    dx = (dx == undefined) ? 0 : dx;
    ctx.font = f;
    ctx.fillStyle = c;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, dx, dy);
}

export function gn (str) {
    return document.getElementById(str);
}

export function newForm (parent, str, x, y, w, h, styles) {
    var el = document.createElement('form');
    el.style.position = 'absolute';
    el.style.top = y + 'px';
    el.style.left = x + 'px';
    if (w) {
        el.style.width = w + 'px';
    }
    if (h) {
        el.style.height = h + 'px';
    }
    setProps(el.style, styles);
    parent.appendChild(el);
    el.name = str;
    return el;
}

export function newTextInput (p, type, str, mstyle) {
    var input = document.createElement('input');
    input.value = str;
    setProps(input.style, mstyle);
    input.type = type;
    p.appendChild(input);
    return input;
}

export function getUrlVars () {
    if (window.location.href.indexOf('?') < 0) {
        return [];
    }
    var args = window.location.href.slice(window.location.href.indexOf('?') + 1);
    var vars = [], hash;
    var hashes = args.split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

export function getIdFor (name) {
    var n = 1;
    while (gn(name + ' ' + n) != undefined) {
        n++;
    }
    return name + ' ' + n;
}


export function getIdForCamera (name) {
    var n = 1;
    while (gn(name + '_' + n) != undefined) {
        n++;
    }
    return name + '_' + n;
}

////////////////////
// Color
/////////////////////

export function rgb2hsb (str) {
    if (str == null) {
        return [24, 1, 1];
    }
    var min, val, f, i, hue, sat;
    str = (str.indexOf('rgb') > -1) ? rgbToHex(str) : rgbaToHex(str);
    var num = parseInt(str.substring(1, str.length), 16);
    var rgb = getRGB(num);
    var red = rgb[0];
    red /= 255;
    var grn = rgb[1];
    grn /= 255;
    var blu = rgb[2];
    blu /= 255;
    min = Math.min(Math.min(red, grn), blu);
    val = Math.max(Math.max(red, grn), blu);
    if (min == val) {
        return new Array(0, 0, val);
    }
    f = (red == min) ? grn - blu : ((grn == min) ? blu - red : red - grn);
    i = (red == min) ? 3 : ((grn == min) ? 5 : 1);
    hue = Math.round((i - f / (val - min)) * 60) % 360;
    sat = Math.round(((val - min) / val) * 100);
    val = Math.round(val * 100);
    return new Array(hue, sat / 100, val / 100);
}

export function rgbToHex (str) {
    if (str.indexOf('rgb') < 0) {
        return str;
    }
    var res = str.substring(4, str.length - 1);
    var a = res.split(',');
    var red = Number(a[0]);
    var grn = Number(a[1]);
    var blu = Number(a[2]);
    return rgbToString({
        r: red,
        g: grn,
        b: blu
    });
}

export function rgbaToHex (str) {
    if (str.indexOf('rgba') < 0) {
        return str;
    }
    var res = str.substring(5, str.length - 1);
    var a = res.split(',');
    var red = Number(a[0]);
    var grn = Number(a[1]);
    var blu = Number(a[2]);
    return rgbToString({
        r: red,
        g: grn,
        b: blu
    });
}


export function rgbToString (obj) {
    return '#' + getHex(obj.r) + getHex(obj.g) + getHex(obj.b);
}

export function getRGB (color) {
    return [
        (Number((color >> 16) & 255)),
        (Number((color >> 8) & 255)),
        (Number(color & 255))
    ];
}

export function getHex (num) {
    var hex = num.toString(16);
    if (hex.length == 1) {
        return '0' + hex;
    }
    return hex;
}

// findKeyframesRule ("swing");

export function findKeyframesRule (rule) {
    var ss = document.styleSheets;
    for (var i = 0; i < ss.length; ++i) {
        for (var j = 0; j < ss[i].cssRules.length; ++j) {
            var styles = ss[i].cssRules[j].styleSheet.rules;
            for (var k = 0; k < styles.length; ++k) {
                if (styles[k].type == window.CSSRule.WEBKIT_KEYFRAMES_RULE && styles[k].name == rule) {
                    return styles[k];
                }
            }
        }
    } // rule not found
    return null;
}

export function colorToRGBA (color, opacity) {
    var val = parseInt('0x' + color.substr(1, color.length));
    return 'rgba(' + (val >> 16) % 256 + ',' + (val >> 8) % 256 + ',' + (val % 256) + ',' + opacity + ')';
}

/**
 * css units vh and vw (for % of height and width) are not supported in Android 4.3 and earlier, so
 * here we introduce functioncs (called from the preprocessed css) that emulate their behavior by
 * turning them into pixel values.
 */
export function css_vh (y) {
    return (y * WINDOW_INNER_HEIGHT / 100.0) + 'px';
}

export function css_vw (x) {
    return (x * WINDOW_INNER_WIDTH / 100.0) + 'px';
}

Number.prototype.mod = function (n) {
    return ((this % n) + n) % n;
};
