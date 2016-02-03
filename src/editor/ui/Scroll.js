////////////////////////////////////////////////
// Scrolling Pane
////////////////////////////////////////////////

import Events from '../../utils/Events';
import {newDiv, newHTML, CSSTransition3D, isTablet, setCanvasSize} from '../../utils/lib';

export default class Scroll {
    constructor (div, id, w, h, cfcn, ofcn) {
        this.hasHorizontal = true;
        this.hasVertical = true;
        this.arrowDistance = 6;
        this.aleft = undefined;
        this.aright = undefined;
        this.aup = undefined;
        this.adown = undefined;
        this.contents = newDiv(div, 0, 0, w, h, {});
        this.contents.setAttribute('id', id);
        this.contents.owner = this;
        this.addArrows(div, w, h);
        this.getContent = cfcn;
        this.getObjects = ofcn;
        div.scroll = this; // for now;
    }

    update () {
        this.adjustCanvas();
        this.refresh();
        this.bounceBack();
    }

    /////////////////////////////////////////////////////////////
    // Arrows
    ////////////////////////////////////////////////////////////

    addArrows (sc, w, h) {
        this.aleft = newHTML('div', 'leftarrow', sc);
        this.aleft.style.height = h + 'px';
        var larrow = newHTML('span', undefined, this.aleft);
        larrow.style.top = Math.floor((h - larrow.offsetHeight) / 2) + 'px';

        this.aright = newHTML('div', 'rightarrow', sc);
        this.aright.style.height = h + 'px';
        var rarrow = newHTML('span', undefined, this.aright);
        rarrow.style.top = Math.floor((h - rarrow.offsetHeight) / 2) + 'px';

        this.aup = newHTML('div', 'toparrow', sc);
        this.adown = newHTML('div', 'bottomarrow', sc);
        newHTML('div', 'halign up', this.aup);
        newHTML('div', 'halign down', this.adown);

        var me = this;
        if (isTablet) {
            this.aup.ontouchstart = function (e) {
                me.scrolldown(e);
            };
        } else {
            this.aup.onmousedown = function (e) {
                me.scrolldown(e);
            };
        }

        if (isTablet) {
            this.adown.ontouchstart = function (e) {
                me.scrollup(e);
            };
        } else {
            this.adown.onmousedown = function (e) {
                me.scrollup(e);
            };
        }

        if (isTablet) {
            this.aleft.ontouchstart = function (e) {
                me.scrollright(e);
            };
        } else {
            this.aleft.onmousedown = function (e) {
                me.scrollright(e);
            };
        }

        if (isTablet) {
            this.aright.ontouchstart = function (e) {
                me.scrollleft(e);
            };
        } else {
            this.aright.onmousedown = function (e) {
                me.scrollleft(e);
            };
        }

    }

    /////////////////////////////////////////////////////////////
    // Scrolling
    ////////////////////////////////////////////////////////////

    repositionArrows (h) {
        this.aleft.style.height = h + 'px';
        this.aleft.childNodes[0].style.top = Math.floor((h - this.aleft.childNodes[0].offsetHeight) / 2) + 'px';
        this.aright.style.height = h + 'px';
        this.aright.childNodes[0].style.top = Math.floor((h - this.aright.childNodes[0].offsetHeight) / 2) + 'px';
    }

    getAdjustment (rect) { // rect of the dragg block canvas
        var d = this.contents.parentNode; // scripts
        var w = d.offsetWidth;
        var h = d.offsetHeight;
        if ((rect.x > 0) && (rect.y > 0)) {
            return 'topleft';
        }
        if (((rect.x + rect.width) < w) && ((rect.y + rect.height) < h)) {
            return 'bottomright';
        }
        if ((rect.x > 0) && ((rect.y + rect.height) < h)) {
            return 'bottomleft';
        }
        if (((rect.x + rect.width) < w) && (rect.y > 0)) {
            return 'topright';
        }
        if ((rect.x + rect.width) < w) {
            return 'right';
        }
        if ((rect.y + rect.height) < h) {
            return 'down';
        }
        if (rect.y > 0) {
            return 'up';
        }
        if (rect.x > 0) {
            return 'left';
        }
        return 'none';
    }

