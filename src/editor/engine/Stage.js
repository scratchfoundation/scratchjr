import ScratchJr from '../ScratchJr';
import Project from '../ui/Project';
import Thumbs from '../ui/Thumbs';
import UI from '../ui/UI';
import Undo from '../ui/Undo';
import ScriptsPane from '../ui/ScriptsPane';
import Rectangle from '../../geom/Rectangle';
import Events from '../../utils/Events';
import ScratchAudio from '../../utils/ScratchAudio';
import Vector from '../../geom/Vector';
import Page from './Page';
import {newHTML, newDiv, gn,
    getIdFor, setProps,
    scaleMultiplier, setCanvasSize,
    globaly, globalx} from '../../utils/lib';

export default class Stage {
    constructor (div) {
        this.currentPage = undefined;
        this.div = newHTML('div', 'stage', div);
        this.div.setAttribute('id', 'stage');
        this.div.style.webkitTextSizeAdjust = '100%';
        this.width = 480;
        this.height = 360;
        this.setStageScaleAndPosition(scaleMultiplier, 46, 74);
        this.pages = [];
        this.pagesdiv = newDiv(this.div, 0, 0, 480, 360, {
            position: 'absolute'
        });
        var me = this;
        this.div.ontouchstart = function (evt) {
            me.mouseDown(evt);
        };
        this.div.owner = this;
        this.currentZoom = 1;
        this.initialPoint = {
            x: 0,
            y: 0
        };
        this.deltaPoint = {
            x: 0,
            y: 0
        };
    }

    setStageScaleAndPosition (scale, x, y) {
        this.stageScale = scale;
        setProps(gn('stage').style, {
            webkitTransform: 'translate(' + (-this.width / 2) + 'px, ' + (-this.height / 2) + 'px) ' +
                'scale(' + scale + ') ' +
                'translate(' + (this.width / 2 + x) + 'px, ' + (this.height / 2 + y) + 'px)'
        });
    }

    getPagesID () {
        var res = [];
        for (var i = 0; i < this.pages.length; i++) {
            res.push(this.pages[i].id);
        }
        return res;
    }

    getPage (id) {
        for (var i = 0; i < this.pages.length; i++) {
            if (this.pages[i].id == id) {
                return this.pages[i];
            }
        }
        return this.pages[0];
    }

    resetPage (obj) {
        var page = obj.div;
        for (var i = 0; i < page.childElementCount; i++) {
            var spr = page.childNodes[i].owner;
            if (!spr) {
                continue;
            }
            if (spr.type == 'sprite') {
                spr.goHome();
            }
        }
    }

    resetPages () {
        for (var i = 0; i < ScratchJr.stage.pages.length; i++) {
            Stage.prototype.resetPage(ScratchJr.stage.pages[i]);
        }
    }


    //goto page


    gotoPage (n) {
        if (n < 1) {
            return;
        }
        if (n > this.pages.length) {
            return;
        }
        if (Events.dragthumbnail && Events.dragthumbnail.owner) {
            return;
        }
        this.setPage(this.pages[n - 1], true);
    }

    setPage (page, isOn) {
        ScratchJr.stopStrips();
        var sc = ScratchJr.getSprite() ? gn(ScratchJr.stage.currentPage.currentSpriteName + '_scripts') : undefined;
        if (sc) {
            sc.owner.deactivate();
        }
        this.currentPage.div.style.visibility = 'hidden';
        this.currentPage.setPageSprites('hidden');
        this.currentPage = page;
        this.currentPage.div.style.visibility = 'visible';
        this.currentPage.setPageSprites('visible');
        //  if (page == obj['currentPage'])	 this.currentPage.currentSpriteName = obj[page]["lastSprite"];
        Thumbs.updateSprites();
        Thumbs.updatePages();
        var spr = ScratchJr.getSprite();
        if (spr) {
            spr.activate();
        }
        if (isOn) {
            this.loadPageThreads();
        }
    }

    loadPageThreads () {
        ScratchJr.blur();
        var page = this.currentPage;
        for (var i = 0; i < page.div.childElementCount; i++) {
            var spr = page.div.childNodes[i].owner;
            if (!spr) {
                continue;
            }
            spr.goHome();
            var sc = gn(spr.id + '_scripts');
            if (!sc) {
                continue;
            }
            var topblocks = sc.owner.getBlocksType(['onflag', 'ontouch']);
            for (var j = 0; j < topblocks.length; j++) {
                var b = topblocks[j];
                ScratchJr.runtime.addRunScript(spr, b);
            }
        }
    }


