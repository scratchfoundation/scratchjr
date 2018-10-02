///////////////////////////////////////////////
//  Scripts
///////////////////////////////////////////////

import ScratchJr from '../ScratchJr';
import Block from '../blocks/Block';
import BlockSpecs from '../blocks/BlockSpecs';
import ScriptsPane from './ScriptsPane';
import Events from '../../utils/Events';
import ScratchAudio from '../../utils/ScratchAudio';
import {gn, newHTML, setCanvasSize, setProps,
    localx, localy, scaleMultiplier, hit3DRect, isTablet} from '../../utils/lib';

export default class Scripts {
    constructor (spr) {
        this.flowCaret = null;
        this.spr = spr;
        this.dragList = [];
        var dc = gn('scriptscontainer');
        this.sc = newHTML('div', 'look', dc);
        setCanvasSize(this.sc, dc.offsetWidth, dc.offsetHeight);
        this.sc.setAttribute('id', spr.id + '_scripts');
        this.sc.setAttribute('class', 'look');
        this.sc.owner = this;
        this.sc.top = 0;
        this.sc.left = 0;
    }

    activate () {
        setProps(this.sc.style, {
            visibility: 'visible'
        });
    }

    deactivate () {
        setProps(this.sc.style, {
            visibility: 'hidden'
        });
    }

    ////////////////////////////////////////////////
    //  Events MouseDown
    ////////////////////////////////////////////////

    scriptsMouseDown (e) {
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        if (ScratchJr.onHold) {
            return;
        }
        if (window.event) {
            t = window.event.srcElement;
        } else {
            t = e.target;
        }
        if ((t.nodeName == 'H3') && (t.owner == ScratchJr.activeFocus)) {
            return;
        } // editing the current field
        ScratchJr.clearSelection();
        if (t.nodeName == 'H3') {
            ScratchJr.blur();
            ScratchJr.editArg(e, t);
            return;
        }

        if (t.firstChild && t.firstChild.nodeName == 'H3') {
            ScratchJr.blur();
            ScratchJr.editArg(e, t.firstChild);
            return;
        }

        ScratchJr.unfocus(e);
        var sc = ScratchJr.getActiveScript();
        var spt = Events.getTargetPoint(e);
        var pt = {
            x: localx(sc, spt.x),
            y: localy(sc, spt.y)
        };
        for (var i = sc.childElementCount - 1; i > -1; i--) {
            var ths = sc.childNodes[i];
            if (!ths.owner) {
                continue;
            }
            if (ths.owner.isCaret) {
                continue;
            }
            if (!hit3DRect(ths, pt)) {
                continue;
            }
            var t = new WebKitCSSMatrix(window.getComputedStyle(ths).webkitTransform);
            // This line was causing repeat blocks to only drag when touched in the front and top
            // It seems to have been checking if the drag was on the invisible shadow of the repeat block
            // It's not clear to me why we would want this, and seems functional without it. -- TM
            //if ((ths.owner.blocktype == "repeat") && !hitTest(ths.childNodes[1], pixel)) continue;
            Events.startDrag(e, ths, ScriptsPane.prepareToDrag,
                ScriptsPane.dropBlock, ScriptsPane.draggingBlock, ScriptsPane.runBlock);
            return;
        }
        ScriptsPane.dragBackground(e);
    }

    ////////////////////////////////////////////////
    //  Events MouseUP
    ////////////////////////////////////////////////

    addBlockToScripts (b, dx, dy) {
        if ((this.flowCaret != null) && (this.flowCaret.div.parentNode == this.sc)) {
            this.sc.removeChild(this.flowCaret.div);
        }
        this.flowCaret = null;
        Events.dragDiv.removeChild(b);
        this.sc.appendChild(b);
        //  b.owner.drop();
        b.owner.moveBlock(dx, dy);
        for (var i = 1; i < this.dragList.length; i++) {
            var piece = this.dragList[i].div;
            piece.parentNode.removeChild(piece);
            this.sc.appendChild(piece);
        //   piece.owner.drop();
        }
        this.layout(b.owner);
        this.snapToPlace(this.dragList);
        if (b.owner.cShape) {
            this.sendToBack(b.owner);
        }
        this.dragList = [];
    }


