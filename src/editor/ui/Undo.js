//////////////////////////////////
// Undo / Redo Functions
//////////////////////////////////

import ScratchJr from '../ScratchJr';
import Thumbs from './Thumbs';
import Project from './Project';
import Palette from './Palette';
import UI from './UI';
import ScratchAudio from '../../utils/ScratchAudio';
import {newHTML, isTablet, gn} from '../../utils/lib';

let buffer = [];
let index = 0;
let tryCounter;

export default class Undo {
    static init () {
        index = buffer.length;
        Undo.update();
    }

    static setup (p) {
        var div = newHTML('div', 'controlundo', p);
        div.setAttribute('id', 'undocontrols');
        var lib = [['undo', Undo.prevStep], ['redo', Undo.nextStep]];
        for (var i = 0; i < lib.length; i++) {
            Undo.newToggleClicky(div, 'id_', lib[i][0], lib[i][1]);
        }
        Undo.update();
    }

    static newToggleClicky (p, prefix, key, fcn) {
        var div = newHTML('div', key + 'button', p);
        div.setAttribute('type', 'toggleclicky');
        div.setAttribute('id', prefix + key);
        if (fcn) {
            if (isTablet) {
                div.ontouchstart = function (evt) {
                    fcn(evt);
                };
            } else {
                div.onmousedown = function (evt) {
                    fcn(evt);
                };
            }
        }
        return div;
    }

    static record (obj) {
        //console.log ("record", index, JSON.stringify(obj));
        if (ScratchJr.getActiveScript()) {
            ScratchJr.getActiveScript().owner.removeCaret();
        }
        if ((index + 1) <= buffer.length) {
            buffer.splice(index + 1, buffer.length);
        }
        var data = Project.getUndo();
        for (var key in obj) {
            data[key] = obj[key];
        }
        buffer.push(data);
        index++;
        Undo.update();

        // Project change state is usually tracked by looking if a particular action would record an undo
        // We need slightly more specific behavior for story starters, so storyStarted is unaffected here.
        ScratchJr.changed = true;
    }

    //////////////////////////////////
    // Control buttons callbacks
    //
    ////////////////////////////////

    static prevStep (e) {
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        ScratchJr.unfocus();
        ScratchJr.time = e.timeStamp;
        while (index >= buffer.length) {
            index--;
        }
        index--;
        var snd = (index < 0) ? 'boing.wav' : 'tap.wav';
        ScratchAudio.sndFX(snd);
        if (index < 0) {
            index = 0;
        } else {
            Undo.smartRecreate('prev', buffer[index + 1], buffer[index]);
        }
    }

    static nextStep (e) {
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        ScratchJr.unfocus();
        ScratchJr.time = e.timeStamp;
        index++;
        var snd = (index > buffer.length - 1) ? 'boing.wav' : 'tap.wav';
        ScratchAudio.sndFX(snd);
        if (index > buffer.length - 1) {
            index = buffer.length - 1;
        } else {
            Undo.smartRecreate('next', buffer[index], buffer[index]);
        }
    }