    //Copy Sprite
    /////////////////////////////////'

    copySprite (el, thumb) {
        ScratchAudio.sndFX('copy.wav');
        Thumbs.overpage(thumb);
        var data = Project.encodeSprite(el.owner);
        if (gn(thumb.owner).owner == this.currentPage) {
            data.xcoor += 10;
            data.ycoor += 10;
            data.homex = data.xcoor;
            data.homey = data.ycoor;
        }
        var a = data.id.split(' ');
        if (Number(a[a.length - 1]).toString() != 'NaN') {
            a.pop();
        }
        var page = gn(thumb.owner).owner;
        var name = getIdFor(a.join(' '));
        data.id = name;
        var stg = this;
        var whenDone = function (spr) {
            if (spr.page.id == ScratchJr.stage.currentPage.id) {
                spr.div.style.visibility = 'visible';
            }
            if (!page.currentSpriteName) {
                page.currentSpriteName = spr.id;
            }
            Thumbs.updateSprites();
            Thumbs.updatePages();
            Undo.record({
                action: 'copy',
                who: name,
                where: gn(thumb.owner).owner.id
            });
            ScratchJr.storyStart('Stage.prototype.copySprite');
        };
        Project.recreateObject(page, name, data, whenDone, page.id == stg.currentPage.id);
    }


    //Delete page


    deletePage (str, data) {
        //  reserve a next id to be able to Undo deleting the first page
        ScratchJr.storyStart('Stage.prototype.deletePage'); // Record a change for sample projects in story-starter mode
        var pageid = getIdFor('page');
        var sprAttr = UI.mascotData();
        var newp = new Object();
        var catid = sprAttr.id;
        newp.sprites = [catid];
        newp.num = 1;
        newp.lastSprite = catid;
        newp[catid] = sprAttr;
        newp.layers = [catid];
        var page = gn(str).owner;
        var indx = this.getPagesID().indexOf(str);
        if (indx < 0) {
            return;
        }
        var form = document.forms.activetextbox;
        var cnv = form.textsprite;
        if (cnv && gn(cnv.id)) {
            ScratchJr.blur();
        }
        this.removePageBlocks(str);
        this.pages.splice(indx, 1);
        if (!data) {
            ScratchAudio.sndFX('cut.wav');
        }
        this.removePage(page);
        if (this.pages.length == 0) {
            var p = new Page(pageid, newp, refreshPage);
            sprAttr.page = p;
        } else {
            if (str == this.currentPage.id) {
                this.setViewPage(this.pages[0]);
            }
            Thumbs.updateSprites();
            Thumbs.updatePages();
            if (!data) {
                Undo.record({
                    action: 'deletepage',
                    where: str,
                    who: str
                });
            }
        }
        function refreshPage () {
            ScratchJr.stage.setViewPage(ScratchJr.stage.currentPage);
            Thumbs.updateSprites();
            Thumbs.updatePages();
            if (!data) {
                Undo.record({
                    action: 'deletepage',
                    where: str,
                    who: str
                });
            }
        }
    }

    setViewPage (page) {
        this.currentPage = page;
        this.currentPage.div.style.visibility = 'visible';
        this.currentPage.setPageSprites('visible');
    }

    removePageBlocks (str) {
        var indx = this.getPagesID().indexOf(str);
        for (var n = 0; n < this.pages.length; n++) {
            var page = this.pages[n];
            for (var i = 0; i < page.div.childElementCount; i++) {
                var spr = page.div.childNodes[i].owner;
                if (!spr) {
                    continue;
                }
                var sc = gn(spr.id + '_scripts');
                if (!sc) {
                    continue;
                }
                var gotoblocks = sc.owner.getBlocksType(['gotopage']);
                for (var j = 0; j < gotoblocks.length; j++) {
                    var b = gotoblocks[j];
                    var pageindex = b.getArgValue() - 1;
                    if (this.pages[pageindex].id == str) {
                        var prev = b.prev;
                        b.detachBlock();
                        b.div.parentNode.removeChild(b.div);
                        if (prev && prev.aStart) {
                            prev.div.parentNode.removeChild(prev.div);
                        }
                    } else if ((b.getArgValue() - 1) > indx) {
                        b.arg.argValue -= 1;
                        this.pages[pageindex].num = b.arg.argValue;
                        b.arg.updateIcon();
                    }
                }
            }
        }
    }


    //Events MouseDown