    sendToBack (b) {
        if (!b.inside) {
            return;
        }
        var you = b.inside;
        while (you != null) {
            var p = you.div.parentNode;
            p.appendChild(you.div);
            if (you.cShape) {
                this.sendToBack(you);
            }
            you = you.next;
        }
        this.layout(b);
    }

    snapToPlace (drag) {
        if ((drag.length < 2) && drag[0].cShape) {
            this.snapCshape(drag);
        } else {
            this.snapBlock(drag);
        }
    }

    snapBlock (drag) {
        var me = drag[0];
        var last = me.findLast();
        var res = this.findClosest(this.available(0, me, drag), me);
        if (this.isValid(me, res, 0)) {
            this.snapToDock(res, me, 0, drag);
            return;
        }
        res = this.findClosest(this.available(last.cShape ? 2 : 1, last, drag), last);
        if (!this.isValid(last, res, last.cShape ? 2 : 1)) {
            return;
        }
        this.snapToDock(res, last, last.cShape ? 2 : 1, drag);
    }

    snapCshape (drag) {
        var me = drag[0];
        var last = me.findLast();
        var res = this.findClosest(this.available(0, me, drag), me);
        if (this.isValid(me, res, 0)) {
            this.snapToDock(res, me, 0, drag);
            return;
        }
        var allowInside = me.isCaret ? (this.dragList[0].inside == null) : (me.inside == null);
        if (allowInside) {
            res = this.findClosest(this.available(1, me, drag), me);
            if (this.isValid(me, res, 1)) {
                this.snapToDock(res, me, 1, drag);
                return;
            }
        }
        res = this.findClosest(this.available(2, last, drag), last);
        if (this.isValid(me, res, 2)) {
            this.snapToDock(res, last, 2, drag);
        }
    }

    isValid (me, res, myn) {
        if (res == null) {
            return false;
        }
        var you = res[0];
        var yourn = res[1];
        if (res[2] > 30) {
            return false;
        }
        if (me.cShape && (myn == 1) && you.anEnd) {
            return false;
        }
        if (me.anEnd && (you.next != null)) {
            return false;
        }
        if (me.findFirst().aStart && (you.prev != null)) {
            return false;
        } // a strip starting with a start cannot be inserted between 2 blocks
        if ((myn == 0) && me.findLast().anEnd &&
            (((you.blocktype == 'repeat') && (yourn == 1)) || this.insideCShape(you))) {
            return false;
        }
        if (me.findLast().anEnd && (you.next != null)) {
            return false;
        }
        if (me.findLast().anEnd && you.findLast().anEnd) {
            return false;
        }
        return true;
    }



    insideCShape (you) {
        while (you != null) {
            var next = you.prev;
            if (next == null) {
                return false;
            }
            var docknum = next.getMyDockNum(you);
            if (next.cShape && (docknum == 1)) {
                return true;
            }
            you = next;
        }
        return false;
    }

    snapToDock (choice, me, place, drag) {
        if (choice == null) {
            return;
        }
        if (me.blocktype.indexOf('caret') < 0) {
            ScratchJr.storyStart('Scripts.snapToDock');
            ScratchAudio.sndFX('snap.wav');
        }
        var you = choice[0];
        var yourn = choice[1];
        var bestxy;
        if (me.cShape && (place == 1)) {
            var res = this.getDockDxDy(you, yourn, me, place);
            bestxy = [res[0], res[1]];
        } else {
            bestxy = this.getDockDxDy(you, yourn, me, place);
        }
        if (me.isCaret) {
            me.div.style.visibility = 'visible';
        }
        for (var i = 0; i < drag.length; i++) {
            drag[i].moveBlock(drag[i].div.left + bestxy[0], drag[i].div.top + bestxy[1]);
        }
        me.connectBlock(place, choice[0], choice[1]);
    }

