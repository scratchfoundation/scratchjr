import {Lib, isAndroid, isiOS} from '../utils/lib';
import Localization from '../utils/Localization';

function startup () {
    ScratchAudio.init();
    var urlvars = Lib.getUrlVars();
    if (urlvars.back) {
        loadOptions();
    } else {
        firstTime();
    }
    setTimeout(function () {
        Lib.gn('rays').className = 'rays spinme';
    }, 250);
}

function firstTime () {
    Lib.gn('authors').className = 'credits show';
    Lib.gn('authorsText').className = 'creditsText show';
    Lib.gn('purpleguy').className = 'purple show';
    Lib.gn('blueguy').className = 'blue show';
    Lib.gn('redguy').className = 'red show';
    iOS.askpermission(); // ask for sound recording
    setTimeout(function () {
        iOS.hidesplash(doit);
    }, 500);
    function doit () {
        ScratchAudio.sndFX('tap.wav');
        window.ontouchend = function () {
            loadOptions();
        };
    }
    setTimeout(function () {
        loadOptions();
    }, 2000);
}

function loadOptions () {
    Lib.gn('authors').className = 'credits hide';
    Lib.gn('authorsText').className = 'creditsText hide';
    Lib.gn('purpleguy').className = 'purple hide';
    Lib.gn('blueguy').className = 'blue hide';
    Lib.gn('redguy').className = 'red hide';
    Lib.gn('gettings').className = 'gettings show';
    Lib.gn('startcode').className = 'startcode show';
    document.ontouchmove = function (e) {
        e.preventDefault();
    };
    if (isAndroid) {
        AndroidInterface.notifySplashDone();
    }
}

function gohome () {
    // On iOS, sounds are loaded async, but the code as written expects to play tap.wav when we enter home.html
    // (but since it isn't loaded yet, no sound is played).
    // On Android, sync sounds means both calls to tap.wav result in a sound play.
    // XXX: we should re-write the lobby loading to wait for the sounds to load, and not play a sound here.
    if (isiOS) {
        ScratchAudio.sndFX('tap.wav');
    }
    iOS.setfile('homescroll.sjr', 0, function () {
        doNext();
    });
    function doNext () {
        window.location.href = 'home.html';
    }
}

function gettingstarted () {
    ScratchAudio.sndFX('tap.wav');
    window.location.href = 'gettingstarted.html?place=home';
}

window.onload = () => {
    Localization.includeLocales();
    Lib.preprocessAndLoadCss('css', 'css/font.css');
    Lib.preprocessAndLoadCss('css', 'css/base.css');
    Lib.preprocessAndLoadCss('css', 'css/start.css');
    Lib.preprocessAndLoadCss('css', 'css/thumbs.css');
    Lib.gn('gettings').ontouchend = gettingstarted;
    Lib.gn('startcode').ontouchend = gohome;

    iOS.waitForInterface(startup);
};