    mouseDown (e) {
        if (e.touches && (e.touches.length > 1)) {
            return;
        }
        if (ScratchJr.onHold) {
            return;
        }
        e.preventDefault();
        ScratchJr.blur();
        if (!this.currentPage) {
            return;
        }
        if (document.forms.activetextbox.textsprite) {
            return;
        }
        var pt = this.getStagePt(e);
        setCanvasSize(ScratchJr.workingCanvas, 480, 360);
        var ctx = ScratchJr.workingCanvas.getContext('2d');
        var target = (e.target.nodeName == 'CANVAS') ? this.checkShaking(pt, e.target) : e.target;
        if (ScratchJr.shaking && (target.id == 'deletesprite')) {
            this.removeSprite(ScratchJr.shaking.owner);
            return;
        }
        ctx.clearRect(0, 0, 480, 360);
        var hitobj = this.whoIsIt(ctx, pt);
        if (ScratchJr.shaking && hitobj && (hitobj.id == ScratchJr.shaking.id)) { // check grid case
            var sprname = ScratchJr.shaking.id;
            if (((pt.x - gn(sprname).owner.screenLeft()) < 45) && ((pt.y - gn(sprname).owner.screenTop()) < 45)) {
                this.removeSprite(ScratchJr.shaking.owner);
                return;
            }
        }
        if (!hitobj) {
            ScratchJr.clearSelection();
            return;
        }
        if (ScratchJr.shaking) {
            ScratchJr.clearSelection();
        } else {
            this.mouseDownOnSprite(hitobj, pt);
        }
    }

    checkShaking (pt, target) {
        if (!ScratchJr.shaking) {
            return target;
        }
        var dx = globalx(gn('deletesprite')) - globalx(ScratchJr.stage.pagesdiv);
        var dy = globaly(gn('deletesprite')) - globaly(ScratchJr.stage.pagesdiv);
        var w = gn('deletesprite').offsetWidth;
        var h = gn('deletesprite').offsetHeight;
        var rect = new Rectangle(dx, dy, w, h);
        return rect.hitRect(pt) ? gn('deletesprite') : target;
    }

    mouseDownOnSprite (spr, pt) {
        this.initialPoint = {
            x: pt.x,
            y: pt.y
        };
        Events.dragthumbnail = spr.div;
        Events.clearEvents();
        if (!ScratchJr.inFullscreen && ScratchJr.isEditable()) {
            Events.holdit(spr.div, this.startShaking);
        }
        this.setEvents();
    }

    whoIsIt (ctx, pt) {
        var page = this.currentPage.div;
        var spr, pixel;
        for (var i = page.childElementCount - 1; i > -1; i--) {
            spr = page.childNodes[i].owner;
            if (!spr) {
                continue;
            }
            if (!spr.shown) {
                continue;
            }
            spr.stamp(ctx);
            pixel = ctx.getImageData(pt.x, pt.y, 1, 1).data;
            if (pixel[3] != 0) {
                return spr;
            }
        }
        var fuzzy = 5;
        ctx.clearRect(0, 0, 480, 360);
        for (var j = page.childElementCount - 1; j > -1; j--) {
            spr = page.childNodes[j].owner;
            if (!spr) {
                continue;
            }
            if (!spr.shown) {
                continue;
            }
            spr.stamp(ctx);
            spr.stamp(ctx, fuzzy, 0);
            spr.stamp(ctx, 0, fuzzy);
            spr.stamp(ctx, -fuzzy, 0);
            spr.stamp(ctx, 0, -fuzzy);
            pixel = ctx.getImageData(pt.x, pt.y, 1, 1).data;
            if (pixel[3] != 0) {
                return spr;
            }
        }
        return undefined;
    }

    getStagePt (evt) {
        var pt = Events.getTargetPoint(evt);
        var mc = this.div;
        var dx = globalx(mc);
        var dy = globaly(mc);
        pt.x -= dx;
        pt.y -= dy;
        pt.x /= this.stageScale;
        pt.y /= this.stageScale;
        return pt;
    }

    setEvents () {
        var me = this;
        window.ontouchmove = function (evt) {
            me.mouseMove(evt);
        };
        window.ontouchend = function (evt) {
            me.mouseUp(evt);
        };
    }

    startShaking (b) {
        if (!b.owner) {
            return;
        }
        Events.clearEvents();
        ScratchJr.shaking = b;
        ScratchJr.stopShaking = ScratchJr.stage.stopShaking;
        b.owner.startShaking();
    }

    stopShaking (b) {
        if (!b.owner) {
            return;
        }
        b.owner.stopShaking();
        ScratchJr.shaking = undefined;
        ScratchJr.stopShaking = undefined;
    }

