//////////////////////////////////////////////////
// Home Screen
//////////////////////////////////////////////////

import {libInit, getUrlVars, gn, isAndroid, newHTML} from '../utils/lib';
import ScratchAudio from '../utils/ScratchAudio';
import iOS from '../iPad/iOS';
import Localization from '../utils/Localization';
import Cookie from '../utils/Cookie';

import Home from './Home';
import Samples from './Samples';

let version = undefined;
let busy = false;
let errorTimer;
const host = 'inapp/';
let currentPage = null;

export default class Lobby {
    // Getters/setters for properties used in other classes
    static get version () {
        return version;
    }

    static set busy (newBusy) {
        busy = newBusy;
    }

    static get errorTimer () {
        return errorTimer;
    }

    static appinit (v) {
        libInit();
        version = v;
        var urlvars = getUrlVars();
        var place = urlvars.place;
        ScratchAudio.addSound('sounds/', 'tap.wav', ScratchAudio.uiSounds);
        ScratchAudio.addSound('sounds/', 'cut.wav', ScratchAudio.uiSounds);
        ScratchAudio.init();
        Lobby.setPage(place ? place : 'home');

        if (window.Settings.settingsPageDisabled) {
            gn('settings').style.visibility = 'hidden';
        }

        gn('hometab').ontouchstart = function () {
            if (gn('hometab').className != 'home on') {
                Lobby.setPage('home');
            }
        };
        gn('helptab').ontouchstart = function () {
            if (gn('helptab').className != 'help on') {
                Lobby.setPage('help');
            }
        };
        gn('booktab').ontouchstart = function () {
            if (gn('booktab').className != 'book on') {
                Lobby.setPage('book');
            }
        };
        gn('geartab').ontouchstart = function () {
            if (gn('geartab').className != 'gear on') {
                Lobby.setPage('gear');
            }
        };
        gn('abouttab').ontouchstart = function () {
            if (gn('abouttab').className != 'tab on') {
                Lobby.setSubMenu('about');
            }
        };
        gn('interfacetab').ontouchstart = function () {
            if (gn('interfacetab').className != 'tab on') {
                Lobby.setSubMenu('interface');
            }
        };
        gn('painttab').ontouchstart = function () {
            if (gn('painttab').className != 'tab on') {
                Lobby.setSubMenu('paint');
            }
        };
        gn('blockstab').ontouchstart = function () {
            if (gn('booktab').className != 'tab2 on') {
                Lobby.setSubMenu('blocks');
            }
        };
        if (isAndroid) {
            AndroidInterface.notifyDoneLoading();
        }
    }

    static setPage (page) {
        if (busy) {
            return;
        }
        if (gn('hometab').className == 'home on') {
            var doNext = function (page) {
                Lobby.changePage(page);
            };
            iOS.setfile('homescroll.sjr', gn('wrapc').scrollTop, function () {
                doNext(page);
            });
        } else {
            Lobby.changePage(page);
        }
    }

    static changePage (page) {
        Lobby.selectButton(page);
        document.documentElement.scrollTop = 0;
        var div = gn('wrapc');
        while (div.childElementCount > 0) {
            div.removeChild(div.childNodes[0]);
        }
        switch (page) {
        case 'home':
            busy = true;
            ScratchAudio.sndFX('tap.wav');
            Lobby.loadProjects(div);
            break;
        case 'help':
            busy = true;
            ScratchAudio.sndFX('tap.wav');
            Lobby.loadSamples(div);
            break;
        case 'book':
            Lobby.loadGuide(div);
            break;
        case 'gear':
            ScratchAudio.sndFX('tap.wav');
            Lobby.loadSettings(div);
            break;
        default:
            break;
        }
        currentPage = page;
    }

    static loadProjects (p) {
        document.ontouchmove = undefined;
        gn('topsection').className = 'topsection home';
        gn('tabheader').textContent = Localization.localize('MY_PROJECTS');
        gn('subtitle').textContent = '';
        gn('footer').className = 'footer off';
        gn('wrapc').scrollTop = 0;
        gn('wrapc').className = 'contentwrap scroll';
        var div = newHTML('div', 'htmlcontents home', p);
        div.setAttribute('id', 'htmlcontents');
        Home.init();
    }

    static loadSamples (p) {
        gn('topsection').className = 'topsection help';
        gn('tabheader').textContent = Localization.localize('QUICK_INTRO');
        gn('subtitle').textContent = Localization.localize('SAMPLE_PROJECTS');
        gn('footer').className = 'footer off';
        gn('wrapc').scrollTop = 0;
        gn('wrapc').className = 'contentwrap noscroll';
        var div = newHTML('div', 'htmlcontents help', p);
        div.setAttribute('id', 'htmlcontents');
        document.ontouchmove = function (e) {
            e.preventDefault();
        };
        Samples.init();
    }

    static loadGuide (p) {
        gn('topsection').className = 'topsection book';
        gn('footer').className = 'footer on';
        var div = newHTML('div', 'htmlcontents home', p);
        div.setAttribute('id', 'htmlcontents');
        setTimeout(function () {
            Lobby.setSubMenu('about');
        }, 250);
    }

