//////////////////////////////////////
//   Pages
/////////////////////////////////////

import ScratchJr from '../ScratchJr';
import Palette from './Palette';
import Page from '../engine/Page';
import ScriptsPane from './ScriptsPane';
import Undo from './Undo';
import UI from './UI';
import OS from '../../tablet/OS';
import Events from '../../utils/Events';
import ScratchAudio from '../../utils/ScratchAudio';
import {frame, gn, localx, newHTML, scaleMultiplier, getIdFor,
    isTablet, newImage, localy, setProps} from '../../utils/lib';

let caret = undefined;

export default class Thumbs {
    static updatePages () {
        var pthumbs = gn('pagecc');
        while (pthumbs.childElementCount > 0) {
            pthumbs.removeChild(pthumbs.childNodes[0]);
        }
        var prev = undefined;
        for (var i = 0; i < ScratchJr.stage.pages.length; i++) {
            var page = ScratchJr.stage.pages[i];
            page.num = i + 1;
            var th = page.pageThumbnail(pthumbs);
            th.prev = prev;
            if (prev) {
                prev.next = th;
            }
            if (page.id == ScratchJr.stage.currentPage.id) {
                Thumbs.highlighPage(th);
            } else {
                Thumbs.unhighlighPage(th);
            }
            ScriptsPane.updateScriptsPageBlocks(JSON.parse(page.sprites));
            prev = th;
        }
        if ((ScratchJr.stage.pages.length > 3) || !ScratchJr.isEditable()) {
            return;
        }
        var ep = Thumbs.emptyPage(pthumbs);
        ep.prev = prev;
        th.next = ep;
    }

    static getObjectFor (div, id) {
        for (var i = 0; i < div.childElementCount; i++) {
            if (div.childNodes[i].owner == id) {
                return div.childNodes[i];
            }
        }
        return div.childNodes[0];
    }

    static getType (div, str) {
        while (div != null) {
            if (div.type == str) {
                return div;
            }
            div = div.parentNode;
        }
        return null;
    }

    static pageMouseDown (e) {
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        if (ScratchJr.onHold) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (window.event) {
            Thumbs.t = window.event.srcElement;
        } else {
            Thumbs.t = e.target;
        }
        var tb = Thumbs.getType(Thumbs.t, 'pagethumb');
        if (ScratchJr.shaking && (e.target.className == 'deletethumb')) {
            ScratchJr.clearSelection();
            OS.analyticsEvent('editor', 'delete_scene');
            ScratchJr.stage.deletePage(tb.owner);
            return;
        }
        if (ScratchJr.shaking) {
            ScratchJr.clearSelection();
            return;
        }
        if (!tb) {
            return;
        }
        if (!ScratchJr.isEditable() || (gn('pagecc').childElementCount < 3)) {
            Thumbs.clickOnPage(e, tb.owner);
        } else {
            Events.startDrag(e, tb, Thumbs.prepareToDragPage, Thumbs.dropPage, Thumbs.draggingPage,
                Thumbs.clickPage, Thumbs.startPageShaking);
        }
    }

    static prepareToDragPage (e) {
        e.preventDefault();
        e.stopPropagation();
        ScratchAudio.sndFX('grab.wav');
        var pt = Events.getTargetPoint(e);
        Events.dragmousex = pt.x;
        Events.dragmousey = pt.y;
        var mx = Events.dragmousex - frame.offsetLeft - localx(Events.dragthumbnail, Events.dragmousex);
        var my = Events.dragmousey - frame.offsetTop - localy(Events.dragthumbnail, Events.dragmousey);
        var mstyle = {
            position: 'absolute',
            left: '0px',
            top: '0px',
            zIndex: ScratchJr.dragginLayer
        };
        Events.dragcanvas = Events.dragthumbnail;
        setProps(Events.dragcanvas.style, mstyle);
        Events.move3D(Events.dragcanvas, mx, my);
        frame.appendChild(Events.dragcanvas);
        caret = newHTML('div', 'pagethumb caret', gn('pagecc'));
        caret.prev = Events.dragthumbnail.prev;
        caret.next = Events.dragthumbnail.next;
        if (Events.dragthumbnail.prev) {
            (Events.dragthumbnail.prev).next = caret;
        }
        if (Events.dragthumbnail.next) {
            (Events.dragthumbnail.next).prev = caret;
        }
        Thumbs.layoutPages();
        Events.dragthumbnail.pos = Thumbs.getPagePos(Events.dragcanvas.top);
    }