    startSpriteDrag () {
        var spr = Events.dragthumbnail.owner;
        spr.threads = ScratchJr.runtime.removeRunScript(spr);
        this.currentPage.div.appendChild(Events.dragthumbnail);
        this.deltaPoint = {
            x: this.initialPoint.x,
            y: this.initialPoint.y
        };
        Events.dragged = true;
        ScratchJr.changed = true;
    }

    mouseMove (e) {
        if (!Events.dragthumbnail) {
            return;
        }
        var pt = this.getStagePt(e);
        var delta = Vector.diff(pt, this.initialPoint);
        var dist = ScratchJr.inFullscreen ? 15 : 5;
        if (!Events.dragged && (Vector.len(delta) > dist)) {
            this.startSpriteDrag(e);
        }
        if (!Events.dragged) {
            return;
        }
        if (Events.timeoutEvent) {
            clearTimeout(Events.timeoutEvent);
        }
        Events.timeoutEvent = undefined;
        var spr = Events.dragthumbnail.owner;
        delta = this.wrapDelta(spr, Vector.diff(pt, this.deltaPoint));
        spr.xcoor += delta.x;
        spr.ycoor += delta.y;
        spr.render();
        this.deltaPoint = {
            x: pt.x,
            y: pt.y
        };
    }

    wrapDelta (spr, delta) {
        if (spr.type == 'text') {
            return this.wrapText(spr, delta);
        } else {
            return this.wrapChar(spr, delta);
        }
    }

    wrapChar (spr, delta) {
        if ((delta.x + spr.xcoor) < 0) {
            delta.x -= (spr.xcoor + delta.x);
        }
        if ((delta.y + spr.ycoor) < 0) {
            delta.y -= (spr.ycoor + delta.y);
        }
        if ((delta.x + spr.xcoor) >= 480) {
            delta.x += (479 - (spr.xcoor + delta.x));
        }
        if ((delta.y + spr.ycoor) >= 360) {
            delta.y += (359 - (spr.ycoor + delta.y));
        }
        return delta;
    }

    wrapText (spr, delta) {
        var max = spr.cx > 480 ? spr.cx : 480;
        var min = spr.cx > 480 ? 480 - spr.cx : 0;
        if ((delta.x + spr.xcoor) <= min) {
            delta.x -= (spr.xcoor + delta.x - min);
        }
        if ((delta.y + spr.ycoor) < 0) {
            delta.y -= (spr.ycoor + delta.y);
        }
        if ((delta.x + spr.xcoor) > max) {
            delta.x += (max - 1 - (spr.xcoor + delta.x));
        }
        if ((delta.y + spr.ycoor) >= 360) {
            delta.y += (359 - (spr.ycoor + delta.y));
        }
        return delta;
    }

    mouseUp (e) {
        var spr = Events.dragthumbnail.owner;
        if (Events.timeoutEvent) {
            clearTimeout(Events.timeoutEvent);
        }
        Events.timeoutEvent = undefined;
        if (!Events.dragged) {
            this.clickOnElement(e, Events.dragthumbnail);
        } else {
            this.moveElementBy(spr);
            if (spr.type == 'sprite') {
                ScratchJr.runtime.threadsRunning = ScratchJr.runtime.threadsRunning.concat(spr.threads);
                ScratchJr.startCurrentPageStrips(['ontouch']);
            }
        }
        Events.clearEvents();
        Events.dragged = false;
        Events.dragthumbnail = undefined;
    }

    moveElementBy (spr) {
        if (!ScratchJr.inFullscreen) {
            spr.homex = spr.xcoor;
            spr.homey = spr.ycoor;
            spr.homeflip = spr.flip;
        }
        Thumbs.updatePages();
    }

    clickOnSprite (e, spr) {
        e.preventDefault();
        ScratchJr.clearSelection();
        ScratchJr.startScriptsFor(spr, ['onclick']);
        ScratchJr.startCurrentPageStrips(['ontouch']);
    }


    //Delete Sprite
    /////////////////////////////////'

    removeSprite (sprite) {
        ScratchJr.shaking = undefined;
        ScratchJr.stopShaking = undefined;
        ScratchAudio.sndFX('cut.wav');
        if (sprite.type == 'text') {
            sprite.deleteText(true);
        } else {
            this.removeCharacter(sprite);
        }
        this.currentPage.updateThumb();
        this.updatePageBlocks();
    }

