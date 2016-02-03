
import ScratchJr from '../ScratchJr';
import Project from './Project';
import Thumbs from './Thumbs';
import Palette from './Palette';
import Undo from './Undo';
import Events from '../../utils/Events';
import Scroll from './Scroll';
import Menu from '../blocks/Menu';
import ScratchAudio from '../../utils/ScratchAudio';
import {gn, localx, localy, newHTML, isTablet,
    globalx, globaly, setCanvasSize, getDocumentHeight, frame} from '../../utils/lib';

let scroll = undefined;
let watermark;

export default class ScriptsPane {
    static get scroll () {
        return scroll;
    }

    static get watermark () {
        return watermark;
    }

    static createScripts (parent) {
        var div = newHTML('div', 'scripts', parent);
        div.setAttribute('id', 'scripts');
        watermark = newHTML('div', 'watermark', div);
        var h = Math.max(getDocumentHeight(), frame.offsetHeight);
        setCanvasSize(div, div.offsetWidth, h - div.offsetTop);
        scroll = new Scroll(div, 'scriptscontainer', div.offsetWidth,
            h - div.offsetTop, ScratchJr.getActiveScript, ScratchJr.getBlocks);
    }

    static setActiveScript (sprname) {
        var currentsc = gn(sprname + '_scripts');
        if (!currentsc) {
            // Sprite not found
            return;
        }
        ScratchJr.stage.currentPage.setCurrentSprite(gn(sprname).owner);
        currentsc.owner.activate();
        currentsc.parentNode.ontouchstart = function (evt) {
            currentsc.owner.scriptsMouseDown(evt);
        };
        scroll.update();
    }

    static runBlock (e, div) {
        e.preventDefault();
        e.stopPropagation();
        var b = div.owner.findFirst();
        //	if (b.aStart) b = b.next;
        if (!b) {
            return;
        }
        ScratchJr.runtime.addRunScript(ScratchJr.getSprite(), b);
        ScratchJr.startCurrentPageStrips(['ontouch']);
        ScratchJr.userStart = true;
    }

    static prepareToDrag (e) {
        e.preventDefault();
        var pt = Events.getTargetPoint(e);
        ScriptsPane.pickBlock(pt.x, pt.y, e);
    }

    static pickBlock (x, y, e) {
        if (!ScratchJr.runtime.inactive()) {
            ScratchJr.stopStrips();
        }
        ScriptsPane.cleanCarets();
        ScratchJr.unfocus(e);
        var sc = ScratchJr.getActiveScript().owner;
        sc.dragList = sc.findGroup(Events.dragthumbnail.owner);
        sc.flowCaret = null;
        var sy = Events.dragthumbnail.parentNode.scrollTop;
        var sx = Events.dragthumbnail.parentNode.scrollLeft;
        Events.dragmousex = x;
        Events.dragmousey = y;
        var lpt = {
            x: localx(Events.dragthumbnail.parentNode, x),
            y: localy(Events.dragthumbnail.parentNode, y)
        };
        var mx = Events.dragmousex - globalx(Events.dragDiv) - lpt.x + Events.dragthumbnail.left;
        var my = Events.dragmousey - globaly(Events.dragDiv) - lpt.y + Events.dragthumbnail.top;
        var mtx = new WebKitCSSMatrix(window.getComputedStyle(Events.dragthumbnail).webkitTransform);
        my -= sy;
        mx -= sx;
        Events.dragcanvas = Events.dragthumbnail;
        Events.dragcanvas.origin = 'scripts';
        Events.dragcanvas.startx = mtx.m41;
        Events.dragcanvas.starty = mtx.m42;
        if (!Events.dragcanvas.isReporter && Events.dragcanvas.parentNode) {
            Events.dragcanvas.parentNode.removeChild(Events.dragcanvas);
        }
        Events.move3D(Events.dragcanvas, mx, my);
        Events.dragcanvas.style.zIndex = ScratchJr.dragginLayer;
        Events.dragDiv.appendChild(Events.dragcanvas);
        var b = Events.dragcanvas.owner;
        b.detachBlock();
        //	b.lift();
        if (Events.dragcanvas.isReporter) {
            return;
        }
        ScratchJr.getActiveScript().owner.prepareCaret(b);
        for (var i = 1; i < sc.dragList.length; i++) {
            b = sc.dragList[i];
            var pos = new WebKitCSSMatrix(window.getComputedStyle(b.div).webkitTransform);
            var dx = pos.m41 - mtx.m41;
            var dy = pos.m42 - mtx.m42;
            b.moveBlock(dx, dy);
            //   b.lift();
            Events.dragcanvas.appendChild(b.div);
        }
    }

    ////////////////////////////////////////////////
    //  Events MouseMove
    ////////////////////////////////////////////////

    static draggingBlock (e) {
        e.preventDefault();
        var pt = Events.getTargetPoint(e);
        var dx = pt.x - Events.dragmousex;
        var dy = pt.y - Events.dragmousey;
        Events.move3D(Events.dragcanvas, dx, dy);
        ScriptsPane.blockFeedback(Events.dragcanvas.left, Events.dragcanvas.top, e);
    }

