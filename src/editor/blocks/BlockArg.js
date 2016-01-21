import ScratchJr from '../ScratchJr';
import BlockSpecs from './BlockSpecs';
import Menu from './Menu';
import Undo from '../ui/Undo';
import {setCanvasSize, setProps, writeText, scaleMultiplier,
    newHTML, newDiv, newCanvas, getStringSize, isTablet,
    newP, globalx, globaly} from '../../utils/lib';
import Localization from '../../utils/Localization';

/*
Argument types

n: numbers
t: text
m: regular menu with icons
s: text for soundblock
r: number for recorded sound block
p: page icons

*/
export default class BlockArg {
    constructor (block) {
        this.daddy = block;
        this.type = 'blockarg';
        this.argType = block.spec[3];
        switch (this.argType) {
        case 'n':
            this.argValue = block.spec[4];
            this.div = this.addNumArg();
            break;
        case 't':
            this.argValue = block.spec[4];
            if (Localization.isSampleLocalizedKey(this.argValue) && ScratchJr.isSampleOrStarter()) {
                this.argValue = Localization.localize('SAMPLE_TEXT_' + this.argValue);
            }
            this.div = this.addTextArg();
            break;
        case 'm':
            this.argValue = block.spec[4];
            this.list = JSON.stringify(block.spec[1]);
            this.numperrow = 3;
            this.icon = this.getIconFrom(block.spec[4], block.spec[1]);
            this.div = this.addImageMenu(this.closePictureMenu);
            break;
        case 'd':
            this.argValue = block.spec[4];
            this.list = JSON.stringify(block.spec[1]);
            this.numperrow = 3;
            this.icon = BlockSpecs.speeds[this.argValue];
            this.div = this.addImageMenu(this.menuCloseSpeeds);
            break;
        case 'p':
            this.argValue = block.spec[4];
            this.div = this.pageIcon(this.argValue);
            var ctx = block.blockshape.getContext('2d');
            ctx.drawImage(this.div, 0, 0, this.div.width, this.div.height, 0, 0,
                this.div.width * block.scale, this.div.height * block.scale);
            break;
        case 's':
            this.argValue = block.spec[4];
            this.div = newDiv(block.div, 2, 46, 60, 20, {
                position: 'absolute',
                zoom: (block.scale * 100) + '%'
            });
            var p = newP(this.div, this.argValue.split('.')[0], {
                width: '60px'
            });
            p.setAttribute('class', 'soundname');
            break;
        case 'r':
            this.argValue = block.spec[4];
            this.div = newHTML('div', 'recordedCircle', block.div);
            setProps(this.div.style, {
                zoom: (block.scale * 100) + '%'
            });
            var num = newHTML('p', 'recordedNumber', this.div);
            num.textContent = this.daddy.inpalette ? this.argValue : '?';
            break;
        default:
            break;
        }
    }

    update () {
        if (this.argType == 'r') {
            this.div.childNodes[0].textContent = this.argValue;
        }
        if (this.arg && (this.argType == 'p')) {
            this.arg.updateIcon();
        }
    }

    getScreenPt () {
        return {
            x: globalx(this.daddy.div),
            y: globaly(this.daddy.div)
        };
    }

    addNumArg () {
        var str = this.argValue.toString();
        if (this.daddy.inpalette) {
            return this.addLabel(str, false);
        } else {
            return this.addNumArgument(str);
        }
    }

    addTextArg () {
        var str = this.argValue.toString();
        if (this.daddy.inpalette) {
            return this.addLabel(str, true);
        } else {
            return this.addTextArgument(str, true);
        }
    }