    available (myn, me, drag) {
        var thisxy = null;
        var res = [];
        var you = null;
        var allblocks = this.getBlocks();
        for (var i = 0; i < allblocks.length; i++) {
            you = allblocks[i];
            if (you == null) {
                continue;
            }
            if (you == me) {
                continue;
            }
            if (you.isCaret) {
                continue;
            }
            if (you.isReporter) {
                continue;
            }
            if (you.div.style.visibility == 'hidden') {
                continue;
            }
            if (drag.indexOf(you) == -1) {
                var yourdocks = you.resolveDocks();
                for (var yourn = 0; yourn < yourdocks.length; yourn++) {
                    thisxy = this.getDockDxDy(you, yourn, me, myn);
                    if (thisxy != null) {
                        res.push([you, yourn, this.magnitude(thisxy)]);
                    }
                }
            }
        }
        return res;
    }

    magnitude (p) {
        var x = p[0];
        var y = p[1];
        return Math.sqrt((x * x) + (y * y));
    }

    findClosest (choices) {
        var min = 9999;
        var item = null;
        for (var i = 0; i < choices.length; i++) {
            var c = choices[i];
            if (c[2] < min) {
                min = c[2];
                item = c;
            }
        }
        return item;
    }

    getDockDxDy (b1, n1, b2, n2) {
        var d1 = (b1.resolveDocks())[n1];
        var d2 = (b2.resolveDocks())[n2];
        if (b1 == b2) {
            return null;
        } // same block
        if ((d1 == null) || (d2 == null)) {
            return null;
        } // no block
        if (d1[0] != d2[0]) {
            return null;
        } //  not the same type of notch like "flow"
        if (d1[1] == d2[1]) {
            return null;
        } // not an "inny" with and "outie" (both true)
        var x1 = b1.div.left + d1[2] * b1.scale;
        var y1 = b1.div.top + d1[3] * b1.scale;
        var x2 = b2.div.left + d2[2] * b2.scale;
        var y2 = b2.div.top + d2[3] * b2.scale;
        return [x1 - x2, y1 - y2];
    }

    layout (block) {
        var first = block.findFirst();
        this.layoutStrip(first);
    }

    layoutStrip (b) {
        while (b != null) {
            if (b.cShape) {
                this.layoutCshape(b);
            }
            this.layoutNextBlock(b);
            b = b.next;
        }
    }

    layoutNextBlock (b) {
        if (b.next != null) {
            var you = b.next;
            var bestxy = this.getDockDxDy(b, b.cShape ? 2 : 1, you, 0);
            if (bestxy == null) {
                return;
            }
            you.moveBlock(you.div.left + bestxy[0], you.div.top + bestxy[1]);
        }
    }

    layoutCshape (b) {
        var inside = 0;
        var maxh = 0;
        var oldh = b.hrubberband;
        var cblock = b.inside;
        if (cblock != null) {
            this.adjustPos(cblock, 0, b, 1);
            this.layoutStrip(cblock);
            inside += this.adjustCinside(cblock);
            maxh += this.adjustCheight(cblock);
        }
        oldh = b.vrubberband;
        b.vrubberband = (maxh < 0) ? 0 : maxh;
        b.hrubberband = inside;
        b.redrawRepeat();
        b.moveBlock(b.div.left, b.div.top + (oldh - b.vrubberband) * b.scale);
    }

    adjustPos (me, myn, you, yourn) {
        var bestxy = this.getDockDxDy(you, yourn, me, myn);
        me.moveBlock(me.div.left + bestxy[0], me.div.top + bestxy[1]);
    }

    adjustCheight (b) {
        var old = b;
        var h = b.blockshape.height;
        b = b.next;
        while (b != null) {
            if (b.blockshape.height > h) {
                h = b.blockshape.height;
            }
            b = b.next;
        }
        h /= (old.scale * window.devicePixelRatio);
        return (h > 66) ? h - 66 : 0;
    }

    adjustCinside (b) {
        var first = b;
        var last = b;
        while (b != null) {
            last = b;
            b = b.next;
        }
        var w = last.blockshape.width / last.scale / window.devicePixelRatio +
            (last.div.left - first.div.left) / last.scale;
        return w - (last.cShape ? 76 : 76);
    }