    bounceBack () {
        var owner = this;
        var p = this.contents; // scriptscontainer
        var bc = this.getContent(); // blockcanvas
        var valx = bc.left;
        var valy = bc.top;
        var h = p.offsetHeight;
        var w = p.offsetWidth;
        var rect = {
            x: valx,
            y: valy,
            width: bc.offsetWidth,
            height: bc.offsetHeight
        };
        var transition = {
            duration: 0.5,
            transition: 'ease-out',
            style: {},
            onComplete: function () {
                owner.refresh();
            }
        };
        switch (this.getAdjustment(rect)) {
        case 'topright':
            transition.style.left = (this.hasHorizontal ? (w - rect.width) : 0) + 'px';
            transition.style.top = '0px';
            CSSTransition3D(bc, transition);
            break;
        case 'bottomright':
            transition.style.left = (this.hasHorizontal ? (w - rect.width) : 0) + 'px';
            transition.style.top = (this.hasVertical ? h - rect.height : 0) + 'px';
            CSSTransition3D(bc, transition);
            break;
        case 'topleft':
            transition.style.top = '0px';
            transition.style.left = '0px';
            CSSTransition3D(bc, transition);
            break;
        case 'bottomleft':
            transition.style.top = (this.hasVertical ? h - rect.height : 0) + 'px';
            transition.style.left = '0px';
            CSSTransition3D(bc, transition);
            break;
        case 'right':
            transition.style.top = valy + 'px';
            transition.style.left = (this.hasHorizontal ? (w - rect.width) : 0) + 'px';
            CSSTransition3D(bc, transition);
            break;
        case 'left':
            if (this.hasHorizontal) {
                transition.style.top = valy + 'px';
                transition.style.left = '0px';
                CSSTransition3D(bc, transition);
            }
            break;
        case 'down':
            transition.style.top = (h - rect.height) + 'px';
            transition.style.left = valx + 'px';
            CSSTransition3D(bc, transition);
            break;
        case 'up':
            if (this.hasVertical) {
                transition.style.top = '0px';
                transition.style.left = valx + 'px';
                CSSTransition3D(bc, transition);
            }
            break;
        }
    }

    /////////////////////////////////////////////////////////////
    // Refreshing
    ////////////////////////////////////////////////////////////

    refresh () {
        var p = this.contents; // scriptscontainer
        var bc = this.getContent(); // blockcanvas
        var w = p.offsetWidth;
        var h = p.offsetHeight;
        var you;
        var needleft = 'hidden';
        var needright = 'hidden';
        var needup = 'hidden';
        var needdown = 'hidden';
        var allblocks = this.getObjects();
        for (var i = 0; i < allblocks.length; i++) {
            you = allblocks[i].div;
            if (you == null) {
                continue;
            }
            if (!you.owner) {
                continue;
            }
            if (you.style.visibility == 'hidden') {
                continue;
            }
            if (you.left + bc.left < 0) {
                needleft = 'visible';
            }
            if ((you.left + you.offsetWidth + bc.left) > w) {
                needright = 'visible';
            }
            if (you.top + bc.top + 10 < 0) {
                needup = 'visible';
            }
            if ((you.top + you.offsetHeight + bc.top) > h) {
                needdown = 'visible';
            }
        }
        this.aleft.style.visibility = needleft;
        this.aright.style.visibility = needright;
        this.aup.style.visibility = needup;
        this.adown.style.visibility = needdown;
    }

    adjustCanvas () {
        var bc = this.getContent(); // blockcanvas
        var p = this.contents; // scriptscontainer
        var w = p.offsetWidth;
        var h = p.offsetHeight;
        var ow = bc.offsetWidth;
        var oh = bc.offsetHeight;
        var you;
        var minx = 99999;
        var maxwidth = 0;
        var miny = 99999;
        var maxheight = 0;
        var padding = 0;
        var allblocks = this.getObjects();
        for (var i = 0; i < allblocks.length; i++) {
            you = allblocks[i].div;
            if (you == null) {
                continue;
            }
            if (!you.owner) {
                continue;
            }
            if (you.style.visibility == 'hidden') {
                continue;
            }
            if (you.left < minx) {
                minx = you.left;
            }
            if ((you.left + you.offsetWidth + padding) > maxwidth) {
                maxwidth = you.left + you.offsetWidth + padding;
            }
            if (you.top < miny) {
                miny = you.top;
            }
            if ((you.top + you.offsetHeight + 20) > maxheight) {
                maxheight = you.top + you.offsetHeight + 20;
            }
        }
        if (minx < 0) {
            minx -= padding;
            minx += bc.left;
            w -= minx;
        } else {
            minx = 0;
        }
        if (miny < 0) {
            miny -= 20;
            miny += bc.top;
            h -= miny;
        } else {
            miny = 0;
        }
        if ((maxwidth - minx) > w) {
            w = Math.round(maxwidth - minx);
        }
        if ((maxheight - miny) > h) {
            h = Math.round(maxheight - miny);
        }
        if ((ow != w) || (oh != h)) {
            setCanvasSize(bc, w, h);
        }
        if ((minx < 0) || (miny < 0)) {
            this.moveBlocks(-minx, -miny);
            Events.move3D(bc, minx, miny);
        }
    }