    static layoutPages () {
        var thispage = Thumbs.findFirst();
        var p = gn('pagecc');
        while (thispage) {
            p.appendChild(thispage);
            thispage = thispage.next;
        }
    }

    static findFirst () {
        var kid = gn('pagecc').childNodes[0];
        while (kid.prev) {
            kid = kid.prev;
        }
        return kid;
    }

    static findLast () {
        var kid = gn('pagecc').childNodes[0];
        while (kid.next) {
            kid = kid.next;
        }
        return kid;
    }

    static getPageOrder () {
        var page = Thumbs.findFirst();
        var res = [];
        while (page) {
            var pagename = page.owner;
            if (pagename) {
                res.push(gn(pagename).owner);
            }
            page = page.next;
        }
        return res;
    }

    static draggingPage (e, el) {
        e.preventDefault();
        var pt = Events.getTargetPoint(e);
        var dx = pt.x - Events.dragmousex;
        var dy = pt.y - Events.dragmousey;
        Events.move3D(el, dx, dy);
        if (!caret) {
            return;
        }
        Thumbs.removeCaret();
        Thumbs.insertCaret(el);
        Thumbs.layoutPages();
    }

    static removeCaret () {
        var myprev = caret.prev;
        var mynext = caret.next;
        if (myprev) {
            myprev.next = mynext;
        }
        if (mynext) {
            mynext.prev = myprev;
        }
        caret.prev = undefined;
        caret.next = undefined;
        var p = caret.parentNode;
        if (p) {
            p.removeChild(caret);
        }
    }

    static insertCaret (el) {
        var pos = Thumbs.getPagePos(el.top);
        Thumbs.positionMe(pos, caret);
        gn('pagecc').appendChild(caret);
    }

    static getPagePos (dy) {
        var delta = gn('pagecc').childNodes[1].offsetTop - gn('pagecc').childNodes[0].offsetTop;
        var pos = Math.floor(localy(gn('pagecc'), dy + (delta / 2)) / delta);
        pos = Math.max(0, pos);
        var max = Thumbs.getPageOrder().length;
        return Math.min(max, pos);
    }

    static positionMe (pos, elem) {
        var beforewho = pos >= gn('pagecc').childElementCount ? undefined : gn('pagecc').childNodes[pos];
        if (!beforewho) {
            var last = Thumbs.findLast();
            last.next = elem;
            elem.prev = last;
            elem.next = undefined;
        } else {
            var prev = beforewho.prev;
            beforewho.prev = elem;
            elem.next = beforewho;
            if (prev) {
                prev.next = elem;
                elem.prev = prev;
            }
        }
    }

    static repositionThumb (thumb, dy) {
        var pos = Thumbs.getPagePos(dy);
        if (pos != thumb.pos) {
            ScratchAudio.sndFX('snap.wav');
        }
        var myprev = thumb.prev;
        var mynext = thumb.next;
        if (myprev) {
            myprev.next = mynext;
        }
        if (mynext) {
            mynext.prev = myprev;
        }
        Thumbs.positionMe(pos, thumb);
    }

    static dropPage (e) {
        ScratchJr.storyStart('Thumbs.dropPage');
        e.preventDefault();
        if (!caret) {
            return;
        }
        Events.dragthumbnail.prev = caret.prev;
        Events.dragthumbnail.next = caret.next;
        if (Events.dragthumbnail.prev) {
            (Events.dragthumbnail.prev).next = Events.dragthumbnail;
        }
        if (Events.dragthumbnail.next) {
            (Events.dragthumbnail.next).prev = Events.dragthumbnail;
        }
        if (caret.parentNode) {
            caret.parentNode.removeChild(caret);
        }
        caret = undefined;
        Events.dragthumbnail.style.position = '';
        Events.dragthumbnail.style.left = '';
        Events.dragthumbnail.style.top = '';
        Events.dragthumbnail.style.webkitTransform = '';
        var oldpos = Number(Events.dragthumbnail.childNodes[1].childNodes[0].textContent) - 1;
        var oldpage = Events.dragthumbnail.owner;
        Thumbs.repositionThumb(Events.dragthumbnail, Events.dragthumbnail.top);
        var oldlist = ScratchJr.stage.getPagesID();
        ScratchJr.stage.pages = Thumbs.getPageOrder();
        Thumbs.layoutPages();
        Thumbs.updatePages();
        ScratchJr.stage.renumberPageBlocks(oldlist);
        if (Palette.numcat == 5) {
            Palette.selectCategory(5);
        }
        if (Thumbs.getPageOrder()[oldpos].id != oldpage) {
            Undo.record({
                action: 'pageorder',
                who: oldpage,
                where: oldpage
            });
        }
    }

