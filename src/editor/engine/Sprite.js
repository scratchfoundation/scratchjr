////////////////////////////////////////////////////////////
// Sprites
// Loading and Creation Strategy
//  a. Set data variables
//  b. Load SVG as IMG
//  c. Load SVG as text
//  d. Create Mask for pixel detection and cache it on the browser
////////////////////////////////////////////////////////////

import ScratchJr from '../ScratchJr';
import Project from '../ui/Project';
import Thumbs from '../ui/Thumbs';
import UI from '../ui/UI';
import BlockSpecs from '../blocks/BlockSpecs';
import IO from '../../tablet/IO';
import OS from '../../tablet/OS';
import MediaLib from '../../tablet/MediaLib';
import Undo from '../ui/Undo';
import ScriptsPane from '../ui/ScriptsPane';
import SVG2Canvas from '../../utils/SVG2Canvas';
import SVGTools from '../../painteditor/SVGTools';
import Rectangle from '../../geom/Rectangle';
import Events from '../../utils/Events';
import Localization from '../../utils/Localization';
import ScratchAudio from '../../utils/ScratchAudio';
import Scripts from '../ui/Scripts';
import {newHTML, newDiv, newP, gn,
    setCanvasSizeScaledToWindowDocumentHeight,
    DEGTOR, getIdFor, setProps, isTablet, isiOS,
    isAndroid, fitInRect, scaleMultiplier, setCanvasSize,
    globaly, globalx, rgbToHex} from '../../utils/lib';

export default class Sprite {
    constructor (attr, whenDone) {
        if (attr.type == 'sprite') {
            this.createSprite(attr.page, attr.md5, attr.id, attr, whenDone);
        } else {
            this.createText(attr, whenDone);
        }
    }

    createSprite (page, md5, id, attr, fcn) {
        ScratchJr.storyStart('Sprite.prototype.createSprite');
        this.div = document.createElement('div');
        setProps(this.div.style, {
            position: 'absolute',
            left: '0px',
            top: '0px'
        });
        //document.createElement('img');
        this.div.owner = this;
        this.div.id = id;
        this.id = id;
        this.md5 = md5;
        this.borderOn = false;
        this.outline = document.createElement('canvas');
        this.code = new Scripts(this);
        setProps(this, attr);
        if (Localization.isSampleLocalizedKey(this.name) && ScratchJr.isSampleOrStarter()) {
            this.name = Localization.localize('SAMPLE_TEXT_' + this.name);
        }
        for (var i = 0; i < this.sounds.length; i++) {
            ScratchAudio.loadProjectSound(this.sounds[i]);
        }
        var sprites = JSON.parse(page.sprites);
        sprites.push(this.id);
        page.sprites = JSON.stringify(sprites);
        var me = this;
        page.div.appendChild(this.div);
        this.div.style.visibility = 'hidden';
        this.getAsset(gotImage); // sets the SVG and the image
        function gotImage (dataurl) {
            me.setCostume(dataurl, fcn);
        }
    }

    getAsset (whenDone) {
        var md5 = this.md5;
        var spr = this;
        md5 = (MediaLib.keys[md5]) ? MediaLib.path + md5 : md5;
        if (md5.indexOf('/') > -1) {
            IO.requestFromServer(md5, doNext);
        } else {
            OS.getmedia(md5, nextStep);
        }
        function nextStep (base64) {
            doNext(atob(base64));
        }
        function doNext (str) {
            str = str.replace(/>\s*</g, '><');
            spr.setSVG(str);
            IO.getImagesInSVG(str, function () {
                var base64 = IO.getImageDataURL(spr.md5, btoa(str));
                whenDone(base64);
            });
        }
    }

    setSVG (str) {
        var xmlDoc = new DOMParser().parseFromString(str, 'text/xml');
        var extxml = document.importNode(xmlDoc.documentElement, true);
        if (extxml.childNodes[0].nodeName == '#comment') {
            extxml.removeChild(extxml.childNodes[0]);
        }
        this.svg = extxml;
    }

    setCostume (dataurl, fcn) {
        var img = document.createElement('img');
        img.src = dataurl;
        this.img = img;
        // Make a copy that is not affected by zoom transformation
        this.originalImg = img.cloneNode(false);
        setProps(this.img.style, {
            position: 'absolute',
            left: '0px',
            top: '0px'
        });
        this.div.appendChild(img);
        var sprite = this;
        if (!img.complete) {
            img.onload = function () {
                sprite.displaySprite(fcn);
            };
        } else {
            sprite.displaySprite(fcn);
        }
    }

