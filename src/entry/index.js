import ScratchAudio from '../utils/ScratchAudio';
import {gn, getUrlVars, isAndroid, isiOS} from '../utils/lib';
import iOS from '../iPad/iOS';

export function indexMain () {
    gn('gettings').ontouchend = indexGettingstarted;
    gn('startcode').ontouchend = indexGohome;
    ScratchAudio.init();
    var urlvars = getUrlVars();
    if (urlvars.back) {
        indexLoadOptions();
    } else {
        indexFirstTime();
    }
    setTimeout(function () {
        gn('rays').className = 'rays spinme';
    }, 250);
}

function indexFirstTime () {
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
            indexLoadOptions();
        };
    }
    setTimeout(function () {
        indexLoadOptions();
    }, 2000);
}

function indexLoadOptions () {
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

function indexGohome () {
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

function indexGettingstarted () {
    ScratchAudio.sndFX('tap.wav');
    window.location.href = 'gettingstarted.html?place=home';
}