    getBlocks () {
        var res = [];
        var sc = this.sc;
        for (var i = 0; i < sc.childElementCount; i++) {
            var b = sc.childNodes[i].owner;
            if (!b) {
                continue;
            }
            if (b.type != 'block') {
                continue;
            }
            if (b.isCaret) {
                continue;
            }
            res.push(b);
        }
        return res;
    }

    findGroup (b) {
        if (b.type != 'block') {
            return [];
        }
        var res = [];
        return this.findingGroup(res, b);
    }

    findingGroup (res, b) {
        while (b != null) {
            res.push(b);
            if (b.cShape) {
                this.findingGroup(res, b.inside);
            }
            b = b.next;
        }
        return res;
    }

    gettopblocks () {
        var list = this.getBlocks();
        var res = [];
        for (var n = 0; n < list.length; n++) {
            if ((list[n].prev == null) && !list[n].isReporter) {
                res.push(list[n]);
            }
            if ((list[n].isReporter) && (list[n].daddy = null)) {
                res.push(list[n]);
            }
        }
        return res;
    }

    // A version of gettopblocks that also returns strips which
    // may be currently starting with a caret and blocks in the dragDiv
    getEncodableBlocks () {
        var list = [];
        var sc = this.sc;
        for (var i = 0; i < sc.childElementCount; i++) {
            var b = sc.childNodes[i].owner;
            if (!b || b.type != 'block') {
                continue;
            }
            list.push(b);
        }

        var res = [];
        for (var n = 0; n < list.length; n++) {
            if (list[n].prev == null) res.push(list[n]);
        }
        return res;
    }

    redisplay () {
        var list = this.gettopblocks();
        for (var n = 0; n < list.length; n++) {
            this.layout(list[n]);
        }
    }

    getBlocksType (list) {
        var res = [];
        var blocks = this.getBlocks();
        for (var i = 0; i < list.length; i++) {
            var key = list[i];
            for (var n = 0; n < blocks.length; n++) {
                if (key == blocks[n].blocktype) {
                    res.push(blocks[n]);
                }
            }
        }
        return res;
    }

    prepareCaret (b) { // Block data structure
        var last = b.findLast();
        var bt = this.getCaretType(last);
        if (this.flowCaret != null) {
            this.sc.removeChild(this.flowCaret.div);
        }
        this.flowCaret = null;
        if (bt == null) {
            return;
        } // don't have a caret
        this.flowCaret = this.newCaret(bt);
        this.flowCaret.isCaret = true;
    }

    newCaret (bt) { // Block data structure
        var parent = this.sc;
        var bbx = new Block(BlockSpecs.defs[bt], false, scaleMultiplier);
        setProps(bbx.div.style, {
            position: 'absolute',
            left: '0px',
            top: '0px',
            visibility: 'hidden',
            zIndex: 10
        });
        parent.appendChild(bbx.div);
        bbx.moveBlock(0, 0);
        return bbx;
    }

    ////////////////////////////////////////////
    // Caret
    ///////////////////////////////////////////

    getCaretType (b) {
        if (this.dragList[0].aStart) {
            return 'caretstart';
        }
        if (b.anEnd) {
            return 'caretend';
        }
        if ((this.dragList.length < 2) && this.dragList[0].cShape) {
            return 'caretrepeat';
        }
        return 'caretcmd';
    }

    ////////////////////////////////////////////////
    //  Events MouseMove
    ////////////////////////////////////////////////