    displaySprite (whenDone) {
        var w = this.img.width;
        var h = this.img.height;
        this.div.style.width = this.img.width + 'px';
        this.div.style.height = this.img.height + 'px';
        this.cx = Math.floor(w / 2);
        this.cy = Math.floor(h / 2);
        this.w = w;
        this.h = h;
        this.setPos(this.xcoor, this.ycoor);
        this.doRender(whenDone);
    }

    doRender (whenDone) {
        this.drawBorder(); // canvas draw border
        this.render();
        SVG2Canvas.drawInCanvas(this); // canvas draws mask for pixel detection
        this.readOnly = SVG2Canvas.svgerror;
        this.watermark = SVGTools.getWatermark(this.svg, '#B3B3B3'); // svg for watermark
        if (whenDone) {
            whenDone(this);
        }
    }

    drawBorder () {
        // TODO: Merge these to get better thumbnail rendering on iOS
        var w, h, extxml;
        if (isAndroid) {
            this.border = document.createElement('canvas');
            w = this.originalImg.width;
            h = this.originalImg.height;
            extxml = this.svg;
            this.border.width = w;
            this.border.height = h;
            this.border.style.width = (w * this.scale) + 'px';
            this.border.style.height = (h * this.scale) + 'px';
            SVG2Canvas.drawBorder(extxml, this.border.getContext('2d'));
        } else {
            this.border = document.createElement('canvas');
            w = this.img.width;
            h = this.img.height;
            extxml = this.svg;
            setCanvasSize(this.border, w, h);
            SVG2Canvas.drawBorder(extxml, this.border.getContext('2d'));
        }
    }

    //////////////////////////////////////
    // sprite thumbnail
    /////////////////////////////////////

    spriteThumbnail (p) {
        var tb = newHTML('div', 'spritethumb off', p);
        tb.setAttribute('id', getIdFor('spritethumb'));
        tb.type = 'spritethumb';
        tb.owner = this.id;
        var c = newHTML('canvas', 'thumbcanvas', tb);

        // TODO: Merge these to get better thumbnail rendering on iOS
        if (isAndroid) {
            setCanvasSizeScaledToWindowDocumentHeight(c, 64, 64);
        } else {
            setCanvasSize(c, 64, 64);
        }

        this.drawMyImage(c, c.width, c.height);
        p = newHTML('p', 'sname', tb);
        p.textContent = this.name;
        newHTML('div', 'brush', tb);
        this.thumbnail = tb;
        return tb;
    }

    updateSpriteThumb () {
        var tb = this.thumbnail;
        if (!tb) {
            return;
        }
        var cnv = tb.childNodes[0];
        this.drawMyImage(cnv, cnv.width, cnv.height);
        tb.childNodes[1].textContent = this.name;
    }