    addLabel (str, isText) {
        var scale = this.daddy.scale;
        var dx = isText ? 8 : 16;
        var dy = 57;
        if (this.daddy.blocktype == 'repeat') {
            dx = Math.round(this.daddy.blockshape.width / window.devicePixelRatio / scale) - 60;
            dy = Math.round(this.daddy.blockshape.height / window.devicePixelRatio / scale) - 10;
        }
        var img = isText ? BlockSpecs.textfieldimg : BlockSpecs.numfieldimg;
        var w = isText ? 53 : 36;
        var h = 17;
        var field = newCanvas(this.daddy.div, 0, 0, w * window.devicePixelRatio, h * window.devicePixelRatio, {
            position: 'absolute',
            webkitTransform: 'translate(' + (-w * window.devicePixelRatio / 2) + 'px, ' +
                (-h * window.devicePixelRatio / 2) + 'px) ' +
                'scale(' + (scale / window.devicePixelRatio) + ') ' +
                'translate(' + (dx * window.devicePixelRatio + (w * window.devicePixelRatio / 2)) + 'px, ' +
                (dy * window.devicePixelRatio + (h * window.devicePixelRatio / 2)) + 'px)',
            pointerEvents: 'all'

        });
        var ctx = field.getContext('2d');
        if (!img.complete) {
            img.onload = function () {
                ctx.drawImage(img, 0, 0, w, h, 0, 0, w * window.devicePixelRatio, h * window.devicePixelRatio);
            };
        } else {
            ctx.drawImage(img, 0, 0, w, h, 0, 0, w * window.devicePixelRatio, h * window.devicePixelRatio);
        }
        var div = newDiv(this.daddy.div, dx, dy, w, h, {
            position: 'absolute',
            zoom: (scale * 100) + '%',
            margin: '0px',
            padding: '0px'
        });
        var cnv = newCanvas(div, 0, 0, w * window.devicePixelRatio, h * window.devicePixelRatio, {
            position: 'absolute',
            webkitTransform: 'translate(' + (-w * window.devicePixelRatio / 2) + 'px, ' +
                (-h * window.devicePixelRatio / 2) + 'px) ' +
                'scale(' + (1 / window.devicePixelRatio) + ') ' +
                'translate(' + (w * window.devicePixelRatio / 2) + 'px, ' + (h * window.devicePixelRatio / 2) + 'px)'
        });
        ctx = cnv.getContext('2d');
        var font = (12 * window.devicePixelRatio) + 'px ' + Settings.blockArgFont;
        var lsize = getStringSize(ctx, font, str).width;
        writeText(ctx, font, '#77787b', str, h * window.devicePixelRatio - 3,
            Math.round((w * window.devicePixelRatio - lsize) / 2));
        return div;
    }

    addNumArgument (str) {
        var div = newHTML('div', 'numfield', this.daddy.div);
        if (this.daddy.blocktype == 'repeat') {
            setProps(div.style, {
                left: (this.daddy.blockshape.width / window.devicePixelRatio - 62 * this.daddy.scale) + 'px',
                top: (this.daddy.blockshape.height / window.devicePixelRatio - 11 * this.daddy.scale) + 'px'
            });
        }
        var ti = newHTML('h3', undefined, div);
        this.input = ti;
        ti.owner = this;
        ti.textContent = str;
        this.arg = div;
        // Expand the parent div to incorporate the size of the button,
        // else on Android 4.2 the bottom part of the button
        // will not be clickable.
        div.parentNode.height += 10 * window.devicePixelRatio;
        setCanvasSize(div.parentNode, div.parentNode.width, div.parentNode.height);
        return div;
    }

    addTextArgument (str) {
        var div = newHTML('div', 'textfield', this.daddy.div);
        var ti = newHTML('h3', undefined, div);
        this.input = ti;
        ti.owner = this;
        ti.textContent = str;
        this.arg = div;
        // Expand the parent div to incorporate the size of the button,
        // else on Android 4.2 the bottom part of the button
        // will not be clickable.
        div.parentNode.height += 10 * window.devicePixelRatio;
        setCanvasSize(div.parentNode, div.parentNode.width, div.parentNode.height);
        return div;
    }

    setValue (val) {
        if (!this.input) {
            return;
        }
        this.argValue = val;
        this.input.textContent = val;
    }

    isText () {
        return (this.argType != 'n');
    }

    /////////////////////////////////
    // Menu drop downs
    //////////////////////////////