    static smartRecreate (cmd, elem, data) {
        ScratchJr.stopStrips();
        var action = elem.action;
        var page = elem.where;
        var spr = elem.who;
        //  console.log (action, page, spr);
        switch (action) {
        case 'pageorder':
            ScratchJr.stage.pages = Undo.getPageOrder(data);
            Undo.recreateAllScripts(data);
            ScratchJr.stage.setPage(gn(data.currentPage).owner, false);
            if (Palette.numcat == 5) {
                Palette.selectCategory(5);
            }
            break;
        case 'changepage':
            ScratchJr.stage.setPage(gn(data.currentPage).owner, false);
            break;
        case 'changebkg':
            gn(page).owner.redoChangeBkg(data);
            break;
        case 'scripts':
            Undo.redoScripts(data, page, spr);
            if (spr && gn(spr)) {
                gn(page).owner.setCurrentSprite(gn(spr).owner); // sets the variables
                Thumbs.selectThisSprite(gn(spr).owner); // sets the UI
                UI.resetSpriteLibrary();
            }
            break;
        case 'deletepage':
        case 'addpage':
            if (data[page]) {
                Undo.copyPage(data, page);
            } else {
                Undo.removePage(data, page);
            }
            break;
        case 'deletesprite':
        case 'copy':
            if (data[page][spr]) {
                Undo.copySprite(data, page, spr);
            } else {
                Undo.removeSprite(data, page, spr);
            }
            break;
        case 'deletesound':
            var sounds = data[page][spr].sounds.concat();
            gn(spr).owner.sounds = sounds;
            Undo.redoScripts(data, page, spr);
            if (Palette.numcat == 3) {
                Palette.selectCategory(3);
            }
            break;
        case 'recordsound':
            spr = gn((data[page][spr]).id).owner;
            if (elem.sound && (spr.sounds.indexOf(elem.sound) > -1)) {
                var indx = spr.sounds.indexOf(elem.sound);
                if (indx > -1) {
                    spr.sounds.splice(indx, 1);
                }
            } else {
                spr.sounds.push(elem.sound);
            }
            if (Palette.numcat == 3) {
                Palette.selectCategory(3);
            }
            break;
        case 'edittext': // sprite delete or add
        case 'modify':
            Undo.removeSprite(data, page, spr);
            if (data[page][spr]) {
                Undo.copySprite(data, page, spr);
            }
            break;
        default:
            Project.clear();
            Undo.recreate(buffer[index]);
            break;
        }
        Undo.update();
    }

    static copyPage (obj, page) {
        var sc = ScratchJr.getSprite() ? gn(ScratchJr.stage.currentPage.currentSpriteName + '_scripts') : undefined;
        if (sc) {
            sc.owner.deactivate();
        }
        Project.recreatePage(page, obj[page], nextStep2);
        function nextStep2 () {
            ScratchJr.stage.pages = Undo.getPageOrder(obj);
            ScratchJr.stage.setPage(gn(obj.currentPage).owner, false);
            Undo.recreateAllScripts(obj);
            var spritename = obj[obj.currentPage].lastSprite;
            if (spritename && gn(spritename)) {
                var spr = gn(spritename).owner;
                var page = spr.div.parentNode.owner;
                page.setCurrentSprite(spr);
                Thumbs.selectThisSprite(spr);
                if (Palette.numcat == 5) {
                    Palette.selectCategory(5);
                }
            }
        }
    }

    static getPageOrder (data) {
        var pages = data.pages;
        var res = [];
        for (var i = 0; i < pages.length; i++) {
            res.push(gn(pages[i]).owner);
        }
        return res;
    }

    static recreateAllScripts (data) {
        for (var n = 0; n < data.pages.length; n++) {
            var page = data[data.pages[n]];
            var sprnames = page.sprites;
            for (var i = 0; i < sprnames.length; i++) {
                var spr = page[sprnames[i]];
                if (!spr) {
                    continue;
                }
                if (spr.type != 'sprite') {
                    continue;
                }
                var sc = gn(spr.id + '_scripts');
                if (!sc) {
                    continue;
                }
                Undo.redoScripts(data, data.pages[n], sprnames[i]);
            }
        }
    }

    static removePage (data, str) {
        if (!gn(str)) {
            return;
        }
        var page = gn(str).owner;
        if (!page) {
            return;
        }
        ScratchJr.stage.removePageBlocks(str);
        ScratchJr.stage.removePage(page);
        ScratchJr.stage.pages = Undo.getPageOrder(data);
        if (ScratchJr.stage.pages.length == 0) {
            Undo.copyPage(data, data.currentPage);
        } else {
            ScratchJr.stage.setViewPage(gn(data.currentPage).owner);
            Thumbs.updateSprites();
            Thumbs.updatePages();
        }
    }

    static redoScripts (data, page, spr) {
        var div = gn(spr + '_scripts');
        while (div.childElementCount > 0) {
            div.removeChild(div.childNodes[0]);
        }
        var sc = div.owner;
        var list = data[page][spr].scripts;
        for (var j = 0; j < list.length; j++) {
            sc.recreateStrip(list[j]);
        }
    }