    drawMyImage (cnv, w, h) {
        if (!this.img) {
            return;
        }
        setCanvasSize(cnv, w, h);

        // TODO: Merge these to get better thumbnail rendering on iOS
        var img;
        if (isAndroid) {
            img = this.originalImg;
        } else {
            img = this.img;
        }
        var imgw = img.naturalWidth ? img.naturalWidth : img.width;
        var imgh = img.naturalHeight ? img.naturalHeight : img.height;
        var scale = Math.min(w / imgw, h / imgh);
        var ctx = cnv.getContext('2d');
        var iw = Math.floor(scale * imgw);
        var ih = Math.floor(scale * imgh);
        var ix = Math.floor((w - (scale * imgw)) / 2);
        var iy = Math.floor((h - (scale * imgh)) / 2);
        ctx.drawImage(this.border, 0, 0, this.border.width, this.border.height, ix, iy, iw, ih);
        if (!img.complete) {
            img.onload = function () {
                ctx.drawImage(img, 0, 0, imgw, imgh, ix, iy, iw, ih);
            };
        } else {
            ctx.drawImage(img, 0, 0, imgw, imgh, ix, iy, iw, ih);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // sprite Primitives
    //////////////////////////////////////////////////////////////////////////////

    goHome () {
        this.setPos(this.homex, this.homey);
        this.scale = this.homescale;
        this.shown = this.homeshown;
        //	this.flip = this.homeflip;  // kept here just in case we want it
        this.div.style.opacity = this.shown ? 1 : 0;
        this.setHeading(0);
        this.render();
    }

    touchingAny () {
        if (!this.shown) {
            return false;
        }
        setCanvasSize(ScratchJr.workingCanvas, 480, 360);
        setCanvasSize(ScratchJr.workingCanvas2, 480, 360);
        var page = this.div.parentNode;
        var box = this.getBoxWithEffects(); // box with effects is a scale  and 1.5 times to count for rotations
        for (var i = 0; i < page.childElementCount; i++) {
            var other = page.childNodes[i].owner;
            if (!other) {
                continue;
            }
            if (other.type == 'text') {
                continue;
            }
            if (!other.shown) {
                continue;
            }
            if (other.id == this.id) {
                continue;
            }
            if (Events.dragthumbnail && (other == Events.dragthumbnail.owner)) {
                continue;
            }
            var box2 = other.getBoxWithEffects();
            if (!box.intersects(box2)) {
                continue;
            }
            if (this.verifyHit(other)) {
                return true;
            }
        }
        return false;
    }

    verifyHit (other) {
        var ctx = ScratchJr.workingCanvas.getContext('2d');
        var ctx2 = ScratchJr.workingCanvas2.getContext('2d');
        ctx.clearRect(0, 0, 480, 360);
        ctx2.clearRect(0, 0, 480, 360);
        var box = this.getBoxWithEffects();
        var box2 = other.getBoxWithEffects();
        var rect = box.intersection(box2);
        if (rect.width == 0) {
            return false;
        }
        if (rect.height == 0) {
            return false;
        }
        ctx.globalCompositeOperation = 'source-over';
        this.stamp(ctx);
        // Normally, we could do a source-over followed by a source-in to detect where the two images collide.
        // However, unfortunately, behavior on Android 4.2 and Android 4.4+ varies.
        // On Android 4.4+, we could potentially use this more efficient strategy,
        // but we opted for using a single strategy
        // that works on all platforms, despite it being less efficient.
        // A future optimization could detect the behavior and use
        // the right strategy.
        // On Android 4.2, source-in does not clear the full source image
        // - only the rectangle that the second image being drawn
        // occupies. Rotation, scaling, etc. makes this hard to isolate,
        // so we opted to just draw the transformed image to a second
        // canvas and do a source-in for the entire second canvas.
        ctx2.globalCompositeOperation = 'source-over';
        other.stamp(ctx2);
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(ScratchJr.workingCanvas2, 0, 0);
        var pixels = ctx.getImageData(rect.x, rect.y, rect.width, rect.height).data;
        var max = Math.floor(pixels.length / 4);
        for (var i = 0; i < max; i++) {
            var pt = {
                x: i % rect.width,
                y: Math.floor(i / rect.width)
            };
            if (this.getAlpha(pixels, pt, rect.width) > 0) {
                return true;
            }
        }
        return false;
    }

    getAlpha (data, node, w) {
        return data[(node.x * 4) + node.y * w * 4 + 3];
    }

    setHeading (angle) {
        this.angle = angle % 360;
        this.render();
    }

    setPos (dx, dy) {
        this.dirx = ((dx - this.xcoor) == 0) ? 1 : (dx - this.xcoor) / Math.abs(dx - this.xcoor);
        this.diry = ((dy - this.ycoor) == 0) ? 1 : (dy - this.ycoor) / Math.abs(dy - this.ycoor);
        this.xcoor = dx;
        this.ycoor = dy;
        this.wrap();
        this.render();
        setProps(this.div.style, {
            position: 'absolute',
            left: '0px',
            top: '0px'
        });
        this.updateBubble();
    }

    wrap () {
        if (this.type == 'text') {
            this.wrapText();
        } else {
            this.wrapChar();
        }
    }

    wrapChar () {
        if (this.xcoor < 0) {
            this.xcoor = 480 + this.xcoor;
        }
        if (this.ycoor < 0) {
            this.ycoor = 360 + this.ycoor;
        }
        if (this.xcoor >= 480) {
            this.xcoor = this.xcoor - 480;
        }
        if (this.ycoor >= 360) {
            this.ycoor = this.ycoor - 360;
        }
    }

    wrapText () {
        var max = this.cx > 480 ? this.cx : 480;
        var min = this.cx > 480 ? 480 - this.cx : 0;
        if (this.xcoor < min) {
            this.xcoor = max + this.xcoor;
        }
        if (this.ycoor < 0) {
            this.ycoor = 360 + this.ycoor;
        }
        if (this.xcoor >= max) {
            this.xcoor = this.xcoor - max;
        }
        if (this.ycoor >= 360) {
            this.ycoor = this.ycoor - 360;
        }
    }

    render () {
        // TODO: Merge these to get better thumbnail rendering on iOS
        var dx, dy, mtx;
        if (isAndroid) {
            mtx = '';
            if (this.img) {
                dx = this.xcoor - this.cx * this.scale;
                dy = this.ycoor - this.cy * this.scale;
                mtx = 'translate3d(' + dx + 'px,' + dy + 'px, 0px)';
                mtx += ' rotate(' + this.angle + 'deg)';
                if (this.flip) {
                    mtx += ' scale(-1, 1)';
                } else {
                    mtx += ' scale(1, 1)';
                }
                var w = (this.originalImg.width * this.scale);
                var h = (this.originalImg.height * this.scale);
                this.div.style.width = w + 'px';
                this.div.style.height = h + 'px';
                if (this.border) {
                    this.border.style.width = w + 'px';
                    this.border.style.height = h + 'px';
                }
                this.img.style.width = w + 'px';
                this.img.style.height = h + 'px';
            } else {
                dx = this.xcoor - this.cx;
                dy = this.ycoor - this.cy;
                mtx = 'translate3d(' + dx + 'px,' + dy + 'px, 0px)';
            }
            this.setTransform(mtx);
        } else {
            dx = this.xcoor - this.cx;
            dy = this.ycoor - this.cy;
            mtx = 'translate3d(' + dx + 'px,' + dy + 'px, 0px)';
            if (this.img) {
                mtx += ' rotate(' + this.angle + 'deg)';
                if (this.flip) {
                    mtx += 'scale(' + -this.scale + ', ' + this.scale + ')';
                } else {
                    mtx += 'scale(' + this.scale + ', ' + this.scale + ')';
                }
            }
            this.setTransform(mtx);
        }
    }

    select () {
        if (this.borderOn) {
            return;
        }
        if (!this.img) {
            return;
        }
        if (!this.border) {
            return;
        }
        this.div.appendChild(this.border);
        setProps(this.border.style, {
            position: 'absolute',
            left: '0px',
            top: '0px'
        });
        this.div.appendChild(this.img);
        setProps(this.img.style, {
            position: 'absolute',
            left: '0px',
            top: '0px'
        });
        this.borderOn = true;
        this.render();
    }

    unselect () {
        if (!this.borderOn) {
            return;
        }
        while (this.div.childElementCount > 0) {
            this.div.removeChild(this.div.childNodes[0]);
        }
        this.div.appendChild(this.img);
        this.borderOn = false;
    }

    setTransform (transform) {
        this.div.style.webkitTransform = transform;
    }

    screenLeft () {
        return Math.round(this.xcoor - this.cx * this.scale);
    }

    screenTop () {
        return Math.round(this.ycoor - this.cy * this.scale);
    }

    noScaleFor () {
        this.setScaleTo(this.defaultScale);
    }

    changeSizeBy (num) {
        var n = Number(num) + Number(this.scale) * 100;
        this.scale = this.getScale(n / 100);
        this.setPos(this.xcoor, this.ycoor);
        this.render();
    }

    setScaleTo (n) {
        n = this.getScale(n);
        if (n == this.scale) {
            return;
        }
        this.scale = n;
        this.setPos(this.xcoor, this.ycoor);
        this.render();
    }

    getScale (n) {
        var mins = Math.max(Math.max(this.w, this.h) * n, 36);
        var maxs = Math.min(Math.min(this.w, this.h) * n, 360);
        if (mins == 36) {
            return 36 / Math.max(this.w, this.h);
        }
        if (maxs == 360) {
            return 360 / Math.min(this.w, this.h);
        }
        return n;
    }

    getBox () {
        var box = {
            x: this.screenLeft(),
            y: this.screenTop(),
            width: this.w * this.scale,
            height: this.h * this.scale
        };
        return box;
    }

    getBoxWithEffects () {
        if (this.type == 'text') {
            return new Rectangle(this.screenLeft(), this.screenTop(), this.w * this.scale, this.h * this.scale);
        }
        var max = Math.max(this.outline.width, this.outline.height);
        var w = Math.floor(max * 1.5 * this.scale);
        var h = Math.floor(max * 1.5 * this.scale);
        return new Rectangle(Math.floor(this.xcoor - w / 2),
            Math.floor(this.ycoor - h / 2), Math.floor(w), Math.floor(h));
    }

    //////////////////////////////////////////////////
    // Balloon
    //////////////////////////////////////////////////

    closeBalloon () {
        if (!this.balloon) {
            return;
        }
        this.balloon.parentNode.removeChild(this.balloon);
        this.balloon = undefined;
    }

    openBalloon (label) {
        if (this.balloon) {
            this.closeBalloon();
        }
        var w = 200;
        var h = 36;
        var curve = 6;
        var dy = this.screenTop();
        this.balloon = newDiv(ScratchJr.stage.currentPage.div, 0, 0, w, h, {
            position: 'absolute',
            zIndex: 2,
            visibility: 'hidden'
        });
        var bimg = document.createElement('img');
        setProps(bimg.style, {
            position: 'absolute',
            zIndex: 2
        });
        this.balloon.appendChild(bimg);
        var p = newP(this.balloon, label, {});
        p.setAttribute('class', 'balloon');
        w = p.offsetWidth;
        if (w < 36) {
            w = 36;
        }
        if (w > 200) {
            w = 200;
        }
        w += (10 * gn('stage').owner.currentZoom);
        setProps(p.style, {
            position: 'absolute',
            width: w + 'px'
        });
        w += 10;
        w = Math.round(w);
        var offset = (this.screenLeft() + (this.div.offsetWidth * this.scale / 2)) - (w / 2);
        var dx = (offset < 0) ? 0 : (offset + w) > 480 ? 478 - w : offset;
        dx = Math.round(dx);
        h = p.offsetHeight + curve * 2 + 7;
        setCanvasSize(this.balloon, w, h);
        dy -= h;
        if (dy < 2) {
            dy = 2;
        }
        this.balloon.style.webkitTransform = 'translate3d(' + dx + 'px,' + dy + 'px, 0px)';
        this.balloon.left = dx;
        this.balloon.top = dy;
        setProps(this.balloon.style, {
            position: 'absolute',
            left: '0px',
            top: '0px',
            visibility: 'visible'
        });
        this.drawBalloon();
    }

    updateBubble () {
        if (this.balloon == null) {
            return;
        }
        var w = this.balloon.offsetWidth;
        var h = this.balloon.offsetHeight;
        var dy = this.screenTop();
        var offset = (this.screenLeft() + (this.div.offsetWidth * this.scale / 2)) - (w / 2);
        var dx = (offset < 0) ? 0 : (offset + w) > 480 ? 478 - w : offset;
        dx = Math.round(dx);
        dy -= h;
        if (dy < 2) {
            dy = 2;
        }
        this.balloon.style.webkitTransform = 'translate3d(' + dx + 'px,' + dy + 'px, 0px)';
        this.balloon.left = dx;
        this.balloon.top = dy;
        this.drawBalloon();
    }

    drawBalloon () {
        var img = this.balloon.childNodes[0];
        var w = this.balloon.offsetWidth;
        var h = this.balloon.offsetHeight;
        var curve = 6;
        var dx = this.balloon.left;
        var x = this.xcoor;
        var h2 = h - 8;
        var w2 = w - 1;
        var side2 = x - dx;
        var margin = 20;
        if (side2 < margin) {
            side2 = margin;
        }
        if (side2 > (w2 - margin)) {
            side2 = w2 - margin;
        }
        var side1 = w2 - side2;
        var str = BlockSpecs.balloon.concat();
        str = str.replace('width="30px"', 'width="' + w + 'px"');
        str = str.replace('height="44px"', 'height="' + h + 'px"');
        str = str.replace('viewBox="0 0 30 44"', 'viewBox="0 0 ' + w + ' ' + h + '"');
        str = str.replace('h17', 'h' + (w2 - curve * 2));
        str = str.replace('v24', 'v' + (h2 - curve * 2));
        var a = str.split('h-2');
        var b = a[1].split('h-1');
        str = a[0] + 'h' + (-side1 + 7 + curve) + b[0] + 'h' + (-side2 + 7 + curve) + b[1];
        img.src = 'data:image/svg+xml;base64,' + btoa(str);
    }

    /////////////////////////////////////
    // Sprite rendering
    ////////////////////////////////////

    stamp (ctx, deltax, deltay) {
        var w = this.outline.width * this.scale;
        var h = this.outline.height * this.scale;
        var dx = deltax ? deltax : 0;
        var dy = deltay ? deltay : 0;
        ctx.save();
        ctx.translate(this.xcoor + dx, this.ycoor + dy);
        ctx.rotate(this.angle * DEGTOR);
        if (this.flip) {
            ctx.scale(-1, 1);
        }
        ctx.drawImage(this.outline, -w / 2, -h / 2, w, h);
        ctx.restore();
    }

    /////////////////////////////////////
    // Text Creation
    /////////////////////////////////////

    createText (attr, whenDone) {
        var page = attr.page;
        setProps(this, attr);
        this.div = newHTML('p', 'textsprite', page.div);
        setProps(this.div.style, {
            fontSize: this.fontsize + 'px',
            color: this.color,
            fontFamily: window.Settings.textSpriteFont
        });
        this.div.owner = this;
        this.div.id = this.id;
        this.scale = 1;
        this.homescale = 1;
        this.homeshown = true;
        this.homeflip = false;
        this.outline = document.createElement('canvas');
        var sprites = JSON.parse(page.sprites);
        sprites.push(this.id);
        page.sprites = JSON.stringify(sprites);
        OS.analyticsEvent('editor', 'text_sprite_create');
        if ((this.str == '') && !whenDone) {
            this.setTextBox();
            this.activateInput();
            var delta = this.fontsize * 1.35;
            page.textstartat += delta;
            if ((page.textstartat + delta) > 360) {
                page.textstartat = 42;
            }
        } else {
            if (Localization.isSampleLocalizedKey(this.str) && ScratchJr.isSampleOrStarter()) {
                this.str = Localization.localize('SAMPLE_TEXT_' + this.str);
            }
            this.recalculateText();
            if (whenDone) {
                whenDone(this);
            }
        }
    }

    setTextBox () {
        var sform = document.forms.activetextbox;
        sform.textsprite = this;
        var box = this.getBox();
        var ti = document.forms.activetextbox.typing;
        ti.value = this.str;

        // TODO: Merge these for iOS
        var styles;
        if (isAndroid) {
            styles = {
                color: this.color,
                fontSize: (this.fontsize * scaleMultiplier) + 'px'
            };
        } else {
            styles = {
                color: this.color,
                fontSize: this.fontsize + 'px'
            };
        }
        var ci = BlockSpecs.fontcolors.indexOf(rgbToHex(this.color));
        UI.setMenuTextColor(gn('textcolormenu').childNodes[(ci < 0) ? 9 : ci]);
        setProps(ti.style, styles);

        // TODO: Merge these for iOS
        var dy;
        if (isAndroid) {
            dy = box.y * scaleMultiplier + globaly(gn('stage')) - 10 * scaleMultiplier;
        } else {
            dy = box.y + globaly(gn('stage'), gn('stage').offsetTop) - 10;
        }
        var formsize = 470;
        gn('textbox').className = 'pagetext on';

        // TODO: Merge these for iOS
        var dx;
        if (isAndroid) {
            AndroidInterface.scratchjr_setsoftkeyboardscrolllocation(dy * window.devicePixelRatio, (dy +
                ti.parentNode.parentNode.getBoundingClientRect().height * 1.7) * window.devicePixelRatio);
            dx = (-10 + 240 - Math.round(formsize / 2)) * scaleMultiplier + globalx(gn('stage'));
            setProps(gn('textbox').style, {
                top: dy + 'px',
                left: dx + 'px',
                zIndex: 10
            });
            setProps(sform.style, {
                height: ((this.fontsize + 10) * scaleMultiplier) + 'px'
            });
            setTimeout(function () {
                AndroidInterface.scratchjr_forceShowKeyboard();
            }, 500);
        } else {
            dx = -10 + 240 - Math.round(formsize / 2) + globalx(gn('stage'), gn('stage').offsetLeft);
            setProps(gn('textbox').style, {
                top: dy + 'px',
                left: dx + 'px',
                zIndex: 10
            });
            setProps(sform.style, {
                height: (this.fontsize + 10) + 'px'
            });
        }
    }

    unfocusText () {
        ScratchJr.blur();
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
        var form = document.forms.activetextbox;
        var changed = (this.oldvalue != form.typing.value);
        OS.analyticsEvent('editor', 'text_sprite_close');
        if (this.noChars(form.typing.value)) {
            this.deleteText(this.oldvalue != '');
        } else {
            this.contractText();
            this.div.style.visibility = 'visible';
            if (isAndroid) {
                gn('textbox').style.visibility = 'hidden';
            }
            gn('textbox').className = 'pagetext off';
            gn('textcolormenu').className = 'textuicolormenu off';
            gn('textfontsizes').className = 'textuifont off';
            gn('fontsizebutton').className = 'fontsizeText off';
            gn('fontcolorbutton').className = 'changecolorText off';
            form.textsprite = null;
            this.deactivateInput();
            if (changed) {
                Undo.record({
                    action: 'edittext',
                    where: this.div.parentNode.owner.id,
                    who: this.id
                });
                ScratchJr.storyStart('Sprite.prototype.unfocusText');
            }
        }
        Thumbs.updatePages();
        if (isAndroid) {
            ScratchJr.onBackButtonCallback.pop();
            AndroidInterface.scratchjr_forceHideKeyboard();
        }
    }

    deleteText (record) {
        var id = this.id;
        var page = ScratchJr.stage.currentPage;
        page.textstartat = (this.ycoor + (this.fontsize * 1.35)) > 360 ? 36 : this.ycoor;
        var list = JSON.parse(page.sprites);
        var n = list.indexOf(this.id);
        if (n < 0) {
            return;
        }
        list.splice(n, 1);
        this.div.parentNode.removeChild(this.div);
        page.sprites = JSON.stringify(list);
        var form = document.forms.activetextbox;
        gn('textbox').style.visibility = 'hidden';
        form.textsprite = null;
        if (record) {
            Undo.record({
                action: 'deletesprite',
                who: id,
                where: ScratchJr.stage.currentPage.id
            });
            ScratchJr.storyStart('Sprite.prototype.deleteText');
        }
    }

    noChars (str) {
        for (var i = 0; i < str.length; i++) {
            if (str[i] != ' ') {
                return false;
            }
        }
        return true;
    }

    contractText () {
        var form = document.forms.activetextbox;
        this.str = form.typing.value.substring(0, form.typing.maxLength);
        this.recalculateText();
    }

    clickOnText (e) {
        e.stopPropagation();
        this.setTextBox();
        gn('textbox').style.visibility = 'visible';
        this.div.style.visibility = 'hidden';
        this.activateInput();
    }

    activateInput () {
        this.oldvalue = this.str;
        var ti = document.forms.activetextbox.typing;
        gn('textbox').style.visibility = 'visible';
        var me = this;
        OS.analyticsEvent('editor', 'text_sprite_open');
        ti.onblur = function () {
            me.unfocusText();
        };
        ti.onkeypress = function (evt) {
            me.handleWrite(evt);
        };
        ti.onkeyup = function (evt) {
            me.handleKeyUp(evt);
        };
        ti.onsubmit = function () {
            me.unfocusText();
        };
        if (isAndroid) {
            setTimeout(function () {
                ti.focus();
            }, 500);

            ScratchJr.onBackButtonCallback.push(function () {
                me.unfocusText();
            });
        } else {
            if (isTablet) {
                ti.focus();
            } else {
                setTimeout(function () {
                    ti.focus();
                }, 100);
            }
        }
    }

    handleWrite (e) {
        var key = e.keyCode || e.which;
        var ti = e.target;
        if (key == 13) {
            e.preventDefault();
            e.target.blur();
        } else {
            if (!(ti.parentNode).textsprite) {
                gn('textbox').style.visibility = 'hidden';
                this.deactivateInput();
            }
        }
    }

    handleKeyUp (e) {
        var ti = e.target;
        if (!(ti.parentNode).textsprite) {
            return;
        }
        (ti.parentNode).textsprite.str = ti.value;
    }

    deactivateInput () {
        var ti = document.forms.activetextbox.typing;
        ti.onblur = undefined;
        ti.onkeypress = undefined;
        ti.onsubmit = undefined;
    }

    activate () {
        var list = fitInRect(this.w, this.h, ScriptsPane.watermark.offsetWidth, ScriptsPane.watermark.offsetHeight);
        var div = ScriptsPane.watermark;
        while (div.childElementCount > 0) {
            div.removeChild(div.childNodes[0]);
        }
        var img = this.getSVGimage(this.watermark);
        div.appendChild(img);
        var attr = {
            width: this.w + 'px',
            height: this.h + 'px',
            left: list[0] + 'px',
            top: list[1] + 'px',
            zoom: Math.floor((list[2] / this.w) * 100) + '%'
        };
        setProps(img.style, attr);
    }

    getSVGimage (svg) {
        var img = document.createElement('img');
        var str = (new XMLSerializer()).serializeToString(svg);
        str = str.replace(/ href="data:image/g, ' xlink:href="data:image');
        img.src = 'data:image/svg+xml;base64,' + btoa(str);
        return img;
    }

    /////////////////////////////////////////////////
    // Text fcn
    ////////////////////////////////////////////////

    setColor (c) {
        this.color = c;
        this.div.style.color = this.color;
    }

    setFontSize (n) {
        if (n < 12) {
            n = 12;
        }
        if (n > 72) {
            n = 72;
        }
        this.fontsize = n;
    }

    recalculateText () {
        this.div.style.color = this.color;
        this.div.style.fontSize = this.fontsize + 'px';
        this.div.textContent = this.str;
        var ctx = this.outline.getContext('2d');
        ctx.font = 'bold ' + this.fontsize + 'px ' + window.Settings.textSpriteFont;
        var w = ctx.measureText(this.str).width;
        this.w = (Math.round(w) + 1);
        this.div.style.width = (this.w * 2) + 'px';
        this.h = this.div.offsetHeight;
        this.cx = this.w / 2;
        this.cy = this.h / 2;
        setCanvasSize(this.outline, this.w, this.h);
        ctx.clearRect(0, 0, this.outline.width, this.outline.height);
        ctx.font = 'bold ' + this.fontsize + 'px ' + window.Settings.textSpriteFont;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(this.str, 0, 0);
        this.setPos(this.xcoor, this.ycoor);
    }

    startShaking () {
        var p = this.div.parentNode;
        var shake = newHTML('div', 'shakeme', p);
        shake.id = 'shakediv';

        // TODO: merge these for iOS
        if (isAndroid) {
            setProps(shake.style, {
                position: 'absolute',
                left: this.screenLeft() + 'px',
                top: this.screenTop() + 'px',
                width: (this.w * this.scale) + 'px',
                height: (this.h * this.scale) + 'px'
            });
        } else {
            setProps(shake.style, {
                position: 'absolute',
                left: (this.screenLeft() / this.scale) + 'px',
                top: (this.screenTop() / this.scale) + 'px',
                width: this.w + 'px',
                height: this.h + 'px',
                zoom: Math.floor(this.scale * 100) + '%'
            });
        }
        var mtx = 'translate3d(0px, 0px, 0px)';
        if (this.img) {
            mtx += ' rotate(' + this.angle + 'deg)';
            if (this.flip) {
                mtx += 'scale(' + -1 + ', ' + 1 + ')';
            } else {
                mtx += 'scale(' + 1 + ', ' + 1 + ')';
            }
        }
        this.setTransform(mtx);
        shake.appendChild(this.div);
        var cb = newHTML('div', (this.type == 'sprite') ? 'deletesprite' : 'deletetext', shake);
        if (isiOS && this.type == 'sprite') {
            cb.style.zoom = Math.floor((1 / this.scale) * 100) + '%';
        }
        if ((globalx(cb) - globalx(ScratchJr.stage.div)) < 0) {
            cb.style.left = Math.abs(globalx(cb) - globalx(ScratchJr.stage.div)) * this.scale + 'px';
        }
        if ((globaly(cb) - globaly(ScratchJr.stage.div)) < 0) {
            cb.style.top = Math.abs(globaly(cb) - globaly(ScratchJr.stage.div)) * this.scale + 'px';
        }
        cb.id = 'deletesprite';
        this.div = shake;
        this.div.owner = this;
    }

    stopShaking () {
        if (this.div.id != 'shakediv') {
            return;
        }
        var p = this.div;
        this.div = this.div.childNodes[0];
        ScratchJr.stage.currentPage.div.appendChild(this.div);
        if (p.id == 'shakediv') {
            p.parentNode.removeChild(p);
        }

        // TODO: merge these for iOS
        if (isAndroid) {
            this.render();
        } else {
            var mtx = 'translate3d(' + (this.xcoor - this.cx) + 'px,' + (this.ycoor - this.cy) + 'px, 0px)';
            if (this.img) {
                mtx += ' rotate(' + this.angle + 'deg)';
                if (this.flip) {
                    mtx += 'scale(' + -this.scale + ', ' + this.scale + ')';
                } else {
                    mtx += 'scale(' + this.scale + ', ' + this.scale + ')';
                }
            }
            this.setTransform(mtx);
        }
    }

    drawCloseButton () {
        var ctx = this.div.getContext('2d');
        var img = document.createElement('img');
        img.src = 'assets/ui/closeit.svg';
        if (!img.complete) {
            img.onload = function () {
                ctx.drawImage(0, 0);
            };
        } else {
            ctx.drawImage(img, 0, 0);
        }
    }

    //////////////////////////////////////////
    // Save data
    /////////////////////////////////////////

    getData () {
        var data = (this.type == 'sprite') ? this.getSpriteData() : this.getTextBoxData();
        if (this.type != 'sprite') {
            return data;
        }
        var sc = gn(this.id + '_scripts').owner;
        var res = [];
        var topblocks = sc.getEncodableBlocks();
        for (var i = 0; i < topblocks.length; i++) {
            res.push(Project.encodeStrip(topblocks[i]));
        }
        data.scripts = res;
        return data;
    }

    getSpriteData () {
        var data = {};
        data.shown = this.shown;
        data.type = this.type;
        data.md5 = this.md5;
        data.id = this.id;
        data.flip = this.flip;
        data.name = this.name;
        data.angle = this.angle;
        data.scale = this.scale;
        data.speed = this.speed;
        data.defaultScale = this.defaultScale;
        data.sounds = this.sounds;
        data.xcoor = this.xcoor;
        data.ycoor = this.ycoor;
        data.cx = this.cx;
        data.cy = this.cy;
        data.w = this.w;
        data.h = this.h;
        data.homex = this.homex;
        data.homey = this.homey;
        data.homescale = this.homescale;
        data.homeshown = this.homeshown;
        data.homeflip = this.homeflip;
        return data;
    }

    getTextBoxData () {
        var data = {};
        data.shown = this.shown;
        data.type = this.type;
        data.id = this.id;
        data.speed = this.speed;
        data.cx = this.cx;
        data.cy = this.cy;
        data.w = Math.floor(this.w);
        data.h = Math.floor(this.h);
        data.xcoor = this.xcoor;
        data.ycoor = this.ycoor;
        data.homex = this.homex;
        data.homey = this.homey;
        data.str = this.str;
        data.color = this.color;
        data.fontsize = this.fontsize;
        return data;
    }
}