    static clickPage (e) {
        ScratchJr.clearSelection();
        Thumbs.clickOnPage(e, Events.dragthumbnail.owner);
        Events.clearEvents();
        Events.dragthumbnail = undefined;
    }

    static clickOnPage (e, pagename) {
        ScratchJr.unfocus(e);
        var pthumbs = gn('pagecc');
        for (var i = 0; i < pthumbs.childElementCount; i++) {
            var thumb = pthumbs.childNodes[i];
            if (thumb.id == 'emptypage') {
                continue;
            }
        }
        if (ScratchJr.stage.currentPage.id == pagename) {
            return;
        }
        var page = gn(pagename).owner;
        ScratchJr.stage.setPage(page, false);
        Undo.record({
            action: 'changepage',
            who: pagename,
            where: pagename
        });
    }


    static startPageShaking (tb) {
        ScratchJr.shaking = tb;
        ScratchJr.stopShaking = Thumbs.stopPageShaking;
        var cc = tb.getAttribute('class');
        tb.setAttribute('class', cc + ' shakeme');
        tb.childNodes[tb.childElementCount - 1].style.visibility = 'visible';
    }


    static stopPageShaking (b) {
        ScratchJr.shaking = undefined;
        ScratchJr.stopShaking = undefined;
        var cc = b.getAttribute('class');
        cc = cc.substr(0, cc.length - 8);
        b.setAttribute('class', cc);
        b.childNodes[b.childElementCount - 1].style.visibility = 'hidden';
    }

    static emptyPage (p) {
        var tb = newHTML('div', 'pagethumb', p);
        var c = newHTML('div', 'empty', tb);
        var img;
        if (window.Settings.edition == 'PBS') {
            img = newImage(c, 'assets/ui/newpage.svg');
        } else {
            img = newImage(c, 'assets/ui/newpage.png', {
                position: 'absolute'
            });
        }
        img.setAttribute('class', 'unselectable');
        tb.setAttribute('id', 'emptypage');
        if (isTablet) {
            tb.ontouchstart = function (evt) {
                Thumbs.clickOnEmptyPage(evt);
            };
        } else {
            tb.onmousedown = function (evt) {
                Thumbs.clickOnEmptyPage(evt);
            };
        }
        return tb;
    }

    static clickOnEmptyPage (e) {
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        ScratchAudio.sndFX('tap.wav');
        e.preventDefault();
        ScratchJr.stage.currentPage.div.style.visibility = 'hidden';
        ScratchJr.stage.currentPage.setPageSprites('hidden');
        var sc = gn(ScratchJr.stage.currentPage.currentSpriteName + '_scripts');
        if (sc) {
            sc.owner.deactivate();
        }
        ScratchJr.unfocus(e);
        OS.analyticsEvent('editor', 'add_scene');
        new Page(getIdFor('page'));
    }

    static highlighPage (page) {
        page.setAttribute('class', 'pagethumb on');
    }

    static unhighlighPage (page) {
        page.setAttribute('class', 'pagethumb off');
    }

    static overpage (page) {
        page.setAttribute('class', 'pagethumb drop');
    }

    //////////////////////////////////////
    //   Library
    /////////////////////////////////////

    static updateSprites () {
        var costumes = gn('spritecc');
        costumes.style.top = '0px';
        while (costumes.childElementCount > 0) {
            costumes.removeChild(costumes.childNodes[0]);
        }
        var sprites = JSON.parse(ScratchJr.stage.currentPage.sprites);
        for (var i = 0; i < sprites.length; i++) {
            var s = gn(sprites[i]);
            if (!s) {
                continue;
            }
            var spr = s.owner;
            if (spr.type != 'sprite') {
                continue;
            }
            var th = spr.spriteThumbnail(costumes);
            if (spr.id == ScratchJr.stage.currentPage.currentSpriteName) {
                Thumbs.highlighSprite(th);
            } else {
                Thumbs.unhighlighSprite(th);
            }
        }
        if (!ScratchJr.getSprite()) {
            ScratchJr.stage.currentPage.setCurrentSprite(undefined);
        }
        UI.resetSpriteLibrary();
    }