    removeCaret () {
        if (this.flowCaret == null) {
            return;
        }
        var before = this.flowCaret.prev;
        var after = this.flowCaret.next;
        var inside = this.flowCaret.inside;
        this.flowCaret.prev = null;
        this.flowCaret.next = null;
        this.flowCaret.inside = null;
        var n;
        if (after != null) {
            n = after.getMyDockNum(this.flowCaret);
            after.setMyDock(n, (inside != null) ? inside.findLast() : before);
            if ((inside == null) && (before == null)) {
                this.layout(after);
            }
        }
        if (inside != null) {
            n = inside.getMyDockNum(this.flowCaret);
            inside.setMyDock(n, before);
            if (after != null) {
                inside.findLast().next = after;
            }
            if (before == null) {
                this.layout(inside);
            }
        }
        if (before != null) {
            n = before.getMyDockNum(this.flowCaret);
            before.setMyDock(n, (inside != null) ? inside : after);
            this.layout(before);
        }
        if (this.flowCaret.cShape) {
            this.flowCaret.vrubberband = 0;
            this.flowCaret.hrubberband = 0;
            this.flowCaret.redrawRepeat();
        }
        this.flowCaret.div.style.visibility = 'hidden';
    }

    insertCaret (x, y) {
        if (this.flowCaret == null) {
            return;
        }
        var sc = ScratchJr.getActiveScript();
        var dx = localx(sc, x);
        var dy = localy(sc, y) + this.adjustCheight(this.dragList[0]);
        this.flowCaret.moveBlock(dx, dy);
        this.snapToPlace(new Array(this.flowCaret));
        if (this.flowCaret.div.style.visibility == 'visible') {
            this.layout(this.flowCaret);
        }
    }

    deleteBlocks () {
        ScratchJr.storyStart('Scripts.prototype.deleteBlocks');
        ScriptsPane.cleanCarets();
        ScratchAudio.sndFX('cut.wav');
        if (this.dragList.length > 0) {
            ScratchJr.runtime.stopThreadBlock(this.dragList[0].findFirst());
        }
        for (var i = 0; i < this.dragList.length; i++) {
            var b = this.dragList[i];
            if (b.blocktype == undefined) {
                continue;
            }
            b.div.parentNode.removeChild(b.div);
        }
    }

    recreateStrip (list) {
        var res = [];
        var b = null;
        var loops = ['repeat'];
        for (var i = 0; i < list.length; i++) {
            if (!BlockSpecs.defs[list[i][0]]) {
                continue;
            }
            switch (list[i][0]) {
            case 'say':
                list[i][1] = unescape(list[i][1]);
                break;
            case 'gotopage':
                var n = ScratchJr.stage.pages.indexOf(this.spr.page);
                if ((list[i][1] - 1) == n) {
                    list[i][1] = ((n + 1) % ScratchJr.stage.pages.length) + 1;
                }
                break;
            case 'playusersnd':
                if (this.spr.sounds.length <= list[i][1]) {
                    list[i][0] = 'playsnd';
                    list[i][1] = this.spr.sounds[0];
                }
                break;
            case 'playsnd':
                var snd = this.spr.sounds.indexOf(list[i][1]);
                if (snd < 0) {
                    list[i][0] = 'playsnd';
                    list[i][1] = this.spr.sounds[0];
                }
                break;
            }
            var cb = this.recreateBlock(list[i]);
            res.push(cb);
            if (loops.indexOf(cb.blocktype) > -1) {
                var strip = this.recreateStrip(list[i][4]);
                if (strip.length > 0) {
                    cb.inside = strip[0];
                    strip[0].prev = cb;
                }
                cb.redrawRepeat();
            }
            if (b) {
                cb.prev = b;
                b.next = cb;
            }
            b = cb;
        }
        if (res.length > 0) {
            this.layout(res[0]);
        }
        return res;
    }


    /////////////////////////////////
    // Load
    ////////////////////////////////

    recreateBlock (data) {
        var op = data[0];
        var val = data[1] == 'null' ? null : data[1];
        var dx = data[2];
        var dy = data[3];
        var spec = BlockSpecs.defs[op].concat();
        if (val != null) {
            spec.splice(4, 1, val);
        }
        var bbx = new Block(spec, false, scaleMultiplier);
        setProps(bbx.div.style, {
            position: 'absolute',
            left: '0px',
            top: '0px'
        });
        bbx.moveBlock(dx * scaleMultiplier, dy * scaleMultiplier);
        this.sc.appendChild(bbx.div);
        bbx.update(this.spr);
        return bbx;
    }
}