    static copySprite (data, page, spr) {
        var obj = data[page][spr];
        var fcn = function (spr) {
            if (spr.type == 'sprite') {
                if (page == ScratchJr.stage.currentPage.id) {
                    spr.div.style.visibility = 'visible';
                }
                Undo.setSprite(page, data);
            } else {
                var delta = spr.fontsize * 1.35;
                if (spr.homey == spr.page.textstartat) {
                    spr.page.textstartat += delta;
                }
                Thumbs.updatePages();
            }
        };
        Project.recreateObject(gn(page).owner, spr, obj, fcn, (data[page].lastSprite == spr));
    }

    static setSprite (page, data) {
        Thumbs.updatePages();
        if (page != ScratchJr.stage.currentPage.id) {
            return;
        }
        var pageobj = gn(page).owner;
        var lastspritename = data[page].lastSprite;
        var lastsprite = lastspritename ? gn(lastspritename) : undefined;
        if (!lastsprite) {
            pageobj.setCurrentSprite(undefined);
        } else {
            var cs = lastsprite.owner;
            pageobj.setCurrentSprite(cs);
            UI.needsScroll();
            Thumbs.updateSprites();
        }
    }

    static removeSprite (data, page, spr) {
        if (!gn(spr)) {
            return;
        }
        var sprite = gn(spr).owner;
        var th = sprite.thumbnail;
        ScratchJr.runtime.stopThreadSprite(sprite);
        var pageobj = gn(page).owner;
        var list = JSON.parse(pageobj.sprites);
        var n = list.indexOf(spr);
        list.splice(n, 1);
        pageobj.sprites = JSON.stringify(list);
        gn(spr).parentNode.removeChild(gn(spr));
        if (!gn(spr + '_scripts')) {
            Thumbs.updatePages();
            return;
        }
        var sc = gn(spr + '_scripts');
        if (sc) {
            sc.parentNode.removeChild(sc);
        }
        if (th && th.parentNode) {
            th.parentNode.removeChild(th);
        }
        Undo.setSprite(page, data);
    }

    static recreate (data) {
        Project.mediaCount = 0;
        ScratchJr.stage.pages = [];
        var pages = data.pages;
        if (data.projectsounds) {
            ScratchAudio.projectsounds = data.projectsounds;
        }
        for (var i = 0; i < pages.length; i++) {
            Project.recreatePage(pages[i], data[pages[i]]);
        }
        Undo.loadPage(data.currentPage);
    }

    static loadPage (pageid) {
        var pages = ScratchJr.stage.getPagesID();
        if (pages.indexOf(pageid) < 0) {
            ScratchJr.stage.currentPage = ScratchJr.stage.pages[0];
        } else {
            ScratchJr.stage.currentPage = ScratchJr.stage.getPage(pageid);
        }
        ScratchJr.stage.currentPage.div.style.visibility = 'visible';
        ScratchJr.stage.currentPage.setPageSprites('visible');
        tryCounter = 100;
        if (Project.mediaCount > 0) {
            setTimeout(function () {
                Undo.updateImages();
            }, 20);
        } else {
            Undo.doneLoading();
        }
    }

    static updateImages () {
        tryCounter--;
        var done = (Project.mediaCount < 1) || (tryCounter < 1);
        if (done) {
            Undo.doneLoading();
        } else {
            setTimeout(function () {
                Undo.updateImages();
            }, 20);
        }
    }

    static flashIcon (div, press) {
        div.setAttribute('class', press);
        setTimeout(function () {
            Undo.update();
        }, 1000);
    }

    static doneLoading () {
        Thumbs.updateSprites();
        Thumbs.updatePages();
    }

    static update () {
        if (gn('id_undo')) {
            if (buffer.length == 1) {
                Undo.tunOffButton(gn('id_undo'));
            } else {
                if (index < 1) {
                    Undo.tunOffButton(gn('id_undo'));
                } else {
                    Undo.tunOnButton(gn('id_undo'));
                }
            }
            if (index >= buffer.length - 1) {
                Undo.tunOffButton(gn('id_redo'));
            } else {
                Undo.tunOnButton(gn('id_redo'));
            }
        }
    }

    static tunOnButton (kid) {
        var kclass = kid.getAttribute('class').split(' ')[0];
        kid.setAttribute('class', kclass + ' enable');
    }

    static tunOffButton (kid) {
        var kclass = kid.getAttribute('class').split(' ')[0];
        kid.setAttribute('class', kclass + ' disable');
    }
}