    getIconFrom (key, list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].indexOf(key) > -1) {
                return list[i];
            }
        }
        return list[0];
    }

    addImageMenu (fcn) {
        this.drawChoice(this.daddy.blockicon);
        this.button = this.addPressButton();
        if (!this.daddy.inpalette) {
            var ba = this;
            if (isTablet) {
                ba.button.ontouchstart = function (evt) {
                    ba.pressDropDown(evt, fcn);
                };
            } else {
                ba.button.onmousedown = function (evt) {
                    ba.pressDropDown(evt, fcn);
                };
            // Expand the parent div to incorporate the size of the button,
            // else on Android 4.2 the bottom part of the button
            // will not be clickable.
            }
            this.button.parentNode.height += this.button.height / 2;
            setCanvasSize(this.button.parentNode, this.button.parentNode.width, this.button.parentNode.height);
        }
        return this.daddy.blockicon;
    }

    drawChoice (cnv) {
        var ctx = cnv.getContext('2d');
        ctx.clearRect(0, 0, cnv.width, cnv.height);
        var icon = BlockSpecs.getImageFrom('assets/blockicons/' + this.icon, 'svg');
        var scale = this.daddy.scale;
        if (!icon.complete) {
            icon.onload = function () {
                ctx.drawImage(icon, 0, 0, icon.width, icon.height,
                    0, 0, icon.width * scale * window.devicePixelRatio,
                    icon.height * scale * window.devicePixelRatio);
            };
        } else {
            ctx.drawImage(icon, 0, 0, icon.width, icon.height,
                0, 0, icon.width * scale * window.devicePixelRatio,
                icon.height * scale * window.devicePixelRatio);
        }
        return cnv;
    }

    addPressButton () {
        var scale = this.daddy.scale;
        var dx;
        if (this.daddy.inpalette) {
            dx = this.daddy.aStart ? 26 : 16;
        } else {
            dx = this.daddy.aStart ? 20 : 10;
        }
        var dy = 56;
        var w = (this.daddy.inpalette) ? 36 : 48;
        var h = (this.daddy.inpalette) ? 20 : 27;
        var img = (this.daddy.inpalette) ? BlockSpecs.pressbuttonSmall : BlockSpecs.pressbutton;
        var field = newCanvas(this.daddy.div, dx, dy, w, h, {
            position: 'absolute',
            zoom: (scale * 100) + '%',
            pointerEvents: 'all',
            webkitTransform: 'translateZ(0)'
        });
        var ctx = field.getContext('2d');
        if (!img.complete) {
            img.onload = function () {
                ctx.drawImage(img, 0, 0);
            };
        } else {
            ctx.drawImage(img, 0, 0);
        }
        return field;
    }

    pressDropDown (e, fcn) {
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        if (ScratchJr.onHold) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        ScratchJr.unfocus(e);
        if (!this.daddy) {
            return;
        }
        Menu.openDropDown(this.daddy.div, fcn);
    }

    closePictureMenu (e, mu, b, c) {
        e.preventDefault();
        var value = b.owner.arg.argValue;
        b.owner.arg.argValue = c.substring(c.indexOf('_') + 1, c.length);
        var ctx = b.owner.blockicon.getContext('2d');
        b.icon = BlockSpecs.getImageFrom('assets/blockicons/' + c, 'svg');
        ctx.clearRect(0, 0, 85 * scaleMultiplier * window.devicePixelRatio,
            66 * scaleMultiplier * window.devicePixelRatio);
        if (!b.icon.complete) {
            b.icon.onload = function () {
                var w = b.icon.width;
                var h = b.icon.height;
                ctx.drawImage(b.icon, 0, 0, w, h, 0, 0,
                    w * scaleMultiplier * window.devicePixelRatio,
                    h * scaleMultiplier * window.devicePixelRatio);
            };
        } else {
            var w = b.icon.width;
            var h = b.icon.height;
            ctx.drawImage(b.icon, 0, 0, w, h, 0, 0,
                w * scaleMultiplier * window.devicePixelRatio,
                h * scaleMultiplier * window.devicePixelRatio);
        }
        if (Menu.openMenu) {
            Menu.openMenu.parentNode.removeChild(Menu.openMenu);
        }
        if (b.owner.arg.argValue != value) {
            var spr = b.parentNode.owner.spr;
            var action = {
                action: 'scripts',
                where: spr.div.parentNode.owner.id,
                who: spr.id
            };
            Undo.record(action);
            ScratchJr.storyStart('BlockArg.prototype.closePictureMenu');
        }
        Menu.openMenu = undefined;
    }

    menuCloseSpeeds (e, mu, b, c) {
        e.preventDefault();
        var value = b.owner.arg.argValue;
        b.owner.arg.argValue = BlockSpecs.speeds.indexOf(c);
        var ctx = b.owner.blockicon.getContext('2d');
        b.icon = BlockSpecs.getImageFrom('assets/blockicons/' + c, 'svg');
        ctx.clearRect(0, 0, 64 * scaleMultiplier * window.devicePixelRatio,
            64 * scaleMultiplier * window.devicePixelRatio);
        // On Android 4.2, clearRect does not work right away. Need to tickle the DOM
        b.owner.blockicon.style.display = 'none';
        b.owner.blockicon.offsetHeight;
        b.owner.blockicon.style.display = 'inherit';
        if (!b.icon.complete) {
            b.icon.onload = function () {
                var w = b.icon.width;
                var h = b.icon.height;
                ctx.drawImage(b.icon, 0, 0, w, h, 0, 0,
                    w * scaleMultiplier * window.devicePixelRatio, h * scaleMultiplier * window.devicePixelRatio);
            };
        } else {
            var w = b.icon.width;
            var h = b.icon.height;
            ctx.drawImage(b.icon, 0, 0, w, h, 0, 0,
                w * scaleMultiplier * window.devicePixelRatio, h * scaleMultiplier * window.devicePixelRatio);
        }
        if (Menu.openMenu) {
            Menu.openMenu.parentNode.removeChild(Menu.openMenu);
        }
        if (b.owner.arg.argValue != value) {
            var spr = b.parentNode.owner.spr;
            var action = {
                action: 'scripts',
                where: spr.div.parentNode.owner.id,
                who: spr.id
            };
            Undo.record(action);
            ScratchJr.storyStart('BlockArg.prototype.menuCloseSpeeds');
        }
        Menu.openMenu = undefined;
    }

    //////////////////////////
    // Page Icon
    //////////////////////////

    pageIcon (num) {
        var dpr = window.devicePixelRatio;
        var page = ScratchJr.stage.pages[num - 1];
        var icon = document.createElement('canvas');
        setCanvasSize(icon, 86 * dpr, 66 * dpr);
        if (!page) {
            return icon;
        }
        var canvas = document.createElement('canvas');
        setCanvasSize(canvas, 52 * dpr, 42 * dpr);
        var mainctx = canvas.getContext('2d');
        mainctx.fillStyle = '#AE1F24';
        mainctx.fillRect(0, 0, canvas.width, canvas.height);
        mainctx.fillStyle = '#28A5DA';
        mainctx.fillRect(1 * dpr, 1 * dpr, 50 * dpr, 40 * dpr);
        var c = document.createElement('canvas');
        var w = (52 - 6) * dpr;
        var h = (42 - 6) * dpr;
        setCanvasSize(c, w, h);
        var ctx = c.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, c.width, c.height);
        if (page.bkg.childElementCount > 0) {
            var img = page.bkg.childNodes[0];
            var imgw = img.naturalWidth ? img.naturalWidth : img.width;
            var imgh = img.naturalHeight ? img.naturalHeight : img.height;
            ctx.drawImage(img, 0, 0, imgw, imgh, 0, 0, w, h);
        }
        var scale = w / 480;
        for (var i = 0; i < page.div.childElementCount; i++) {
            var spr = page.div.childNodes[i].owner;
            if (!spr) {
                continue;
            }
            page.stampSpriteAt(ctx, spr, scale);
        }
        mainctx.drawImage(c, 3 * dpr, 3 * dpr);
        var ictx = icon.getContext('2d');
        ictx.fillStyle = '#AE1F24';
        ictx.beginPath();
        ictx.arc(63 * dpr, 19 * dpr, 10 * dpr, 0 * dpr, Math.PI * 2, true);
        ictx.closePath();
        ictx.fill();
        ictx.drawImage(canvas, 14 * dpr, 16 * dpr);
        ictx.beginPath();
        ictx.fillStyle = '#28A5DA';
        ictx.strokeStyle = '#355E7C';
        ictx.arc(63 * dpr, 19 * dpr, 8 * dpr, 0 * dpr, Math.PI * 2, true);
        ictx.closePath();
        ictx.stroke();
        ictx.fill();
        writeText(ictx, 'bold ' + (12 * dpr) + 'px ' + Settings.blockArgFont, 'white', page.num, 26 * dpr, 58 * dpr);
        return icon;
    }

    updateIcon () {
        var num = this.argValue;
        var page = ScratchJr.stage.pages[num - 1];
        page.num = num;
        this.div = this.pageIcon(num);
        var block = this.daddy;
        var ctx = block.blockshape.getContext('2d');
        ctx.drawImage(this.div, 0, 0, this.div.width, this.div.height, 0, 0,
            this.div.width * block.scale, this.div.height * block.scale);
    }
}