    static blockFeedback (dx, dy, e) {
        var script = ScratchJr.getActiveScript().owner;
        var limit = gn('palette').parentNode.offsetTop + gn('palette').parentNode.offsetHeight;
        var ycor = dy + Events.dragcanvas.offsetHeight;
        if (ycor < limit) {
            script.removeCaret();
        } else {
            script.removeCaret();
            script.insertCaret(dx, dy);
        }
        var thumb;
        switch (Palette.getLandingPlace(script.dragList[0].div, e)) {
        case 'library':
            thumb = Palette.getHittedThumb(script.dragList[0].div, gn('spritecc'));
            if (thumb && (gn(thumb.owner).owner.type == ScratchJr.getSprite().type)) {
                Thumbs.quickHighlight(thumb);
            } else {
                thumb = undefined;
            }
            for (var i = 0; i < gn('spritecc').childElementCount; i++) {
                var spr = gn('spritecc').childNodes[i];
                if (spr.nodeName == 'FORM') {
                    continue;
                }
                if (thumb && (thumb.id != spr.id)) {
                    Thumbs.quickRestore(spr);
                }
            }
            break;
        default:
            ScriptsPane.removeLibCaret();
            break;
        }
    }


    ////////////////////////////////////////////////
    //  Events MouseUP
    ////////////////////////////////////////////////

    static dropBlock (e, el) {
        e.preventDefault();
        var sc = ScratchJr.getActiveScript();
        var spr = sc.owner.spr.id;
        var page = ScratchJr.stage.currentPage;
        switch (Palette.getLandingPlace(el, e)) {
        case 'scripts':
            var dx = localx(sc, el.left);
            var dy = localy(sc, el.top);
            ScriptsPane.blockDropped(sc, dx, dy);
            break;
        case 'library':
            var thumb = Palette.getHittedThumb(el, gn('spritecc'));
            ScriptsPane.blockDropped(ScratchJr.getActiveScript(), el.startx, el.starty);
            if (thumb && (gn(thumb.owner).owner.type == gn(page.currentSpriteName).owner.type)) {
                ScratchJr.storyStart('ScriptsPane.dropBlock:library');
                ScratchAudio.sndFX('copy.wav');
                Thumbs.quickHighlight(thumb);
                setTimeout(function () {
                    Thumbs.quickRestore(thumb);
                }, 300);
                sc = gn(thumb.owner + '_scripts').owner;
                var strip = Project.encodeStrip(el.owner);
                var firstblock = strip[0];
                var delta = sc.gettopblocks().length * 3;
                firstblock[2] = firstblock[2] + delta;
                firstblock[3] = firstblock[3] + delta;
                sc.recreateStrip(strip);
                spr = thumb.owner;
            }
            break;
        default:
            ScratchJr.getActiveScript().owner.deleteBlocks();
            scroll.adjustCanvas();
            scroll.refresh();
            scroll.fitToScreen();
            break;
        }
        Undo.record({
            action: 'scripts',
            where: page.id,
            who: spr
        });
        ScratchJr.getActiveScript().owner.dragList = [];
    }

    static blockDropped (sc, dx, dy) {
        Events.dragcanvas.style.zIndex = '';
        var script = ScratchJr.getActiveScript().owner;
        ScriptsPane.cleanCarets();
        script.addBlockToScripts(Events.dragcanvas, dx, dy);
        script.layout(Events.dragcanvas.owner);
        if (sc.id == ScratchJr.getActiveScript().id) {
            scroll.adjustCanvas();
            scroll.refresh();
            scroll.bounceBack();
        }
    }

    static cleanCarets () {
        ScratchJr.getActiveScript().owner.removeCaret();
        ScriptsPane.removeLibCaret();
    }

    static removeLibCaret () {
        for (var i = 0; i < gn('spritecc').childElementCount; i++) {
            var spr = gn('spritecc').childNodes[i];
            if (spr.nodeName == 'FORM') {
                continue;
            }
            Thumbs.quickRestore(spr);
        }
    }

    //----------------------------------
    //  Drag Script Background
    //----------------------------------

    static dragBackground (e) {
        if (Menu.openMenu) {
            return;
        }
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        var sc = ScratchJr.getActiveScript();
        sc.top = sc.offsetTop;
        sc.left = sc.offsetLeft;
        var pt = Events.getTargetPoint(e);
        Events.dragmousex = pt.x;
        Events.dragmousey = pt.y;
        Events.dragged = false;
        ScriptsPane.setDragBackgroundEvents(ScriptsPane.dragMove, ScriptsPane.dragEnd);
    }

    static setDragBackgroundEvents (fcnmove, fcnup) {
        if (isTablet) { // setDragBackgroundEvents
            window.ontouchmove = function (evt) {
                fcnmove(evt);
            };
            window.ontouchend = function (evt) {
                fcnup(evt);
            };
        } else {
            window.onmousemove = function (evt) {
                fcnmove(evt);
            };
            window.onmouseup = function (evt) {
                fcnup(evt);
            };
        }
    }

    static dragMove (e) {
        var pt = Events.getTargetPoint(e);
        if (!Events.dragged && (Events.distance(Events.dragmousex - pt.x, Events.dragmousey - pt.y) < 5)) {
            return;
        }
        Events.dragged = true;
        var dx = pt.x - Events.dragmousex;
        var dy = pt.y - Events.dragmousey;
        Events.dragmousex = pt.x;
        Events.dragmousey = pt.y;
        Events.move3D(ScratchJr.getActiveScript(), dx, dy);
        scroll.refresh();
        e.preventDefault();
    }

    static dragEnd (e) {
        Events.dragged = false;
        e.preventDefault();
        Events.clearEvents();
        scroll.bounceBack();
    }

    //////////////////////
    //
    //////////////////////

    static updateScriptsPageBlocks (list) {
        for (var j = 0; j < list.length; j++) {
            if (!gn(list[j] + '_scripts')) {
                continue;
            }
            var sc = gn(list[j] + '_scripts').owner;
            if (!sc) {
                continue;
            }
            var allblocks = sc.getBlocks();
            for (var i = 0; i < allblocks.length; i++) {
                allblocks[i].updateBlock();
            }
        }
    }
}