    moveBlocks (dx, dy) {
        var allblocks = this.getObjects();
        for (var i = 0; i < allblocks.length; i++) {
            var b = allblocks[i];
            b.moveBlock(b.div.left + dx, b.div.top + dy);
        }
    }

    /////////////////////////////////////////////////////////////
    // Scrolling
    ////////////////////////////////////////////////////////////

    scrolldown (e) {
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        var owner = this;
        var p = this.contents;
        var sc = this.getContent();
        var h = p.offsetHeight;
        var valy = sc.top + h;
        if (valy > 0) {
            valy = 0;
        }
        valy = Math.round(valy);
        var transition = {
            duration: 0.5,
            transition: 'ease-out',
            style: {
                top: valy + 'px'
            },
            onComplete: function () {
                owner.refresh();
            }
        };
        CSSTransition3D(sc, transition);
    }

    scrollup (e) {
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        var owner = this;
        var p = this.contents;
        var sc = this.getContent();
        var h = p.offsetHeight;
        var valy = sc.top - h;
        if ((valy + sc.offsetHeight) < h) {
            valy = h - sc.offsetHeight;
        }
        valy = Math.round(valy);
        var transition = {
            duration: 0.5,
            transition: 'ease-out',
            style: {
                top: valy + 'px'
            },
            onComplete: function () {
                owner.refresh();
            }
        };
        CSSTransition3D(sc, transition);
    }

    scrollright (e) {
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        var owner = this;
        var p = this.contents;
        var sc = this.getContent();
        var w = p.offsetWidth;
        var valx = sc.left + w;
        if (valx > 0) {
            valx = 0;
        }
        valx = Math.round(valx);
        var transition = {
            duration: 0.5,
            transition: 'ease-out',
            style: {
                left: valx + 'px'
            },
            onComplete: function () {
                owner.refresh();
            }
        };
        CSSTransition3D(sc, transition);
    }

    scrollleft (e) {
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        var owner = this;
        var p = this.contents;
        var sc = this.getContent();
        var w = p.offsetWidth;
        var valx = sc.left - w;
        if ((valx + sc.offsetWidth) < w) {
            valx = w - sc.offsetWidth;
        }
        valx = Math.round(valx);
        var transition = {
            duration: 0.5,
            transition: 'ease-out',
            style: {
                left: valx + 'px'
            },
            onComplete: function () {
                owner.refresh();
            }
        };
        CSSTransition3D(sc, transition);
    }

    fitToScreen () {
        var p = this.contents;
        var sc = this.getContent();
        var valx = sc.left;
        var valy = sc.top;
        var h = p.offsetHeight;
        var w = p.offsetWidth;
        var rect = {
            x: valx,
            y: valy,
            width: sc.offsetWidth,
            height: sc.offsetHeight
        };
        switch (this.getAdjustment(rect)) {
        case 'topright':
            valx = w - rect.width;
            valy = 0;
            break;
        case 'bottomright':
            valx = w - rect.width;
            valy = h - rect.height;
            break;
        case 'topleft':
            valx = 0; valy = 0;
            break;
        case 'bottomleft':
            valy = h - rect.height;
            valx = 0;
            break;
        case 'right':
            valx = w - rect.width;
            break;
        case 'left':
            valx = 0;
            break;
        case 'down':
            valy = h - rect.height;
            break;
        case 'up':
            valy = 0;
            break;
        }
        Events.move3D(sc, valx, valy);
    }
}
