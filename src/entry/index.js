import {isAndroid, isiOS, gn, getUrlVars, preprocessAndLoadCss} from '../utils/lib';
import Localization from '../utils/Localization';
import iOS from '../iPad/iOS';
import ScratchAudio from '../utils/ScratchAudio';

function startup () {
    ScratchAudio.init();
    var urlvars = getUrlVars();
    if (urlvars.back) {
        loadOptions();
    } else {
        firstTime();
    }
    setTimeout(function () {
        gn('rays').className = 'rays spinme';
    }, 250);
}

function firstTime () {
    gn('authors').className = 'credits show';
    gn('authorsText').className = 'creditsText show';
    gn('purpleguy').className = 'purple show';
    gn('blueguy').className = 'blue show';
    gn('redguy').className = 'red show';
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
    gn('authors').className = 'credits hide';
    gn('authorsText').className = 'creditsText hide';
    gn('purpleguy').className = 'purple hide';
    gn('blueguy').className = 'blue hide';
    gn('redguy').className = 'red hide';
    gn('gettings').className = 'gettings show';
    gn('startcode').className = 'startcode show';
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
    preprocessAndLoadCss('css', 'css/font.css');
    preprocessAndLoadCss('css', 'css/base.css');
    preprocessAndLoadCss('css', 'css/start.css');
    preprocessAndLoadCss('css', 'css/thumbs.css');
    gn('gettings').ontouchend = gettingstarted;
    gn('startcode').ontouchend = gohome;

    iOS.waitForInterface(startup);
};