    static updateSprite (spr) {
        if (!spr) {
            return;
        }
        if (spr.thumbnail) {
            spr.updateSpriteThumb();
        } else {
            var costumes = gn('spritecc');
            if (spr.type != 'sprite') {
                return;
            }
            spr.spriteThumbnail(costumes);
            Thumbs.selectThisSprite(spr);
            UI.resetSpriteLibrary();
        }
    }

    /////////////////////////////////////////////
    //  Sprite Thumbnails
    ////////////////////////////////////////////

    static startDragThumb (e, tb) {
        if (ScratchJr.shaking && (e.target.id == 'deletespritethumb')) {
            ScratchJr.clearSelection();
            ScratchJr.stage.removeSprite(gn(tb.owner).owner);
        }
        if (ScratchJr.shaking) {
            ScratchJr.clearSelection();
        }
        if (!ScratchJr.isEditable()) {
            Thumbs.clickOnSprite(e, tb);
        } else {
            Events.startDrag(e, tb, Thumbs.prepareToDrag, Thumbs.drop,
                Thumbs.dragging, Thumbs.click, Thumbs.startCharShaking);
        }
    }

    static startCharShaking (tb) {
        if (!tb) {
            return;
        }
        ScratchJr.shaking = tb;
        ScratchJr.stopShaking = Thumbs.stopCharShaking;
        var cc = tb.getAttribute('class');
        tb.setAttribute('class', cc + ' shakethumb');
        var close = newHTML('div', 'deletespritethumb', tb);
        close.id = 'deletespritethumb';
    }

    static stopCharShaking (b) {
        ScratchJr.shaking = undefined;
        ScratchJr.stopShaking = undefined;
        var cc = b.getAttribute('class');
        cc = cc.substr(0, cc.length - 8);
        b.setAttribute('class', cc);
        var ic = b.childNodes[b.childElementCount - 1];
        if (ic.getAttribute('class') == 'deletespritethumb') {
            b.removeChild(ic);
        }
    }

    static selectThisSprite (spr) {
        var costumes = gn('spritecc');
        var el = spr.thumbnail;
        for (var i = 0; i < costumes.childElementCount; i++) {
            var th = costumes.childNodes[i];
            if (th == el) {
                Thumbs.highlighSprite(el);
            } else {
                Thumbs.unhighlighSprite(th);
            }
        }
    }

    static clickOnSprite (e, el) {
        if (ScratchJr.shaking && (ScratchJr.shaking == el)) {
            ScratchJr.clearSelection();
            ScratchJr.stage.removeSprite(gn(el.owner).owner);
            return;
        }
        var spritename = el.owner;
        if (!gn(spritename)) {
            return;
        }
        ScratchJr.unfocus(e);
        var spr = gn(spritename).owner;
        var page = spr.div.parentNode.owner;
        page.setCurrentSprite(spr);
        Thumbs.selectThisSprite(spr);
    }

    static prepareToDrag (e) {
        e.preventDefault();
        e.stopPropagation();
        ScratchAudio.sndFX('grab.wav');
        var pt = Events.getTargetPoint(e);
        Events.dragmousex = pt.x;
        Events.dragmousey = pt.y;
        Events.dragthumbnail = Thumbs.getObjectFor(gn('spritecc'), Events.dragthumbnail.owner);
        var mx = Events.dragmousex - frame.offsetLeft -
            localx(Events.dragthumbnail, Events.dragmousex) - gn('topsection').offsetLeft;
        var my = Events.dragmousey - frame.offsetTop -
            localy(Events.dragthumbnail, Events.dragmousey) - gn('topsection').offsetTop;
        var sy = Events.dragthumbnail.parentNode.parentNode.scrollTop;
        var sx = Events.dragthumbnail.parentNode.parentNode.scrollLeft;
        my -= sy;
        mx -= sx;
        var mstyle = {
            position: 'absolute',
            left: '0px',
            top: '0px',
            zIndex: ScratchJr.dragginLayer,
            zoom: (100 / window.devicePixelRatio) + '%'
        };
        var spr = gn(Events.dragthumbnail.owner).owner;
        Events.dragcanvas = document.createElement('canvas');
        spr.drawMyImage(Events.dragcanvas,
            76 * scaleMultiplier * window.devicePixelRatio,
            (76 - 12) * scaleMultiplier * window.devicePixelRatio
        );
        setProps(Events.dragcanvas.style, mstyle);
        Events.move3D(Events.dragcanvas, mx * window.devicePixelRatio, my * window.devicePixelRatio);
        Events.dragcanvas.owner = Events.dragthumbnail.owner;
        frame.appendChild(Events.dragcanvas);
    }