    removeCharacter (spr) {
        ScratchJr.runtime.stopThreadSprite(spr);
        this.removeFromPage(spr);
        Undo.record({
            action: 'deletesprite',
            who: spr.id,
            where: ScratchJr.stage.currentPage.id
        });
        ScratchJr.storyStart('Stage.prototype.removeCharacter');
        Thumbs.updateSprites();
    }

    updatePageBlocks () {
        for (var i = 0; i < ScratchJr.stage.pages.length; i++) {
            var page = ScratchJr.stage.pages[i];
            ScriptsPane.updateScriptsPageBlocks(JSON.parse(page.sprites));
        }
    }

    removeFromPage (spr) {
        var id = spr.id;
        var sc = gn(id + '_scripts');
        var page = this.currentPage;
        var list = JSON.parse(page.sprites);
        var n = list.indexOf(id);
        if (n < 0) {
            return;
        }
        var th = spr.thumbnail;
        var sprite = ScratchJr.getSprite();
        ScratchAudio.sndFX('cut.wav');
        list.splice(n, 1);
        spr.div.parentNode.removeChild(spr.div);
        if (sc) {
            sc.parentNode.removeChild(sc);
        }
        page.sprites = JSON.stringify(list);
        th.parentNode.removeChild(th);
        if (sprite && (sprite.id == spr.id)) {
            var sprites = page.getSprites();
            page.setCurrentSprite((sprites.length > 0) ? gn(sprites[0]).owner : undefined);
        }
    }

    renumberPageBlocks (list) {
        var pages = this.getPagesID();
        for (var n = 0; n < this.pages.length; n++) {
            var page = this.pages[n];
            for (var i = 0; i < page.div.childElementCount; i++) {
                var spr = page.div.childNodes[i].owner;
                if (!spr) {
                    continue;
                }
                var sc = gn(spr.id + '_scripts');
                if (!sc) {
                    continue;
                }
                var gotoblocks = sc.owner.getBlocksType(['gotopage']);
                for (var j = 0; j < gotoblocks.length; j++) {
                    var b = gotoblocks[j];
                    var indx = b.getArgValue() - 1;
                    b.arg.argValue = pages.indexOf(list[indx]) + 1;
                    b.updateBlock();
                }
            }
        }
    }

    clickOnElement (e, spr) {
        if (spr.owner.type == 'text') {
            if (!ScratchJr.inFullscreen) {
                spr.owner.clickOnText(e);
            }
        } else if (spr.owner.type == 'sprite') {
            this.clickOnSprite(e, spr.owner);
        }
    }


    //Stage clear
    ///////////////////////////////////////

    clear () {
        for (var i = 0; i < this.pages.length; i++) {
            this.removePage(this.pages[i]);
        }
        this.pages = [];
        while (this.pagesdiv.childElementCount > 0) {
            this.pagesdiv.removeChild(this.pagesdiv.childNodes[0]);
        }
    }

    removePage (p) {
        var list = JSON.parse(p.sprites);
        for (var j = 0; j < list.length; j++) {
            var name = list[j];
            var sprite = gn(name);
            var sc = gn(name + '_scripts');
            if (sc) {
                sc.parentNode.removeChild(sc);
            }
            sprite.parentNode.removeChild(sprite);
        }
        p.div.parentNode.removeChild(p.div);
    }


    //Debugging hit masks
    ///////////////////////////

    sd () {
        var stg = gn('stage');
        var mask = newDiv(gn('stageframe'), stg.offsetLeft + 1, stg.offsetTop + 1, 482, 362,
            {
                position: 'absolute',
                zIndex: ScratchJr.layerTop + 20,
                visibility: 'hidden'
            });
        mask.setAttribute('id', 'pagemask');
        mask.appendChild(ScratchJr.workingCanvas);
    }

    on () {
        gn('pagemask').style.visibility = 'visible';
    }

    off () {
        gn('pagemask').style.visibility = 'hidden';
    }

    sm (spr) {
        var stg = gn('stage');
        var w = spr.outline.width;
        var h = spr.outline.height;
        var mask = newDiv(gn('stageframe'), stg.offsetLeft + 1, stg.offsetTop + 1, w, h,
            {
                position: 'absolute',
                zIndex: ScratchJr.layerTop + 20,
                visibility: 'hidden'
            });
        mask.setAttribute('id', 'spritemask');
        mask.appendChild(spr.outline);
    }

    son () {
        gn('spritemask').style.visibility = 'visible';
    }

    soff () {
        gn('spritemask').style.visibility = 'hidden';
    }
}