    static loadSettings (p) {
        // loadProjects without the header
        gn('topsection').className = 'topsection book';
        gn('footer').className = 'footer off';
        gn('wrapc').scrollTop = 0;
        gn('wrapc').className = 'contentwrap scroll';
        var div = newHTML('div', 'htmlcontents settings', p);
        div.setAttribute('id', 'htmlcontents');

        // Localization settings
        var title = newHTML('h1', 'localizationtitle', div);
        title.textContent = Localization.localize('SELECT_LANGUAGE');

        var languageButtons = newHTML('div', 'languagebuttons', div);

        var languageButton;
        for (var l in window.Settings.supportedLocales) {
            var selected = '';
            if (window.Settings.supportedLocales[l] == Localization.currentLocale) {
                selected = ' selected';
            }
            languageButton = newHTML('div', 'localizationselect' + selected, languageButtons);
            languageButton.textContent = l;

            languageButton.ontouchstart = function (e) {
                ScratchAudio.sndFX('tap.wav');
                let newLocale = window.Settings.supportedLocales[e.target.textContent];
                Cookie.set('localization', newLocale);
                iOS.analyticsEvent('lobby', 'language_changed', newLocale);
                window.location = '?place=gear';
            };
        }
    }

    static setSubMenu (page) {
        if (busy) {
            return;
        }
        document.ontouchmove = undefined;
        busy = true;
        ScratchAudio.sndFX('tap.wav');
        Lobby.selectSubButton(page);
        document.documentElement.scrollTop = 0;
        gn('wrapc').scrollTop = 0;
        var div = gn('wrapc');
        while (div.childElementCount > 0) {
            div.removeChild(div.childNodes[0]);
        }
        var url;
        switch (page) {
        case 'about':
            url = host + 'about.html';
            Lobby.loadLink(div, url, 'contentwrap scroll', 'htmlcontents scrolled');
            break;
        case 'interface':
            document.ontouchmove = function (e) {
                e.preventDefault();
            };
            url = host + 'interface.html';
            Lobby.loadLink(div, url, 'contentwrap noscroll', 'htmlcontents fixed');
            break;
        case 'paint':
            document.ontouchmove = function (e) {
                e.preventDefault();
            };
            url = host + 'paint.html';
            Lobby.loadLink(div, url, 'contentwrap noscroll', 'htmlcontents fixed');
            break;
        case 'blocks':
            url = host + 'blocks.html';
            Lobby.loadLink(div, url, 'contentwrap scroll', 'htmlcontents scrolled');
            break;
        default:
            Lobby.missing(page, div);
            break;
        //url =  Lobby.loadProjects(div); break;
        }
    }

    static selectSubButton (str) {
        var list = ['about', 'interface', 'paint', 'blocks'];
        for (var i = 0; i < list.length; i++) {
            var kid = gn(list[i] + 'tab');
            var cls = kid.className.split(' ')[0];
            kid.className = cls + ((list[i] == str) ? ' on' : ' off');
        }
    }

    static selectButton (str) {
        var list = ['home', 'help', 'book', 'gear'];
        for (var i = 0; i < list.length; i++) {
            if (str == list[i]) {
                gn(list[i] + 'tab').className = list[i] + ' on';
            } else {
                gn(list[i] + 'tab').className = list[i] + ' off';
            }
        }
    }

    static loadLink (p, url, css, css2) {
        document.documentElement.scrollTop = 0;
        gn('wrapc').scrollTop = 0;
        gn('wrapc').className = css;
        var iframe = newHTML('iframe', 'htmlcontents', p);
        iframe.setAttribute('id', 'htmlcontents');
        gn('htmlcontents').className = css2;
        gn('htmlcontents').src = url;
        gn('htmlcontents').onload = function () {
            if (errorTimer) {
                clearTimeout(errorTimer);
            }
            errorTimer = undefined;
            busy = false;
            gn('wrapc').scrollTop = 0;
        };
        errorTimer = window.setTimeout(function () {
            Lobby.errorLoading('Loading timeout');
        }, 20000);
    }

    static errorLoading (str) {
        if (errorTimer) {
            clearTimeout(errorTimer);
        }
        errorTimer = undefined;
        var wc = gn('wrapc');
        while (wc.childElementCount > 0) {
            wc.removeChild(wc.childNodes[0]);
        }
        var div = newHTML('div', 'htmlcontents', wc);
        div.setAttribute('id', 'htmlcontents');
        var ht = newHTML('div', 'errormsg', div);
        var h = newHTML('h1', undefined, ht);
        h.textContent = str;
        busy = false;
    }

    static missing (page, p) {
        gn('wrapc').className = 'contentwrap scroll';
        var div = newHTML('div', 'htmlcontents', p);
        div.setAttribute('id', 'htmlcontents');
        div = newHTML('div', 'errormsg', div);
        var h = newHTML('h1', undefined, div);
        h.textContent = page.toUpperCase() + ': UNDER CONSTRUCTION';
        busy = false;
    }

    static goHome () {
        if (currentPage === 'home') {
            window.location.href = 'index.html?back=true';
        } else {
            Lobby.setPage('home');
        }
    }
}
