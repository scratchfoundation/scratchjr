//////////////////////////////////////////////////
// Home Screen
//////////////////////////////////////////////////

var Lobby = function () {};
Lobby.version = undefined;
Lobby.busy = false;
Lobby.errorTimer;
Lobby.spinnerTimer = undefined;
Lobby.host = 'inapp/';
Lobby.currentPage = null;

Lobby.appinit = function (v) {
    libInit();
    Lobby.version = v;
    var urlvars = getUrlVars();
    var place = urlvars.place;
    ScratchAudio.addSound('sounds/', 'tap.wav', ScratchAudio.uiSounds);
    ScratchAudio.addSound('sounds/', 'cut.wav', ScratchAudio.uiSounds);
    ScratchAudio.init();
    Lobby.setPage(place ? place : 'home');
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
};

Lobby.setPage = function (page) {
    if (Lobby.busy) {
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
};

Lobby.changePage = function (page) {
    Lobby.selectButton(page);
    document.documentElement.scrollTop = 0;
    var div = gn('wrapc');
    while (div.childElementCount > 0) {
        div.removeChild(div.childNodes[0]);
    }
    switch (page) {
    case 'home':
        Lobby.busy = true;
        ScratchAudio.sndFX('tap.wav');
        Lobby.loadProjects(div);
        break;
    case 'help':
        Lobby.busy = true;
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
    Lobby.currentPage = page;
};

Lobby.loadProjects = function (p) {
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
};

Lobby.loadSamples = function (p) {
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
};

Lobby.loadGuide = function (p) {
    gn('topsection').className = 'topsection book';
    gn('footer').className = 'footer on';
    var div = newHTML('div', 'htmlcontents home', p);
    div.setAttribute('id', 'htmlcontents');
    setTimeout(function () {
        Lobby.setSubMenu('about');
    }, 250);
};

Lobby.loadSettings = function (p) {
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
    for (var l in Settings.supportedLocales) {
        var selected = '';
        if (Settings.supportedLocales[l] == Localization.currentLocale) {
            selected = ' selected';
        }
        languageButton = newHTML('div', 'localizationselect' + selected, languageButtons);
        languageButton.textContent = l;

        languageButton.ontouchstart = function (e) {
            ScratchAudio.sndFX('tap.wav');
            Cookie.set('localization', Settings.supportedLocales[e.target.textContent]);
            window.location = '?place=gear';
        };
    }
};

Lobby.setSubMenu = function (page) {
    if (Lobby.busy) {
        return;
    }
    document.ontouchmove = undefined;
    Lobby.busy = true;
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
        url = Lobby.host + 'about.html';
        Lobby.loadLink(div, url, 'contentwrap scroll', 'htmlcontents scrolled');
        break;
    case 'interface':
        document.ontouchmove = function (e) {
            e.preventDefault();
        };
        url = Lobby.host + 'interface.html';
        Lobby.loadLink(div, url, 'contentwrap noscroll', 'htmlcontents fixed');
        break;
    case 'paint':
        document.ontouchmove = function (e) {
            e.preventDefault();
        };
        url = Lobby.host + 'paint.html';
        Lobby.loadLink(div, url, 'contentwrap noscroll', 'htmlcontents fixed');
        break;
    case 'blocks':
        url = Lobby.host + 'blocks.html';
        Lobby.loadLink(div, url, 'contentwrap scroll', 'htmlcontents scrolled');
        break;
    default:
        Lobby.missing(page, div);
        break;
    //url =  Lobby.loadProjects(div); break;
    }
};

Lobby.selectSubButton = function (str) {
    var list = ['about', 'interface', 'paint', 'blocks'];
    for (var i = 0; i < list.length; i++) {
        var kid = gn(list[i] + 'tab');
        var cls = kid.className.split(' ')[0];
        kid.className = cls + ((list[i] == str) ? ' on' : ' off');
    }
};

Lobby.selectButton = function (str) {
    var list = ['home', 'help', 'book', 'gear'];
    for (var i = 0; i < list.length; i++) {
        if (str == list[i]) {
            gn(list[i] + 'tab').className = list[i] + ' on';
        } else {
            gn(list[i] + 'tab').className = list[i] + ' off';
        }
    }
};

Lobby.loadLink = function (p, url, css, css2) {
    document.documentElement.scrollTop = 0;
    gn('wrapc').scrollTop = 0;
    gn('wrapc').className = css;
    var iframe = newHTML('iframe', 'htmlcontents', p);
    iframe.setAttribute('id', 'htmlcontents');
    gn('htmlcontents').className = css2;
    gn('htmlcontents').src = url;
    gn('htmlcontents').onload = function () {
        if (Lobby.errorTimer) {
            clearTimeout(Lobby.errorTimer);
        }
        Lobby.errorTimer = undefined;
        Lobby.busy = false;
        gn('wrapc').scrollTop = 0;
    };
    Lobby.errorTimer = window.setTimeout(function () {
        Lobby.errorLoading('Loading timeout');
    }, 20000);
};

Lobby.errorLoading = function (str) {
    if (Lobby.errorTimer) {
        clearTimeout(Lobby.errorTimer);
    }
    Lobby.errorTimer = undefined;
    var wc = gn('wrapc');
    while (wc.childElementCount > 0) {
        wc.removeChild(wc.childNodes[0]);
    }
    var div = newHTML('div', 'htmlcontents', wc);
    div.setAttribute('id', 'htmlcontents');
    var ht = newHTML('div', 'errormsg', div);
    var h = newHTML('h1', undefined, ht);
    h.textContent = str;
    Lobby.busy = false;
};

Lobby.missing = function (page, p) {
    gn('wrapc').className = 'contentwrap scroll';
    var div = newHTML('div', 'htmlcontents', p);
    div.setAttribute('id', 'htmlcontents');
    div = newHTML('div', 'errormsg', div);
    var h = newHTML('h1', undefined, div);
    h.textContent = page.toUpperCase() + ': UNDER CONSTRUCTION';
    Lobby.busy = false;
};

Lobby.goHome = function () {
    if (Lobby.currentPage === 'home') {
        window.location.href = 'index.html?back=true';
    } else {
        Lobby.setPage('home');
    }
};
