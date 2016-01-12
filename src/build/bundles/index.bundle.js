/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _lib = __webpack_require__(1);

	var _Localization = __webpack_require__(2);

	var _Localization2 = _interopRequireDefault(_Localization);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function startup() {
	    ScratchAudio.init();
	    var urlvars = _lib.Lib.getUrlVars();
	    if (urlvars.back) {
	        loadOptions();
	    } else {
	        firstTime();
	    }
	    setTimeout(function () {
	        _lib.Lib.gn('rays').className = 'rays spinme';
	    }, 250);
	}

	function firstTime() {
	    _lib.Lib.gn('authors').className = 'credits show';
	    _lib.Lib.gn('authorsText').className = 'creditsText show';
	    _lib.Lib.gn('purpleguy').className = 'purple show';
	    _lib.Lib.gn('blueguy').className = 'blue show';
	    _lib.Lib.gn('redguy').className = 'red show';
	    iOS.askpermission(); // ask for sound recording
	    setTimeout(function () {
	        iOS.hidesplash(doit);
	    }, 500);
	    function doit() {
	        ScratchAudio.sndFX('tap.wav');
	        window.ontouchend = function () {
	            loadOptions();
	        };
	    }
	    setTimeout(function () {
	        loadOptions();
	    }, 2000);
	}

	function loadOptions() {
	    _lib.Lib.gn('authors').className = 'credits hide';
	    _lib.Lib.gn('authorsText').className = 'creditsText hide';
	    _lib.Lib.gn('purpleguy').className = 'purple hide';
	    _lib.Lib.gn('blueguy').className = 'blue hide';
	    _lib.Lib.gn('redguy').className = 'red hide';
	    _lib.Lib.gn('gettings').className = 'gettings show';
	    _lib.Lib.gn('startcode').className = 'startcode show';
	    document.ontouchmove = function (e) {
	        e.preventDefault();
	    };
	    if (_lib.isAndroid) {
	        AndroidInterface.notifySplashDone();
	    }
	}

	function gohome() {
	    // On iOS, sounds are loaded async, but the code as written expects to play tap.wav when we enter home.html
	    // (but since it isn't loaded yet, no sound is played).
	    // On Android, sync sounds means both calls to tap.wav result in a sound play.
	    // XXX: we should re-write the lobby loading to wait for the sounds to load, and not play a sound here.
	    if (_lib.isiOS) {
	        ScratchAudio.sndFX('tap.wav');
	    }
	    iOS.setfile('homescroll.sjr', 0, function () {
	        doNext();
	    });
	    function doNext() {
	        window.location.href = 'home.html';
	    }
	}

	function gettingstarted() {
	    ScratchAudio.sndFX('tap.wav');
	    window.location.href = 'gettingstarted.html?place=home';
	}

	window.onload = function () {
	    _Localization2.default.includeLocales();
	    _lib.Lib.preprocessAndLoadCss('css', 'css/font.css');
	    _lib.Lib.preprocessAndLoadCss('css', 'css/base.css');
	    _lib.Lib.preprocessAndLoadCss('css', 'css/start.css');
	    _lib.Lib.preprocessAndLoadCss('css', 'css/thumbs.css');
	    _lib.Lib.gn('gettings').ontouchend = gettingstarted;
	    _lib.Lib.gn('startcode').ontouchend = gohome;

	    iOS.waitForInterface(startup);
	};

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var frame = exports.frame = undefined;
	// XXX: isTablet is legacy code that can be used to detect if we're running on a desktop browser
	// There are references to it throughout the codebase, should possibly be removed at some point
	var isTablet = exports.isTablet = window.orientation != 'undefined';
	var DEGTOR = exports.DEGTOR = Math.PI / 180;
	var WINDOW_INNER_HEIGHT = exports.WINDOW_INNER_HEIGHT = window.innerHeight;
	var WINDOW_INNER_WIDTH = exports.WINDOW_INNER_WIDTH = window.innerWidth;
	var scaleMultiplier = exports.scaleMultiplier = WINDOW_INNER_HEIGHT / 768.0;

	var isiOS = exports.isiOS = typeof AndroidInterface == 'undefined';
	var isAndroid = exports.isAndroid = typeof AndroidInterface != 'undefined';

	var Lib = function () {
	    function Lib() {
	        _classCallCheck(this, Lib);
	    }

	    _createClass(Lib, null, [{
	        key: 'libInit',
	        value: function libInit() {
	            exports.frame = frame = document.getElementById('frame');
	        }
	        /**
	         * Takes a string and evaluates all ${} as JavaScript and returns the resulting string.
	         */

	    }, {
	        key: 'preprocess',
	        value: function preprocess(s) {
	            var result = '';
	            var len = s.length;
	            var i = 0;
	            var j;
	            while (i < len && (j = s.indexOf('$', i)) != -1) {
	                result += s.substring(i, j);
	                i = j + 1;
	                if (i < len - 1 && s[i] === '{') {
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

	    }, {
	        key: 'preprocessAndLoad',
	        value: function preprocessAndLoad(url) {
	            var xmlhttp = new XMLHttpRequest();
	            xmlhttp.open('GET', url, false);
	            xmlhttp.send();
	            return this.preprocess(xmlhttp.responseText);
	        }

	        /**
	         * Load a CSS file, preprocess it using preprocessAndLoad() and then returns it as a style tag.
	         * Also rewrites all instances of url() with a different base
	         */

	    }, {
	        key: 'preprocessAndLoadCss',
	        value: function preprocessAndLoadCss(baseUrl, url) {
	            document.write('<!-- ' + url + '-->\n');
	            document.write('<style type=\'text/css\'>\n');
	            var cssData = this.preprocessAndLoad(url);
	            cssData = cssData.replace(/url\('/g, 'url(\'' + baseUrl + '/');
	            cssData = cssData.replace(/url\(([^'])/g, 'url(' + baseUrl + '/$1');
	            document.write(cssData);
	            document.write('\n</style>\n');
	        }
	    }, {
	        key: 'rl',
	        value: function rl() {
	            window.location.reload();
	        }
	    }, {
	        key: 'newDiv',
	        value: function newDiv(parent, x, y, w, h, styles) {
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
	            this.setProps(el.style, styles);
	            parent.appendChild(el);
	            return el;
	        }
	    }, {
	        key: 'newImage',
	        value: function newImage(parent, src, styles) {
	            var img = document.createElement('img');
	            img.src = src;
	            this.setProps(img.style, styles);
	            if (parent) {
	                parent.appendChild(img);
	            }
	            return img;
	        }
	    }, {
	        key: 'newCanvas',
	        value: function newCanvas(parent, x, y, w, h, styles) {
	            var canvas = document.createElement('canvas');
	            canvas.style.position = 'absolute';
	            canvas.style.top = y + 'px';
	            canvas.style.left = x + 'px';
	            this.setCanvasSize(canvas, w, h);
	            this.setProps(canvas.style, styles);
	            parent.appendChild(canvas);
	            return canvas;
	        }
	    }, {
	        key: 'newHTML',
	        value: function newHTML(type, c, p) {
	            var e = document.createElement(type);
	            if (c) {
	                e.setAttribute('class', c);
	            }
	            if (p) {
	                p.appendChild(e);
	            }
	            return e;
	        }
	    }, {
	        key: 'newP',
	        value: function newP(parent, text, styles) {
	            var p = document.createElement('p');
	            p.appendChild(document.createTextNode(text));
	            this.setProps(p.style, styles);
	            parent.appendChild(p);
	            return p;
	        }
	    }, {
	        key: 'hitRect',
	        value: function hitRect(c, pt) {
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
	    }, {
	        key: 'hit3DRect',
	        value: function hit3DRect(c, pt) {
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
	    }, {
	        key: 'hitTest',
	        value: function hitTest(c, pt) {
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
	    }, {
	        key: 'setCanvasSize',
	        value: function setCanvasSize(c, w, h) {
	            c.width = w;
	            c.height = h;
	            c.style.width = w + 'px';
	            c.style.height = h + 'px';
	        }
	    }, {
	        key: 'setCanvasSizeScaledToWindowDocumentHeight',
	        value: function setCanvasSizeScaledToWindowDocumentHeight(c, w, h) {
	            var multiplier = window.devicePixelRatio * scaleMultiplier;
	            var scaledWidth = Math.floor(w * multiplier);
	            var scaledHeight = Math.floor(h * multiplier);
	            c.width = scaledWidth;
	            c.height = scaledHeight;
	            c.style.width = scaledWidth + 'px';
	            c.style.height = scaledHeight + 'px';
	            c.style.zoom = scaleMultiplier / multiplier;
	        }
	    }, {
	        key: 'localx',
	        value: function localx(el, gx) {
	            var lx = gx;
	            while (el && el.offsetTop != undefined) {
	                lx -= el.offsetLeft + el.clientLeft + new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform).m41;
	                el = el.parentNode;
	            }
	            return lx;
	        }
	    }, {
	        key: 'globalx',
	        value: function globalx(el) {
	            var lx = 0;
	            while (el && el.offsetLeft != undefined) {
	                var webkitTransform = new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform);
	                var transformScale = webkitTransform.m11;
	                lx += (el.clientWidth - transformScale * el.clientWidth) / 2;
	                var transformX = webkitTransform.m41;
	                lx += transformX;
	                lx += el.offsetLeft + el.clientLeft;
	                el = el.parentNode;
	            }
	            return lx;
	        }
	    }, {
	        key: 'localy',
	        value: function localy(el, gy) {
	            var ly = gy;
	            while (el && el.offsetTop != undefined) {
	                ly -= el.offsetTop + el.clientTop + new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform).m42;
	                el = el.parentNode;
	            }
	            return ly;
	        }
	    }, {
	        key: 'globaly',
	        value: function globaly(el) {
	            var ly = 0;
	            while (el && el.offsetTop != undefined) {
	                var webkitTransform = new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform);
	                var transformScale = webkitTransform.m22;
	                ly += (el.clientHeight - transformScale * el.clientHeight) / 2;
	                var transformY = webkitTransform.m42;
	                ly += transformY;
	                ly += el.offsetTop + el.clientTop;
	                el = el.parentNode;
	            }
	            return ly;
	        }
	    }, {
	        key: 'setProps',
	        value: function setProps(object, props) {
	            for (var i in props) {
	                object[i] = props[i];
	            }
	        }

	        // ["ease", "linear", "ease-in", "ease-out", "ease-in-out", "step-start", "step-end"];

	    }, {
	        key: 'CSSTransition',
	        value: function CSSTransition(el, obj) {
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
	            this.setProps(el.style, style);
	            function transitionDene() {
	                el.style.webkitTransition = '';
	                if (obj.onComplete) {
	                    obj.onComplete();
	                }
	            }
	        }
	    }, {
	        key: 'CSSTransition3D',
	        value: function CSSTransition3D(el, obj) {
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
	            function transitionDone() {
	                el.style.webkitTransition = '';
	                var mtx = new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform);
	                el.left = mtx.m41;
	                el.top = mtx.m42;
	                if (obj.onComplete) {
	                    obj.onComplete();
	                }
	            }
	        }
	    }, {
	        key: 'drawThumbnail',
	        value: function drawThumbnail(img, c) {
	            // naturalWidth Height it gets the zoom scaling properly
	            var w = img.naturalWidth ? img.naturalWidth : img.width;
	            var h = img.naturalHeight ? img.naturalHeight : img.height;
	            var dx = (c.width - w) / 2;
	            var dy = (c.height - h) / 2;
	            var dw = c.width / w;
	            var dh = c.height / h;
	            var wi = w;
	            var he = h;
	            switch (this.getFit(dw, dh)) {
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

	    }, {
	        key: 'drawScaled',
	        value: function drawScaled(img, c) {
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
	    }, {
	        key: 'fitInRect',
	        value: function fitInRect(srcw, srch, destw, desth) {
	            var dx = (destw - srcw) / 2;
	            var dy = (desth - srch) / 2;
	            var dw = destw / srcw;
	            var dh = desth / srch;
	            var wi = srcw;
	            var he = srch;
	            switch (this.getFit(dw, dh)) {
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
	    }, {
	        key: 'getFit',
	        value: function getFit(dw, dh) {
	            if (dw >= 1 && dh >= 1) {
	                return 'noscale';
	            }
	            if (dw >= 1 && dh < 1) {
	                return 'scaleh';
	            }
	            if (dw < 1 && dh >= 1) {
	                return 'scalew';
	            }
	            if (dw < dh) {
	                return 'scalew';
	            }
	            return 'scaleh';
	        }
	    }, {
	        key: 'getDocumentHeight',
	        value: function getDocumentHeight() {
	            return Math.max(document.body.clientHeight, document.documentElement.clientHeight);
	        }
	    }, {
	        key: 'getDocumentWidth',
	        value: function getDocumentWidth() {
	            return Math.max(document.body.clientWidth, document.documentElement.clientWidth);
	        }
	    }, {
	        key: 'getStringSize',
	        value: function getStringSize(ctx, f, label) {
	            ctx.font = f;
	            return ctx.measureText(label);
	        }
	    }, {
	        key: 'writeText',
	        value: function writeText(ctx, f, c, label, dy, dx) {
	            dx = dx == undefined ? 0 : dx;
	            ctx.font = f;
	            ctx.fillStyle = c;
	            ctx.textAlign = 'left';
	            ctx.textBaseline = 'bottom';
	            ctx.fillText(label, dx, dy);
	        }
	    }, {
	        key: 'gn',
	        value: function gn(str) {
	            return document.getElementById(str);
	        }
	    }, {
	        key: 'newForm',
	        value: function newForm(parent, str, x, y, w, h, styles) {
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
	            this.setProps(el.style, styles);
	            parent.appendChild(el);
	            el.name = str;
	            return el;
	        }
	    }, {
	        key: 'newTextInput',
	        value: function newTextInput(p, type, str, mstyle) {
	            var input = document.createElement('input');
	            input.value = str;
	            this.setProps(input.style, mstyle);
	            input.type = type;
	            p.appendChild(input);
	            return input;
	        }
	    }, {
	        key: 'getUrlVars',
	        value: function getUrlVars() {
	            if (window.location.href.indexOf('?') < 0) {
	                return [];
	            }
	            var args = window.location.href.slice(window.location.href.indexOf('?') + 1);
	            var vars = [],
	                hash;
	            var hashes = args.split('&');
	            for (var i = 0; i < hashes.length; i++) {
	                hash = hashes[i].split('=');
	                vars.push(hash[0]);
	                vars[hash[0]] = hash[1];
	            }
	            return vars;
	        }
	    }, {
	        key: 'getIdFor',
	        value: function getIdFor(name) {
	            var n = 1;
	            while (this.gn(name + ' ' + n) != undefined) {
	                n++;
	            }
	            return name + ' ' + n;
	        }
	    }, {
	        key: 'getIdForCamera',
	        value: function getIdForCamera(name) {
	            var n = 1;
	            while (this.gn(name + '_' + n) != undefined) {
	                n++;
	            }
	            return name + '_' + n;
	        }

	        ////////////////////
	        // Color
	        /////////////////////

	    }, {
	        key: 'rgb2hsb',
	        value: function rgb2hsb(str) {
	            if (str == null) {
	                return [24, 1, 1];
	            }
	            var min, val, f, i, hue, sat;
	            str = str.indexOf('rgb') > -1 ? this.rgbToHex(str) : this.rgbaToHex(str);
	            var num = parseInt(str.substring(1, str.length), 16);
	            var rgb = this.getRGB(num);
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
	            f = red == min ? grn - blu : grn == min ? blu - red : red - grn;
	            i = red == min ? 3 : grn == min ? 5 : 1;
	            hue = Math.round((i - f / (val - min)) * 60) % 360;
	            sat = Math.round((val - min) / val * 100);
	            val = Math.round(val * 100);
	            return new Array(hue, sat / 100, val / 100);
	        }
	    }, {
	        key: 'rgbToHex',
	        value: function rgbToHex(str) {
	            if (str.indexOf('rgb') < 0) {
	                return str;
	            }
	            var res = str.substring(4, str.length - 1);
	            var a = res.split(',');
	            var red = Number(a[0]);
	            var grn = Number(a[1]);
	            var blu = Number(a[2]);
	            return this.rgbToString({
	                r: red,
	                g: grn,
	                b: blu
	            });
	        }
	    }, {
	        key: 'rgbaToHex',
	        value: function rgbaToHex(str) {
	            if (str.indexOf('rgba') < 0) {
	                return str;
	            }
	            var res = str.substring(5, str.length - 1);
	            var a = res.split(',');
	            var red = Number(a[0]);
	            var grn = Number(a[1]);
	            var blu = Number(a[2]);
	            return this.rgbToString({
	                r: red,
	                g: grn,
	                b: blu
	            });
	        }
	    }, {
	        key: 'rgbToString',
	        value: function rgbToString(obj) {
	            return '#' + this.getHex(obj.r) + this.getHex(obj.g) + this.getHex(obj.b);
	        }
	    }, {
	        key: 'getRGB',
	        value: function getRGB(color) {
	            return [Number(color >> 16 & 255), Number(color >> 8 & 255), Number(color & 255)];
	        }
	    }, {
	        key: 'getHex',
	        value: function getHex(num) {
	            var hex = num.toString(16);
	            if (hex.length == 1) {
	                return '0' + hex;
	            }
	            return hex;
	        }

	        // findKeyframesRule ("swing");

	    }, {
	        key: 'findKeyframesRule',
	        value: function findKeyframesRule(rule) {
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
	    }, {
	        key: 'colorToRGBA',
	        value: function colorToRGBA(color, opacity) {
	            var val = parseInt('0x' + color.substr(1, color.length));
	            return 'rgba(' + (val >> 16) % 256 + ',' + (val >> 8) % 256 + ',' + val % 256 + ',' + opacity + ')';
	        }

	        /**
	         * css units vh and vw (for % of height and width) are not supported in Android 4.3 and earlier, so
	         * here we introduce functioncs (called from the preprocessed css) that emulate their behavior by
	         * turning them into pixel values.
	         */

	    }, {
	        key: 'css_vh',
	        value: function css_vh(y) {
	            return y * WINDOW_INNER_HEIGHT / 100.0 + 'px';
	        }
	    }, {
	        key: 'css_vw',
	        value: function css_vw(x) {
	            return x * WINDOW_INNER_WIDTH / 100.0 + 'px';
	        }
	    }]);

	    return Lib;
	}();

	exports.default = Lib;

	Number.prototype.mod = function (n) {
	    return (this % n + n) % n;
	};

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _Cookie = __webpack_require__(3);

	var _Cookie2 = _interopRequireDefault(_Cookie);

	var _intlMessageformat = __webpack_require__(4);

	var _intlMessageformat2 = _interopRequireDefault(_intlMessageformat);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var currentLocale = undefined;
	var root = '';
	var localizationMessages = {};
	var defaultLocalizationMessages = {};

	// Configuration
	var defaultLocale = window.Settings.defaultLocale;
	var defaultLocaleShort = window.Settings.defaultLocaleShort;
	var supportedLocales = window.Settings.supportedLocales;
	var sampleKeyPrefix = 'key_';

	var Localization = function () {
	    function Localization() {
	        _classCallCheck(this, Localization);
	    }

	    _createClass(Localization, null, [{
	        key: 'determineLocaleFromBrowser',

	        // Take the browser's reported locale from navigator.language
	        // Normalize this value and find a match in supportedLocales
	        // If we support a similar language but not the specific one, it's returned.
	        // E.g., if we support 'en-US' but not 'en-GB', the user gets 'en-US'
	        // The match in supported locales (or the default locale) is returned.
	        value: function determineLocaleFromBrowser() {
	            var localizationLanguage = window.navigator.userLanguage || window.navigator.language || 'en-us';

	            var localizationLanguageParts = localizationLanguage.split('-');
	            // Capitalize last part of localization for includes
	            localizationLanguageParts[localizationLanguageParts.length - 1] = localizationLanguageParts[localizationLanguageParts.length - 1].toUpperCase();

	            var desiredLocale = localizationLanguageParts.join('-');
	            if (desiredLocale in Object.keys(supportedLocales)) {
	                return desiredLocale;
	            }

	            // We're not supporting this locale yet - do we support an ancestor?
	            for (var localeKey in supportedLocales) {
	                var supportedLocale = supportedLocales[localeKey];
	                var parts = supportedLocale.split('-');
	                if (parts[0] == localizationLanguageParts[0]) {
	                    return supportedLocale; // Top-level is the same
	                }
	            }

	            return defaultLocale;
	        }

	        // Include locale support files and load the messages
	        // Call this when the app is initialized

	    }, {
	        key: 'includeLocales',
	        value: function includeLocales() {
	            var localizationCookie = _Cookie2.default.get('localization');
	            if (localizationCookie === null) {
	                currentLocale = this.determineLocaleFromBrowser();
	            } else {
	                currentLocale = localizationCookie;
	            }
	            // Intl locale-data
	            document.write('<script src="' + root + 'jssource/external/Intl/locale-data/jsonp/' + currentLocale + '.js"><\/script>');

	            // MessageFormat locale-data
	            var topLevel = currentLocale.split('-')[0];
	            document.write('<script src="' + root + 'jssource/external/intl-messageformat/locale-data/' + topLevel + '.js"><\/script>');

	            // Always load default locale
	            document.write('<script src="' + root + 'jssource/external/Intl/locale-data/jsonp/' + defaultLocale + '.js"><\/script>');
	            document.write('<script src="' + root + 'jssource/external/intl-messageformat/locale-data/' + defaultLocaleShort + '.js"><\/script>');

	            // Get messages synchronously
	            var xhr = new XMLHttpRequest();
	            xhr.open('GET', root + 'localizations/' + currentLocale + '.json', false);
	            xhr.send(null);
	            localizationMessages = JSON.parse(xhr.responseText);

	            xhr = new XMLHttpRequest();
	            xhr.open('GET', this.root + 'localizations/' + this.defaultLocale + '.json', false);
	            xhr.send(null);
	            defaultLocalizationMessages = JSON.parse(xhr.responseText);
	        }

	        // Translate a particular message given the message key and info

	    }, {
	        key: 'localize',
	        value: function localize(key, formatting) {
	            var message;
	            if (key in localizationMessages) {
	                message = new _intlMessageformat2.default(localizationMessages[key], currentLocale);
	                return message.format(formatting);
	            } else if (key in defaultLocalizationMessages) {
	                message = new _intlMessageformat2.default(defaultLocalizationMessages[key], defaultLocale);
	                return message.format(formatting);
	            }
	            return 'String missing: ' + key;
	        }

	        // For sample projects, some fields (sprite names, text on stage, and text in say blocks)
	        // may have a special prefix to indicate that it should be replaced with a localized value.
	        // E.g., we might have some text on the stage that says "Touch me" in English. This gets translated.

	    }, {
	        key: 'isSampleLocalizedKey',
	        value: function isSampleLocalizedKey(str) {
	            return str.slice(0, sampleKeyPrefix.length) == sampleKeyPrefix;
	        }
	    }]);

	    return Localization;
	}();

	exports.default = Localization;

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Cookie = function () {
	    function Cookie() {
	        _classCallCheck(this, Cookie);
	    }

	    _createClass(Cookie, null, [{
	        key: 'set',

	        // Thanks to http://www.quirksmode.org/js/cookies.html
	        value: function set(key, value) {
	            var year = new Date();
	            year.setTime(year.getTime() + 365 * 24 * 60 * 60 * 1000);
	            var expires = '; expires=' + year.toGMTString();
	            document.cookie = key + '=' + value + expires + '; path=/';
	        }
	    }, {
	        key: 'get',
	        value: function get(key) {
	            key += '=';
	            var cookies = document.cookie.split(';');
	            for (var i = 0; i < cookies.length; i++) {
	                var c = cookies[i];
	                while (c.charAt(0) == ' ') {
	                    c = c.substring(1, c.length);
	                }
	                if (c.indexOf(key) == 0) {
	                    return c.substring(key.length, c.length);
	                }
	            }
	            return null;
	        }
	    }]);

	    return Cookie;
	}();

	exports.default = Cookie;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/* jshint node:true */

	'use strict';

	var IntlMessageFormat = __webpack_require__(5)['default'];

	// Add all locale data to `IntlMessageFormat`. This module will be ignored when
	// bundling for the browser with Browserify/Webpack.
	__webpack_require__(13);

	// Re-export `IntlMessageFormat` as the CommonJS default exports with all the
	// locale data registered, and with English set as the default locale. Define
	// the `default` prop for use with other compiled ES6 Modules.
	exports = module.exports = IntlMessageFormat;
	exports['default'] = exports;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/* jslint esnext: true */

	"use strict";
	var src$core$$ = __webpack_require__(6), src$en$$ = __webpack_require__(12);

	src$core$$["default"].__addLocaleData(src$en$$["default"]);
	src$core$$["default"].defaultLocale = 'en';

	exports["default"] = src$core$$["default"];

	//# sourceMappingURL=main.js.map

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/*
	Copyright (c) 2014, Yahoo! Inc. All rights reserved.
	Copyrights licensed under the New BSD License.
	See the accompanying LICENSE file for terms.
	*/

	/* jslint esnext: true */

	"use strict";
	var src$utils$$ = __webpack_require__(7), src$es5$$ = __webpack_require__(8), src$compiler$$ = __webpack_require__(9), intl$messageformat$parser$$ = __webpack_require__(10);
	exports["default"] = MessageFormat;

	// -- MessageFormat --------------------------------------------------------

	function MessageFormat(message, locales, formats) {
	    // Parse string messages into an AST.
	    var ast = typeof message === 'string' ?
	            MessageFormat.__parse(message) : message;

	    if (!(ast && ast.type === 'messageFormatPattern')) {
	        throw new TypeError('A message must be provided as a String or AST.');
	    }

	    // Creates a new object with the specified `formats` merged with the default
	    // formats.
	    formats = this._mergeFormats(MessageFormat.formats, formats);

	    // Defined first because it's used to build the format pattern.
	    src$es5$$.defineProperty(this, '_locale',  {value: this._resolveLocale(locales)});

	    // Compile the `ast` to a pattern that is highly optimized for repeated
	    // `format()` invocations. **Note:** This passes the `locales` set provided
	    // to the constructor instead of just the resolved locale.
	    var pluralFn = this._findPluralRuleFunction(this._locale);
	    var pattern  = this._compilePattern(ast, locales, formats, pluralFn);

	    // "Bind" `format()` method to `this` so it can be passed by reference like
	    // the other `Intl` APIs.
	    var messageFormat = this;
	    this.format = function (values) {
	        return messageFormat._format(pattern, values);
	    };
	}

	// Default format options used as the prototype of the `formats` provided to the
	// constructor. These are used when constructing the internal Intl.NumberFormat
	// and Intl.DateTimeFormat instances.
	src$es5$$.defineProperty(MessageFormat, 'formats', {
	    enumerable: true,

	    value: {
	        number: {
	            'currency': {
	                style: 'currency'
	            },

	            'percent': {
	                style: 'percent'
	            }
	        },

	        date: {
	            'short': {
	                month: 'numeric',
	                day  : 'numeric',
	                year : '2-digit'
	            },

	            'medium': {
	                month: 'short',
	                day  : 'numeric',
	                year : 'numeric'
	            },

	            'long': {
	                month: 'long',
	                day  : 'numeric',
	                year : 'numeric'
	            },

	            'full': {
	                weekday: 'long',
	                month  : 'long',
	                day    : 'numeric',
	                year   : 'numeric'
	            }
	        },

	        time: {
	            'short': {
	                hour  : 'numeric',
	                minute: 'numeric'
	            },

	            'medium':  {
	                hour  : 'numeric',
	                minute: 'numeric',
	                second: 'numeric'
	            },

	            'long': {
	                hour        : 'numeric',
	                minute      : 'numeric',
	                second      : 'numeric',
	                timeZoneName: 'short'
	            },

	            'full': {
	                hour        : 'numeric',
	                minute      : 'numeric',
	                second      : 'numeric',
	                timeZoneName: 'short'
	            }
	        }
	    }
	});

	// Define internal private properties for dealing with locale data.
	src$es5$$.defineProperty(MessageFormat, '__localeData__', {value: src$es5$$.objCreate(null)});
	src$es5$$.defineProperty(MessageFormat, '__addLocaleData', {value: function (data) {
	    if (!(data && data.locale)) {
	        throw new Error(
	            'Locale data provided to IntlMessageFormat is missing a ' +
	            '`locale` property'
	        );
	    }

	    MessageFormat.__localeData__[data.locale.toLowerCase()] = data;
	}});

	// Defines `__parse()` static method as an exposed private.
	src$es5$$.defineProperty(MessageFormat, '__parse', {value: intl$messageformat$parser$$["default"].parse});

	// Define public `defaultLocale` property which defaults to English, but can be
	// set by the developer.
	src$es5$$.defineProperty(MessageFormat, 'defaultLocale', {
	    enumerable: true,
	    writable  : true,
	    value     : undefined
	});

	MessageFormat.prototype.resolvedOptions = function () {
	    // TODO: Provide anything else?
	    return {
	        locale: this._locale
	    };
	};

	MessageFormat.prototype._compilePattern = function (ast, locales, formats, pluralFn) {
	    var compiler = new src$compiler$$["default"](locales, formats, pluralFn);
	    return compiler.compile(ast);
	};

	MessageFormat.prototype._findPluralRuleFunction = function (locale) {
	    var localeData = MessageFormat.__localeData__;
	    var data       = localeData[locale.toLowerCase()];

	    // The locale data is de-duplicated, so we have to traverse the locale's
	    // hierarchy until we find a `pluralRuleFunction` to return.
	    while (data) {
	        if (data.pluralRuleFunction) {
	            return data.pluralRuleFunction;
	        }

	        data = data.parentLocale && localeData[data.parentLocale.toLowerCase()];
	    }

	    throw new Error(
	        'Locale data added to IntlMessageFormat is missing a ' +
	        '`pluralRuleFunction` for :' + locale
	    );
	};

	MessageFormat.prototype._format = function (pattern, values) {
	    var result = '',
	        i, len, part, id, value;

	    for (i = 0, len = pattern.length; i < len; i += 1) {
	        part = pattern[i];

	        // Exist early for string parts.
	        if (typeof part === 'string') {
	            result += part;
	            continue;
	        }

	        id = part.id;

	        // Enforce that all required values are provided by the caller.
	        if (!(values && src$utils$$.hop.call(values, id))) {
	            throw new Error('A value must be provided for: ' + id);
	        }

	        value = values[id];

	        // Recursively format plural and select parts' option — which can be a
	        // nested pattern structure. The choosing of the option to use is
	        // abstracted-by and delegated-to the part helper object.
	        if (part.options) {
	            result += this._format(part.getOption(value), values);
	        } else {
	            result += part.format(value);
	        }
	    }

	    return result;
	};

	MessageFormat.prototype._mergeFormats = function (defaults, formats) {
	    var mergedFormats = {},
	        type, mergedType;

	    for (type in defaults) {
	        if (!src$utils$$.hop.call(defaults, type)) { continue; }

	        mergedFormats[type] = mergedType = src$es5$$.objCreate(defaults[type]);

	        if (formats && src$utils$$.hop.call(formats, type)) {
	            src$utils$$.extend(mergedType, formats[type]);
	        }
	    }

	    return mergedFormats;
	};

	MessageFormat.prototype._resolveLocale = function (locales) {
	    if (typeof locales === 'string') {
	        locales = [locales];
	    }

	    // Create a copy of the array so we can push on the default locale.
	    locales = (locales || []).concat(MessageFormat.defaultLocale);

	    var localeData = MessageFormat.__localeData__;
	    var i, len, localeParts, data;

	    // Using the set of locales + the default locale, we look for the first one
	    // which that has been registered. When data does not exist for a locale, we
	    // traverse its ancestors to find something that's been registered within
	    // its hierarchy of locales. Since we lack the proper `parentLocale` data
	    // here, we must take a naive approach to traversal.
	    for (i = 0, len = locales.length; i < len; i += 1) {
	        localeParts = locales[i].toLowerCase().split('-');

	        while (localeParts.length) {
	            data = localeData[localeParts.join('-')];
	            if (data) {
	                // Return the normalized locale string; e.g., we return "en-US",
	                // instead of "en-us".
	                return data.locale;
	            }

	            localeParts.pop();
	        }
	    }

	    var defaultLocale = locales.pop();
	    throw new Error(
	        'No locale data has been added to IntlMessageFormat for: ' +
	        locales.join(', ') + ', or the default locale: ' + defaultLocale
	    );
	};

	//# sourceMappingURL=core.js.map

/***/ },
/* 7 */
/***/ function(module, exports) {

	/*
	Copyright (c) 2014, Yahoo! Inc. All rights reserved.
	Copyrights licensed under the New BSD License.
	See the accompanying LICENSE file for terms.
	*/

	/* jslint esnext: true */

	"use strict";
	exports.extend = extend;
	var hop = Object.prototype.hasOwnProperty;

	function extend(obj) {
	    var sources = Array.prototype.slice.call(arguments, 1),
	        i, len, source, key;

	    for (i = 0, len = sources.length; i < len; i += 1) {
	        source = sources[i];
	        if (!source) { continue; }

	        for (key in source) {
	            if (hop.call(source, key)) {
	                obj[key] = source[key];
	            }
	        }
	    }

	    return obj;
	}
	exports.hop = hop;

	//# sourceMappingURL=utils.js.map

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/*
	Copyright (c) 2014, Yahoo! Inc. All rights reserved.
	Copyrights licensed under the New BSD License.
	See the accompanying LICENSE file for terms.
	*/

	/* jslint esnext: true */

	"use strict";
	var src$utils$$ = __webpack_require__(7);

	// Purposely using the same implementation as the Intl.js `Intl` polyfill.
	// Copyright 2013 Andy Earnshaw, MIT License

	var realDefineProp = (function () {
	    try { return !!Object.defineProperty({}, 'a', {}); }
	    catch (e) { return false; }
	})();

	var es3 = !realDefineProp && !Object.prototype.__defineGetter__;

	var defineProperty = realDefineProp ? Object.defineProperty :
	        function (obj, name, desc) {

	    if ('get' in desc && obj.__defineGetter__) {
	        obj.__defineGetter__(name, desc.get);
	    } else if (!src$utils$$.hop.call(obj, name) || 'value' in desc) {
	        obj[name] = desc.value;
	    }
	};

	var objCreate = Object.create || function (proto, props) {
	    var obj, k;

	    function F() {}
	    F.prototype = proto;
	    obj = new F();

	    for (k in props) {
	        if (src$utils$$.hop.call(props, k)) {
	            defineProperty(obj, k, props[k]);
	        }
	    }

	    return obj;
	};
	exports.defineProperty = defineProperty, exports.objCreate = objCreate;

	//# sourceMappingURL=es5.js.map

/***/ },
/* 9 */
/***/ function(module, exports) {

	/*
	Copyright (c) 2014, Yahoo! Inc. All rights reserved.
	Copyrights licensed under the New BSD License.
	See the accompanying LICENSE file for terms.
	*/

	/* jslint esnext: true */

	"use strict";
	exports["default"] = Compiler;

	function Compiler(locales, formats, pluralFn) {
	    this.locales  = locales;
	    this.formats  = formats;
	    this.pluralFn = pluralFn;
	}

	Compiler.prototype.compile = function (ast) {
	    this.pluralStack        = [];
	    this.currentPlural      = null;
	    this.pluralNumberFormat = null;

	    return this.compileMessage(ast);
	};

	Compiler.prototype.compileMessage = function (ast) {
	    if (!(ast && ast.type === 'messageFormatPattern')) {
	        throw new Error('Message AST is not of type: "messageFormatPattern"');
	    }

	    var elements = ast.elements,
	        pattern  = [];

	    var i, len, element;

	    for (i = 0, len = elements.length; i < len; i += 1) {
	        element = elements[i];

	        switch (element.type) {
	            case 'messageTextElement':
	                pattern.push(this.compileMessageText(element));
	                break;

	            case 'argumentElement':
	                pattern.push(this.compileArgument(element));
	                break;

	            default:
	                throw new Error('Message element does not have a valid type');
	        }
	    }

	    return pattern;
	};

	Compiler.prototype.compileMessageText = function (element) {
	    // When this `element` is part of plural sub-pattern and its value contains
	    // an unescaped '#', use a `PluralOffsetString` helper to properly output
	    // the number with the correct offset in the string.
	    if (this.currentPlural && /(^|[^\\])#/g.test(element.value)) {
	        // Create a cache a NumberFormat instance that can be reused for any
	        // PluralOffsetString instance in this message.
	        if (!this.pluralNumberFormat) {
	            this.pluralNumberFormat = new Intl.NumberFormat(this.locales);
	        }

	        return new PluralOffsetString(
	                this.currentPlural.id,
	                this.currentPlural.format.offset,
	                this.pluralNumberFormat,
	                element.value);
	    }

	    // Unescape the escaped '#'s in the message text.
	    return element.value.replace(/\\#/g, '#');
	};

	Compiler.prototype.compileArgument = function (element) {
	    var format = element.format;

	    if (!format) {
	        return new StringFormat(element.id);
	    }

	    var formats  = this.formats,
	        locales  = this.locales,
	        pluralFn = this.pluralFn,
	        options;

	    switch (format.type) {
	        case 'numberFormat':
	            options = formats.number[format.style];
	            return {
	                id    : element.id,
	                format: new Intl.NumberFormat(locales, options).format
	            };

	        case 'dateFormat':
	            options = formats.date[format.style];
	            return {
	                id    : element.id,
	                format: new Intl.DateTimeFormat(locales, options).format
	            };

	        case 'timeFormat':
	            options = formats.time[format.style];
	            return {
	                id    : element.id,
	                format: new Intl.DateTimeFormat(locales, options).format
	            };

	        case 'pluralFormat':
	            options = this.compileOptions(element);
	            return new PluralFormat(
	                element.id, format.ordinal, format.offset, options, pluralFn
	            );

	        case 'selectFormat':
	            options = this.compileOptions(element);
	            return new SelectFormat(element.id, options);

	        default:
	            throw new Error('Message element does not have a valid format type');
	    }
	};

	Compiler.prototype.compileOptions = function (element) {
	    var format      = element.format,
	        options     = format.options,
	        optionsHash = {};

	    // Save the current plural element, if any, then set it to a new value when
	    // compiling the options sub-patterns. This conforms the spec's algorithm
	    // for handling `"#"` syntax in message text.
	    this.pluralStack.push(this.currentPlural);
	    this.currentPlural = format.type === 'pluralFormat' ? element : null;

	    var i, len, option;

	    for (i = 0, len = options.length; i < len; i += 1) {
	        option = options[i];

	        // Compile the sub-pattern and save it under the options's selector.
	        optionsHash[option.selector] = this.compileMessage(option.value);
	    }

	    // Pop the plural stack to put back the original current plural value.
	    this.currentPlural = this.pluralStack.pop();

	    return optionsHash;
	};

	// -- Compiler Helper Classes --------------------------------------------------

	function StringFormat(id) {
	    this.id = id;
	}

	StringFormat.prototype.format = function (value) {
	    if (!value) {
	        return '';
	    }

	    return typeof value === 'string' ? value : String(value);
	};

	function PluralFormat(id, useOrdinal, offset, options, pluralFn) {
	    this.id         = id;
	    this.useOrdinal = useOrdinal;
	    this.offset     = offset;
	    this.options    = options;
	    this.pluralFn   = pluralFn;
	}

	PluralFormat.prototype.getOption = function (value) {
	    var options = this.options;

	    var option = options['=' + value] ||
	            options[this.pluralFn(value - this.offset, this.useOrdinal)];

	    return option || options.other;
	};

	function PluralOffsetString(id, offset, numberFormat, string) {
	    this.id           = id;
	    this.offset       = offset;
	    this.numberFormat = numberFormat;
	    this.string       = string;
	}

	PluralOffsetString.prototype.format = function (value) {
	    var number = this.numberFormat.format(value - this.offset);

	    return this.string
	            .replace(/(^|[^\\])#/g, '$1' + number)
	            .replace(/\\#/g, '#');
	};

	function SelectFormat(id, options) {
	    this.id      = id;
	    this.options = options;
	}

	SelectFormat.prototype.getOption = function (value) {
	    var options = this.options;
	    return options[value] || options.other;
	};

	//# sourceMappingURL=compiler.js.map

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports = module.exports = __webpack_require__(11)['default'];
	exports['default'] = exports;


/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";

	exports["default"] = (function() {
	  /*
	   * Generated by PEG.js 0.8.0.
	   *
	   * http://pegjs.majda.cz/
	   */

	  function peg$subclass(child, parent) {
	    function ctor() { this.constructor = child; }
	    ctor.prototype = parent.prototype;
	    child.prototype = new ctor();
	  }

	  function SyntaxError(message, expected, found, offset, line, column) {
	    this.message  = message;
	    this.expected = expected;
	    this.found    = found;
	    this.offset   = offset;
	    this.line     = line;
	    this.column   = column;

	    this.name     = "SyntaxError";
	  }

	  peg$subclass(SyntaxError, Error);

	  function parse(input) {
	    var options = arguments.length > 1 ? arguments[1] : {},

	        peg$FAILED = {},

	        peg$startRuleFunctions = { start: peg$parsestart },
	        peg$startRuleFunction  = peg$parsestart,

	        peg$c0 = [],
	        peg$c1 = function(elements) {
	                return {
	                    type    : 'messageFormatPattern',
	                    elements: elements
	                };
	            },
	        peg$c2 = peg$FAILED,
	        peg$c3 = function(text) {
	                var string = '',
	                    i, j, outerLen, inner, innerLen;

	                for (i = 0, outerLen = text.length; i < outerLen; i += 1) {
	                    inner = text[i];

	                    for (j = 0, innerLen = inner.length; j < innerLen; j += 1) {
	                        string += inner[j];
	                    }
	                }

	                return string;
	            },
	        peg$c4 = function(messageText) {
	                return {
	                    type : 'messageTextElement',
	                    value: messageText
	                };
	            },
	        peg$c5 = /^[^ \t\n\r,.+={}#]/,
	        peg$c6 = { type: "class", value: "[^ \\t\\n\\r,.+={}#]", description: "[^ \\t\\n\\r,.+={}#]" },
	        peg$c7 = "{",
	        peg$c8 = { type: "literal", value: "{", description: "\"{\"" },
	        peg$c9 = null,
	        peg$c10 = ",",
	        peg$c11 = { type: "literal", value: ",", description: "\",\"" },
	        peg$c12 = "}",
	        peg$c13 = { type: "literal", value: "}", description: "\"}\"" },
	        peg$c14 = function(id, format) {
	                return {
	                    type  : 'argumentElement',
	                    id    : id,
	                    format: format && format[2]
	                };
	            },
	        peg$c15 = "number",
	        peg$c16 = { type: "literal", value: "number", description: "\"number\"" },
	        peg$c17 = "date",
	        peg$c18 = { type: "literal", value: "date", description: "\"date\"" },
	        peg$c19 = "time",
	        peg$c20 = { type: "literal", value: "time", description: "\"time\"" },
	        peg$c21 = function(type, style) {
	                return {
	                    type : type + 'Format',
	                    style: style && style[2]
	                };
	            },
	        peg$c22 = "plural",
	        peg$c23 = { type: "literal", value: "plural", description: "\"plural\"" },
	        peg$c24 = function(pluralStyle) {
	                return {
	                    type   : pluralStyle.type,
	                    ordinal: false,
	                    offset : pluralStyle.offset || 0,
	                    options: pluralStyle.options
	                };
	            },
	        peg$c25 = "selectordinal",
	        peg$c26 = { type: "literal", value: "selectordinal", description: "\"selectordinal\"" },
	        peg$c27 = function(pluralStyle) {
	                return {
	                    type   : pluralStyle.type,
	                    ordinal: true,
	                    offset : pluralStyle.offset || 0,
	                    options: pluralStyle.options
	                }
	            },
	        peg$c28 = "select",
	        peg$c29 = { type: "literal", value: "select", description: "\"select\"" },
	        peg$c30 = function(options) {
	                return {
	                    type   : 'selectFormat',
	                    options: options
	                };
	            },
	        peg$c31 = "=",
	        peg$c32 = { type: "literal", value: "=", description: "\"=\"" },
	        peg$c33 = function(selector, pattern) {
	                return {
	                    type    : 'optionalFormatPattern',
	                    selector: selector,
	                    value   : pattern
	                };
	            },
	        peg$c34 = "offset:",
	        peg$c35 = { type: "literal", value: "offset:", description: "\"offset:\"" },
	        peg$c36 = function(number) {
	                return number;
	            },
	        peg$c37 = function(offset, options) {
	                return {
	                    type   : 'pluralFormat',
	                    offset : offset,
	                    options: options
	                };
	            },
	        peg$c38 = { type: "other", description: "whitespace" },
	        peg$c39 = /^[ \t\n\r]/,
	        peg$c40 = { type: "class", value: "[ \\t\\n\\r]", description: "[ \\t\\n\\r]" },
	        peg$c41 = { type: "other", description: "optionalWhitespace" },
	        peg$c42 = /^[0-9]/,
	        peg$c43 = { type: "class", value: "[0-9]", description: "[0-9]" },
	        peg$c44 = /^[0-9a-f]/i,
	        peg$c45 = { type: "class", value: "[0-9a-f]i", description: "[0-9a-f]i" },
	        peg$c46 = "0",
	        peg$c47 = { type: "literal", value: "0", description: "\"0\"" },
	        peg$c48 = /^[1-9]/,
	        peg$c49 = { type: "class", value: "[1-9]", description: "[1-9]" },
	        peg$c50 = function(digits) {
	            return parseInt(digits, 10);
	        },
	        peg$c51 = /^[^{}\\\0-\x1F \t\n\r]/,
	        peg$c52 = { type: "class", value: "[^{}\\\\\\0-\\x1F \\t\\n\\r]", description: "[^{}\\\\\\0-\\x1F \\t\\n\\r]" },
	        peg$c53 = "\\\\",
	        peg$c54 = { type: "literal", value: "\\\\", description: "\"\\\\\\\\\"" },
	        peg$c55 = function() { return '\\'; },
	        peg$c56 = "\\#",
	        peg$c57 = { type: "literal", value: "\\#", description: "\"\\\\#\"" },
	        peg$c58 = function() { return '\\#'; },
	        peg$c59 = "\\{",
	        peg$c60 = { type: "literal", value: "\\{", description: "\"\\\\{\"" },
	        peg$c61 = function() { return '\u007B'; },
	        peg$c62 = "\\}",
	        peg$c63 = { type: "literal", value: "\\}", description: "\"\\\\}\"" },
	        peg$c64 = function() { return '\u007D'; },
	        peg$c65 = "\\u",
	        peg$c66 = { type: "literal", value: "\\u", description: "\"\\\\u\"" },
	        peg$c67 = function(digits) {
	                return String.fromCharCode(parseInt(digits, 16));
	            },
	        peg$c68 = function(chars) { return chars.join(''); },

	        peg$currPos          = 0,
	        peg$reportedPos      = 0,
	        peg$cachedPos        = 0,
	        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
	        peg$maxFailPos       = 0,
	        peg$maxFailExpected  = [],
	        peg$silentFails      = 0,

	        peg$result;

	    if ("startRule" in options) {
	      if (!(options.startRule in peg$startRuleFunctions)) {
	        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
	      }

	      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
	    }

	    function text() {
	      return input.substring(peg$reportedPos, peg$currPos);
	    }

	    function offset() {
	      return peg$reportedPos;
	    }

	    function line() {
	      return peg$computePosDetails(peg$reportedPos).line;
	    }

	    function column() {
	      return peg$computePosDetails(peg$reportedPos).column;
	    }

	    function expected(description) {
	      throw peg$buildException(
	        null,
	        [{ type: "other", description: description }],
	        peg$reportedPos
	      );
	    }

	    function error(message) {
	      throw peg$buildException(message, null, peg$reportedPos);
	    }

	    function peg$computePosDetails(pos) {
	      function advance(details, startPos, endPos) {
	        var p, ch;

	        for (p = startPos; p < endPos; p++) {
	          ch = input.charAt(p);
	          if (ch === "\n") {
	            if (!details.seenCR) { details.line++; }
	            details.column = 1;
	            details.seenCR = false;
	          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
	            details.line++;
	            details.column = 1;
	            details.seenCR = true;
	          } else {
	            details.column++;
	            details.seenCR = false;
	          }
	        }
	      }

	      if (peg$cachedPos !== pos) {
	        if (peg$cachedPos > pos) {
	          peg$cachedPos = 0;
	          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
	        }
	        advance(peg$cachedPosDetails, peg$cachedPos, pos);
	        peg$cachedPos = pos;
	      }

	      return peg$cachedPosDetails;
	    }

	    function peg$fail(expected) {
	      if (peg$currPos < peg$maxFailPos) { return; }

	      if (peg$currPos > peg$maxFailPos) {
	        peg$maxFailPos = peg$currPos;
	        peg$maxFailExpected = [];
	      }

	      peg$maxFailExpected.push(expected);
	    }

	    function peg$buildException(message, expected, pos) {
	      function cleanupExpected(expected) {
	        var i = 1;

	        expected.sort(function(a, b) {
	          if (a.description < b.description) {
	            return -1;
	          } else if (a.description > b.description) {
	            return 1;
	          } else {
	            return 0;
	          }
	        });

	        while (i < expected.length) {
	          if (expected[i - 1] === expected[i]) {
	            expected.splice(i, 1);
	          } else {
	            i++;
	          }
	        }
	      }

	      function buildMessage(expected, found) {
	        function stringEscape(s) {
	          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

	          return s
	            .replace(/\\/g,   '\\\\')
	            .replace(/"/g,    '\\"')
	            .replace(/\x08/g, '\\b')
	            .replace(/\t/g,   '\\t')
	            .replace(/\n/g,   '\\n')
	            .replace(/\f/g,   '\\f')
	            .replace(/\r/g,   '\\r')
	            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
	            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
	            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
	            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
	        }

	        var expectedDescs = new Array(expected.length),
	            expectedDesc, foundDesc, i;

	        for (i = 0; i < expected.length; i++) {
	          expectedDescs[i] = expected[i].description;
	        }

	        expectedDesc = expected.length > 1
	          ? expectedDescs.slice(0, -1).join(", ")
	              + " or "
	              + expectedDescs[expected.length - 1]
	          : expectedDescs[0];

	        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

	        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
	      }

	      var posDetails = peg$computePosDetails(pos),
	          found      = pos < input.length ? input.charAt(pos) : null;

	      if (expected !== null) {
	        cleanupExpected(expected);
	      }

	      return new SyntaxError(
	        message !== null ? message : buildMessage(expected, found),
	        expected,
	        found,
	        pos,
	        posDetails.line,
	        posDetails.column
	      );
	    }

	    function peg$parsestart() {
	      var s0;

	      s0 = peg$parsemessageFormatPattern();

	      return s0;
	    }

	    function peg$parsemessageFormatPattern() {
	      var s0, s1, s2;

	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parsemessageFormatElement();
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$parsemessageFormatElement();
	      }
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c1(s1);
	      }
	      s0 = s1;

	      return s0;
	    }

	    function peg$parsemessageFormatElement() {
	      var s0;

	      s0 = peg$parsemessageTextElement();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseargumentElement();
	      }

	      return s0;
	    }

	    function peg$parsemessageText() {
	      var s0, s1, s2, s3, s4, s5;

	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$currPos;
	      s3 = peg$parse_();
	      if (s3 !== peg$FAILED) {
	        s4 = peg$parsechars();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parse_();
	          if (s5 !== peg$FAILED) {
	            s3 = [s3, s4, s5];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$c2;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$c2;
	        }
	      } else {
	        peg$currPos = s2;
	        s2 = peg$c2;
	      }
	      if (s2 !== peg$FAILED) {
	        while (s2 !== peg$FAILED) {
	          s1.push(s2);
	          s2 = peg$currPos;
	          s3 = peg$parse_();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parsechars();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse_();
	              if (s5 !== peg$FAILED) {
	                s3 = [s3, s4, s5];
	                s2 = s3;
	              } else {
	                peg$currPos = s2;
	                s2 = peg$c2;
	              }
	            } else {
	              peg$currPos = s2;
	              s2 = peg$c2;
	            }
	          } else {
	            peg$currPos = s2;
	            s2 = peg$c2;
	          }
	        }
	      } else {
	        s1 = peg$c2;
	      }
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c3(s1);
	      }
	      s0 = s1;
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$parsews();
	        if (s1 !== peg$FAILED) {
	          s1 = input.substring(s0, peg$currPos);
	        }
	        s0 = s1;
	      }

	      return s0;
	    }

	    function peg$parsemessageTextElement() {
	      var s0, s1;

	      s0 = peg$currPos;
	      s1 = peg$parsemessageText();
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c4(s1);
	      }
	      s0 = s1;

	      return s0;
	    }

	    function peg$parseargument() {
	      var s0, s1, s2;

	      s0 = peg$parsenumber();
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = [];
	        if (peg$c5.test(input.charAt(peg$currPos))) {
	          s2 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c6); }
	        }
	        if (s2 !== peg$FAILED) {
	          while (s2 !== peg$FAILED) {
	            s1.push(s2);
	            if (peg$c5.test(input.charAt(peg$currPos))) {
	              s2 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s2 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c6); }
	            }
	          }
	        } else {
	          s1 = peg$c2;
	        }
	        if (s1 !== peg$FAILED) {
	          s1 = input.substring(s0, peg$currPos);
	        }
	        s0 = s1;
	      }

	      return s0;
	    }

	    function peg$parseargumentElement() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 123) {
	        s1 = peg$c7;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c8); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseargument();
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse_();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$currPos;
	              if (input.charCodeAt(peg$currPos) === 44) {
	                s6 = peg$c10;
	                peg$currPos++;
	              } else {
	                s6 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c11); }
	              }
	              if (s6 !== peg$FAILED) {
	                s7 = peg$parse_();
	                if (s7 !== peg$FAILED) {
	                  s8 = peg$parseelementFormat();
	                  if (s8 !== peg$FAILED) {
	                    s6 = [s6, s7, s8];
	                    s5 = s6;
	                  } else {
	                    peg$currPos = s5;
	                    s5 = peg$c2;
	                  }
	                } else {
	                  peg$currPos = s5;
	                  s5 = peg$c2;
	                }
	              } else {
	                peg$currPos = s5;
	                s5 = peg$c2;
	              }
	              if (s5 === peg$FAILED) {
	                s5 = peg$c9;
	              }
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parse_();
	                if (s6 !== peg$FAILED) {
	                  if (input.charCodeAt(peg$currPos) === 125) {
	                    s7 = peg$c12;
	                    peg$currPos++;
	                  } else {
	                    s7 = peg$FAILED;
	                    if (peg$silentFails === 0) { peg$fail(peg$c13); }
	                  }
	                  if (s7 !== peg$FAILED) {
	                    peg$reportedPos = s0;
	                    s1 = peg$c14(s3, s5);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$c2;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$c2;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$c2;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c2;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c2;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c2;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c2;
	      }

	      return s0;
	    }

	    function peg$parseelementFormat() {
	      var s0;

	      s0 = peg$parsesimpleFormat();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parsepluralFormat();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseselectOrdinalFormat();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseselectFormat();
	          }
	        }
	      }

	      return s0;
	    }

	    function peg$parsesimpleFormat() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c15) {
	        s1 = peg$c15;
	        peg$currPos += 6;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c16); }
	      }
	      if (s1 === peg$FAILED) {
	        if (input.substr(peg$currPos, 4) === peg$c17) {
	          s1 = peg$c17;
	          peg$currPos += 4;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c18); }
	        }
	        if (s1 === peg$FAILED) {
	          if (input.substr(peg$currPos, 4) === peg$c19) {
	            s1 = peg$c19;
	            peg$currPos += 4;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c20); }
	          }
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$currPos;
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s4 = peg$c10;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c11); }
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parse_();
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parsechars();
	              if (s6 !== peg$FAILED) {
	                s4 = [s4, s5, s6];
	                s3 = s4;
	              } else {
	                peg$currPos = s3;
	                s3 = peg$c2;
	              }
	            } else {
	              peg$currPos = s3;
	              s3 = peg$c2;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$c2;
	          }
	          if (s3 === peg$FAILED) {
	            s3 = peg$c9;
	          }
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c21(s1, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c2;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c2;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c2;
	      }

	      return s0;
	    }

	    function peg$parsepluralFormat() {
	      var s0, s1, s2, s3, s4, s5;

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c22) {
	        s1 = peg$c22;
	        peg$currPos += 6;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c23); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s3 = peg$c10;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c11); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse_();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parsepluralStyle();
	              if (s5 !== peg$FAILED) {
	                peg$reportedPos = s0;
	                s1 = peg$c24(s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$c2;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c2;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c2;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c2;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c2;
	      }

	      return s0;
	    }

	    function peg$parseselectOrdinalFormat() {
	      var s0, s1, s2, s3, s4, s5;

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 13) === peg$c25) {
	        s1 = peg$c25;
	        peg$currPos += 13;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c26); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s3 = peg$c10;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c11); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse_();
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parsepluralStyle();
	              if (s5 !== peg$FAILED) {
	                peg$reportedPos = s0;
	                s1 = peg$c27(s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$c2;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c2;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c2;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c2;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c2;
	      }

	      return s0;
	    }

	    function peg$parseselectFormat() {
	      var s0, s1, s2, s3, s4, s5, s6;

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 6) === peg$c28) {
	        s1 = peg$c28;
	        peg$currPos += 6;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c29); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 44) {
	            s3 = peg$c10;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c11); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parse_();
	            if (s4 !== peg$FAILED) {
	              s5 = [];
	              s6 = peg$parseoptionalFormatPattern();
	              if (s6 !== peg$FAILED) {
	                while (s6 !== peg$FAILED) {
	                  s5.push(s6);
	                  s6 = peg$parseoptionalFormatPattern();
	                }
	              } else {
	                s5 = peg$c2;
	              }
	              if (s5 !== peg$FAILED) {
	                peg$reportedPos = s0;
	                s1 = peg$c30(s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$c2;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c2;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c2;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c2;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c2;
	      }

	      return s0;
	    }

	    function peg$parseselector() {
	      var s0, s1, s2, s3;

	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 61) {
	        s2 = peg$c31;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c32); }
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parsenumber();
	        if (s3 !== peg$FAILED) {
	          s2 = [s2, s3];
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$c2;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$c2;
	      }
	      if (s1 !== peg$FAILED) {
	        s1 = input.substring(s0, peg$currPos);
	      }
	      s0 = s1;
	      if (s0 === peg$FAILED) {
	        s0 = peg$parsechars();
	      }

	      return s0;
	    }

	    function peg$parseoptionalFormatPattern() {
	      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

	      s0 = peg$currPos;
	      s1 = peg$parse_();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseselector();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parse_();
	          if (s3 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 123) {
	              s4 = peg$c7;
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c8); }
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parse_();
	              if (s5 !== peg$FAILED) {
	                s6 = peg$parsemessageFormatPattern();
	                if (s6 !== peg$FAILED) {
	                  s7 = peg$parse_();
	                  if (s7 !== peg$FAILED) {
	                    if (input.charCodeAt(peg$currPos) === 125) {
	                      s8 = peg$c12;
	                      peg$currPos++;
	                    } else {
	                      s8 = peg$FAILED;
	                      if (peg$silentFails === 0) { peg$fail(peg$c13); }
	                    }
	                    if (s8 !== peg$FAILED) {
	                      peg$reportedPos = s0;
	                      s1 = peg$c33(s2, s6);
	                      s0 = s1;
	                    } else {
	                      peg$currPos = s0;
	                      s0 = peg$c2;
	                    }
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$c2;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$c2;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$c2;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c2;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c2;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c2;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c2;
	      }

	      return s0;
	    }

	    function peg$parseoffset() {
	      var s0, s1, s2, s3;

	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 7) === peg$c34) {
	        s1 = peg$c34;
	        peg$currPos += 7;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c35); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parsenumber();
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c36(s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c2;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c2;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c2;
	      }

	      return s0;
	    }

	    function peg$parsepluralStyle() {
	      var s0, s1, s2, s3, s4;

	      s0 = peg$currPos;
	      s1 = peg$parseoffset();
	      if (s1 === peg$FAILED) {
	        s1 = peg$c9;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parse_();
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parseoptionalFormatPattern();
	          if (s4 !== peg$FAILED) {
	            while (s4 !== peg$FAILED) {
	              s3.push(s4);
	              s4 = peg$parseoptionalFormatPattern();
	            }
	          } else {
	            s3 = peg$c2;
	          }
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c37(s1, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c2;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c2;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c2;
	      }

	      return s0;
	    }

	    function peg$parsews() {
	      var s0, s1;

	      peg$silentFails++;
	      s0 = [];
	      if (peg$c39.test(input.charAt(peg$currPos))) {
	        s1 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c40); }
	      }
	      if (s1 !== peg$FAILED) {
	        while (s1 !== peg$FAILED) {
	          s0.push(s1);
	          if (peg$c39.test(input.charAt(peg$currPos))) {
	            s1 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c40); }
	          }
	        }
	      } else {
	        s0 = peg$c2;
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c38); }
	      }

	      return s0;
	    }

	    function peg$parse_() {
	      var s0, s1, s2;

	      peg$silentFails++;
	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parsews();
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$parsews();
	      }
	      if (s1 !== peg$FAILED) {
	        s1 = input.substring(s0, peg$currPos);
	      }
	      s0 = s1;
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c41); }
	      }

	      return s0;
	    }

	    function peg$parsedigit() {
	      var s0;

	      if (peg$c42.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c43); }
	      }

	      return s0;
	    }

	    function peg$parsehexDigit() {
	      var s0;

	      if (peg$c44.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c45); }
	      }

	      return s0;
	    }

	    function peg$parsenumber() {
	      var s0, s1, s2, s3, s4, s5;

	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 48) {
	        s1 = peg$c46;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c47); }
	      }
	      if (s1 === peg$FAILED) {
	        s1 = peg$currPos;
	        s2 = peg$currPos;
	        if (peg$c48.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c49); }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          s5 = peg$parsedigit();
	          while (s5 !== peg$FAILED) {
	            s4.push(s5);
	            s5 = peg$parsedigit();
	          }
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$c2;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$c2;
	        }
	        if (s2 !== peg$FAILED) {
	          s2 = input.substring(s1, peg$currPos);
	        }
	        s1 = s2;
	      }
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c50(s1);
	      }
	      s0 = s1;

	      return s0;
	    }

	    function peg$parsechar() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;

	      if (peg$c51.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c52); }
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.substr(peg$currPos, 2) === peg$c53) {
	          s1 = peg$c53;
	          peg$currPos += 2;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c54); }
	        }
	        if (s1 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c55();
	        }
	        s0 = s1;
	        if (s0 === peg$FAILED) {
	          s0 = peg$currPos;
	          if (input.substr(peg$currPos, 2) === peg$c56) {
	            s1 = peg$c56;
	            peg$currPos += 2;
	          } else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c57); }
	          }
	          if (s1 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c58();
	          }
	          s0 = s1;
	          if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.substr(peg$currPos, 2) === peg$c59) {
	              s1 = peg$c59;
	              peg$currPos += 2;
	            } else {
	              s1 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c60); }
	            }
	            if (s1 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c61();
	            }
	            s0 = s1;
	            if (s0 === peg$FAILED) {
	              s0 = peg$currPos;
	              if (input.substr(peg$currPos, 2) === peg$c62) {
	                s1 = peg$c62;
	                peg$currPos += 2;
	              } else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c63); }
	              }
	              if (s1 !== peg$FAILED) {
	                peg$reportedPos = s0;
	                s1 = peg$c64();
	              }
	              s0 = s1;
	              if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                if (input.substr(peg$currPos, 2) === peg$c65) {
	                  s1 = peg$c65;
	                  peg$currPos += 2;
	                } else {
	                  s1 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c66); }
	                }
	                if (s1 !== peg$FAILED) {
	                  s2 = peg$currPos;
	                  s3 = peg$currPos;
	                  s4 = peg$parsehexDigit();
	                  if (s4 !== peg$FAILED) {
	                    s5 = peg$parsehexDigit();
	                    if (s5 !== peg$FAILED) {
	                      s6 = peg$parsehexDigit();
	                      if (s6 !== peg$FAILED) {
	                        s7 = peg$parsehexDigit();
	                        if (s7 !== peg$FAILED) {
	                          s4 = [s4, s5, s6, s7];
	                          s3 = s4;
	                        } else {
	                          peg$currPos = s3;
	                          s3 = peg$c2;
	                        }
	                      } else {
	                        peg$currPos = s3;
	                        s3 = peg$c2;
	                      }
	                    } else {
	                      peg$currPos = s3;
	                      s3 = peg$c2;
	                    }
	                  } else {
	                    peg$currPos = s3;
	                    s3 = peg$c2;
	                  }
	                  if (s3 !== peg$FAILED) {
	                    s3 = input.substring(s2, peg$currPos);
	                  }
	                  s2 = s3;
	                  if (s2 !== peg$FAILED) {
	                    peg$reportedPos = s0;
	                    s1 = peg$c67(s2);
	                    s0 = s1;
	                  } else {
	                    peg$currPos = s0;
	                    s0 = peg$c2;
	                  }
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$c2;
	                }
	              }
	            }
	          }
	        }
	      }

	      return s0;
	    }

	    function peg$parsechars() {
	      var s0, s1, s2;

	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parsechar();
	      if (s2 !== peg$FAILED) {
	        while (s2 !== peg$FAILED) {
	          s1.push(s2);
	          s2 = peg$parsechar();
	        }
	      } else {
	        s1 = peg$c2;
	      }
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c68(s1);
	      }
	      s0 = s1;

	      return s0;
	    }

	    peg$result = peg$startRuleFunction();

	    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
	      return peg$result;
	    } else {
	      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
	        peg$fail({ type: "end", description: "end of input" });
	      }

	      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
	    }
	  }

	  return {
	    SyntaxError: SyntaxError,
	    parse:       parse
	  };
	})();

	//# sourceMappingURL=parser.js.map

/***/ },
/* 12 */
/***/ function(module, exports) {

	// GENERATED FILE
	"use strict";
	exports["default"] = {"locale":"en","pluralRuleFunction":function (n,ord){var s=String(n).split("."),v0=!s[1],t0=Number(s[0])==n,n10=t0&&s[0].slice(-1),n100=t0&&s[0].slice(-2);if(ord)return n10==1&&n100!=11?"one":n10==2&&n100!=12?"two":n10==3&&n100!=13?"few":"other";return n==1&&v0?"one":"other"}};

	//# sourceMappingURL=en.js.map

/***/ },
/* 13 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ }
/******/ ]);