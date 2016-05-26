import ScratchAudio from '../utils/ScratchAudio';
import {gn, getUrlVars, isAndroid, isiOS} from '../utils/lib';
import iOS from '../iPad/iOS';
import UI from '../editor/ui/UI';
import Localization from '../utils/Localization';

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

    if (window.Settings.edition == 'PBS') {
        gn('topbar-moreapps').textContent = Localization.localize('PBS_MORE_APPS');
        gn('startButton').textContent = Localization.localize('PBS_START');
        gn('gettings').textContent = Localization.localize('PBS_HOW_TO');

        gn('startButton').ontouchend = indexGohome;
        gn('pbschars').ontouchend = indexGohome;

        gn('topbar-moreapps').ontouchstart = indexMoreApps;
        gn('topbar-settings').ontouchstart = indexGoSettings;
        gn('topbar-info').ontouchstart = indexInfo;
    } else {
        gn('gear').ontouchstart = indexGoSettings;
    }

    setTimeout(function () {
        gn('rays').className = 'rays spinme';
    }, 250);
}

function indexFirstTime () {
    gn('authors').className = 'credits show';
    gn('authorsText').className = 'creditsText show';
    if (window.Settings.edition == 'PBS') {
        gn('pbschars').className = 'characters hide';
        gn('startcode').className = 'catlogo show';
        gn('topbar').className = 'topbar hide';
        gn('startButton').className = 'startButton hide';
    } else {
        gn('purpleguy').className = 'purple show';
        gn('blueguy').className = 'blue show';
        gn('redguy').className = 'red show';
    }
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

    if (window.Settings.edition == 'PBS') {
        gn('pbschars').className = 'characters show';
        gn('topbar').className = 'topbar show';
        gn('startButton').className = 'startButton show';
    } else {
        gn('purpleguy').className = 'purple hide';
        gn('blueguy').className = 'blue hide';
        gn('redguy').className = 'red hide';
        gn('gear').className = 'gear show';
    }
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

function indexGoSettings () {
    // Switch to the settings selection page
    // Triggered by tapping the gear icon in the top right
    ScratchAudio.sndFX('tap.wav');
    window.location.href = 'home.html?place=gear';
}

function indexGettingstarted () {
    ScratchAudio.sndFX('tap.wav');
    window.location.href = 'gettingstarted.html?place=home';
}

// For PBS KIDS edition only
function indexInfo () {
    ScratchAudio.sndFX('tap.wav');
    window.location.href = 'home.html?place=book';
}

function indexMoreApps () {
    ScratchAudio.sndFX('tap.wav');

    UI.parentalGate(null, function () {
        if (isiOS) {
            window.location.href = 'https://itunes.apple.com/us/developer/pbs-kids/id324323339?mt=8';
        } else {
            window.location.href = 'http://to.pbs.org/ScJr_GPlay';
        }
    });
}
