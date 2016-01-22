import {isAndroid, isiOS, gn, getUrlVars, preprocessAndLoadCss} from '../utils/lib';
import Localization from '../utils/Localization';
import iOS from '../iPad/iOS';
import IO from '../iPad/IO';
import MediaLib from '../iPad/MediaLib';
import ScratchJr from '../editor/ScratchJr';
import ScratchAudio from '../utils/ScratchAudio';
import Lobby from '../lobby/Lobby.js';
import Record from '../editor/ui/Record';
import Camera from '../painteditor/Camera';

// Entry-points for each page
// Previously index.html
function indexStartup () {
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

// Previously home.html

function homeStartup () {
    homeStrings();
    iOS.getsettings(doNext);
    function doNext (str) {
        var list = str.split(',');
        iOS.path = list[1] == '0' ? list[0] + '/' : undefined;
        Lobby.appinit(window.Settings.scratchJrVersion);
    }
}

function homeGoBack () {
    window.location.href = 'index.html?back=yes';
}

function homeStrings () {
    gn('abouttab-text').textContent = Localization.localize('ABOUT_SCRATCHJR');
    gn('interfacetab-text').textContent = Localization.localize('INTERFACE_GUIDE');
    gn('painttab-text').textContent = Localization.localize('PAINT_EDITOR_GUIDE');
    gn('blockstab-text').textContent = Localization.localize('BLOCKS_GUIDE');
}

// Previously editor.html
function editorCreateScratchJr () {
    iOS.getsettings(doNext);
    function doNext (str) {
        var list = str.split(',');
        iOS.path = list[1] == '0' ? list[0] + '/' : undefined;
        if (list.length > 2) {
            Record.available = list[2] == 'YES' ? true : false;
        }
        if (list.length > 3) {
            Camera.available = list[3] == 'YES' ? true : false;
        }
        ScratchJr.appinit(window.Settings.scratchJrVersion);
    }
}

function loadSettings (whenDone) {
    IO.requestFromServer('./settings.json', (result) => {
        window.Settings = JSON.parse(result);
        whenDone();
    });
}

// App-wide entry-point
window.onload = () => {
    // Load settings from JSON
    loadSettings(() => {
        // Load locale strings from JSON
        Localization.includeLocales(() => {
            // Load Media Lib from JSON
            MediaLib.loadMediaLib(() => {
                // Continue to load the page
                let page = window.scratchJrPage;
                if (page == 'index') {
                    preprocessAndLoadCss('css', 'css/font.css');
                    preprocessAndLoadCss('css', 'css/base.css');
                    preprocessAndLoadCss('css', 'css/start.css');
                    preprocessAndLoadCss('css', 'css/thumbs.css');
                    gn('gettings').ontouchend = indexGettingstarted;
                    gn('startcode').ontouchend = indexGohome;
                    iOS.waitForInterface(indexStartup);
                } else if (page == 'home') {
                    preprocessAndLoadCss('css', 'css/font.css');
                    preprocessAndLoadCss('css', 'css/base.css');
                    preprocessAndLoadCss('css', 'css/lobby.css');
                    preprocessAndLoadCss('css', 'css/thumbs.css');
                    gn('logotab').ontouchend = homeGoBack;
                    iOS.waitForInterface(homeStartup);
                } else if (page == 'editor') {
                    preprocessAndLoadCss('css', 'css/font.css');
                    preprocessAndLoadCss('css', 'css/base.css');
                    preprocessAndLoadCss('css', 'css/editor.css');
                    preprocessAndLoadCss('css', 'css/editorleftpanel.css');
                    preprocessAndLoadCss('css', 'css/editorstage.css');
                    preprocessAndLoadCss('css', 'css/editormodal.css');
                    preprocessAndLoadCss('css', 'css/librarymodal.css');
                    preprocessAndLoadCss('css', 'css/paintlook.css');
                    iOS.waitForInterface(editorCreateScratchJr);
                }
            });
        });
    });
};