    static dragging (e, el) {
        e.preventDefault();
        var pt = Events.getTargetPoint(e);
        var dx = pt.x - Events.dragmousex;
        var dy = pt.y - Events.dragmousey;
        Events.move3D(el, dx * window.devicePixelRatio, dy * window.devicePixelRatio);
        if (Palette.getLandingPlace(el, e, window.devicePixelRatio) != 'pages') {
            Thumbs.removePagesCaret();
            return;
        }
        var thumb = Palette.getHittedThumb(el, gn('pagecc'), window.devicePixelRatio);
        if (thumb && !thumb.owner) {
            thumb = undefined;
        }
        if (thumb) {
            Thumbs.overpage(thumb);
        }
        for (var i = 0; i < gn('pagecc').childElementCount; i++) {
            var spr = gn('pagecc').childNodes[i];
            if (!spr.owner) {
                continue;
            }
            var page = gn(spr.owner);
            if (thumb && (thumb.id != spr.id)) {
                if (page.owner.id == ScratchJr.stage.currentPage.id) {
                    Thumbs.highlighPage(spr);
                } else {
                    Thumbs.unhighlighPage(spr);
                }
            }
        }
    }

    static removePagesCaret () {
        for (var i = 0; i < gn('pagecc').childElementCount; i++) {
            var spr = gn('pagecc').childNodes[i];
            if (!spr.owner) {
                continue;
            }
            var page = gn(spr.owner);
            if (page.owner.id == ScratchJr.stage.currentPage.id) {
                Thumbs.highlighPage(spr);
            } else {
                Thumbs.unhighlighPage(spr);
            }
        }
    }

    static drop (e, el) {
        e.preventDefault();
        switch (Palette.getLandingPlace(el, e, window.devicePixelRatio)) {
        case 'pages':
            var thumb = Palette.getHittedThumb(el, gn('pagecc'), window.devicePixelRatio);
            if (thumb && thumb.id != 'emptypage') {
                ScratchJr.stage.copySprite(el, thumb);
            }
            break;
        default:
            break;
        }
        if (Events.dragcanvas) {
            Events.dragcanvas.parentNode.removeChild(Events.dragcanvas);
        }
        Events.dragcanvas = undefined;
    }

    static click (e, el) {
        e.preventDefault();
        e.stopPropagation();
        if (window.event) {
            Thumbs.t = window.event.srcElement;
        } else {
            Thumbs.t = e.target;
        }
        el.setAttribute('class', ScratchJr.isEditable() ? 'spritethumb on' : 'spritethumb noneditable');
        Thumbs.clickOnSprite(e, el);
    }

    static highlighSprite (spr) {
        spr.setAttribute('class', ScratchJr.isEditable() ? 'spritethumb on' : 'spritethumb noneditable');
        ScriptsPane.setActiveScript(spr.owner);
        Palette.reset();
    }

    static unhighlighSprite (spr) {
        spr.setAttribute('class', 'spritethumb off');
        var currentsc = gn(spr.owner + '_scripts');
        currentsc.owner.deactivate();
        for (var i = 0; i < currentsc.childElementCount; i++) {
            if (currentsc.childNodes[i].owner) {
                currentsc.childNodes[i].owner.unhighlight();
            }
        }
    }

    static quickHighlight (spr) {
        if (spr.owner == ScratchJr.stage.currentPage.currentSpriteName) {
            spr.className = 'spritethumb on target';
        } else {
            spr.className = 'spritethumb off target';
        }
    }

    static quickRestore (spr) {
        if (spr.owner == ScratchJr.stage.currentPage.currentSpriteName) {
            spr.className = ScratchJr.isEditable() ? 'spritethumb on' : 'spritethumb noneditable';
        } else {
            spr.className = 'spritethumb off';
        }
    }
}
