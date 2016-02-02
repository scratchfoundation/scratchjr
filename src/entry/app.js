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

// Previously home.html

function homeStartup () {
    gn('logotab').ontouchend = homeGoBack;
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

function loadSettings (settingsRoot, whenDone) {
    IO.requestFromServer(settingsRoot + 'settings.json', (result) => {
        window.Settings = JSON.parse(result);
        whenDone();
    });
}

// Previously gettingstarted.html

let place;
function gettingStartedVideo () {
    gn('closeHelp').onclick = gettingStartedCloseMe;
    gn('closeHelp').ontouchstart = gettingStartedCloseMe;
    var videoObj = gn('myVideo');
    if (isiOS) {
        // On iOS we can load from server
        videoObj.src = 'assets/lobby/intro.mp4';
    } else {
        // On Android we need to copy to a temporary directory first:
        setTimeout(function () {
            videoObj.type = 'video/mp4';
            videoObj.src = AndroidInterface.scratchjr_getgettingstartedvideopath();
        }, 1000);
    }
    videoObj.poster = 'assets/lobby/poster.png';

    var urlvars = getUrlVars();
    place = urlvars['place'];
    document.ontouchmove = function (e){
        e.preventDefault();
    };
}


function gettingStartedCloseMe () {
    window.location.href = 'home.html?place=' + place;
}

function inappAbout () {
    gn('aboutScratchjrTitle').textContent = Localization.localize('ABOUT_SCRATCHJR');
    gn('aboutWhatIs').textContent = Localization.localize('ABOUT_WHAT_IS');
    gn('aboutDescription').innerHTML = Localization.localize('ABOUT_DESCRIPTION') + '<br/><br/>' +
        Localization.localize('ABOUT_INSPIRED_BY');
    gn('aboutWhyCreate').textContent = Localization.localize('ABOUT_WHY_CREATE');
    gn('aboutWhyCreateDescription').innerHTML = Localization.localize('ABOUT_WHY_CREATE_DESCRIPTION');
    gn('aboutWhoCreated').textContent = Localization.localize('ABOUT_WHO_CREATED');
    gn('aboutWhoCreatedDescription').innerHTML = (
        Localization.localize('ABOUT_WHO_CREATED_DESCRIPTION'));
    gn('aboutWhoSupported').textContent = Localization.localize('ABOUT_WHO_SUPPORTED');
    gn('aboutWhoSupportedDescription').innerHTML = (
        Localization.localize('ABOUT_WHO_SUPPORTED_DESCRIPTION')
    );
}

function inappInterfaceGuide () {

    var interfaceKeyHeaderNode = gn('interface-key-header');
    var interfaceKeyDescriptionNode = gn('interface-key-description');

    interfaceKeyHeaderNode.textContent = Localization.localize('INTERFACE_GUIDE_SAVE', {N: 1});
    interfaceKeyDescriptionNode.textContent = Localization.localize('INTERFACE_GUIDE_SAVE_DESCRIPTION');

    var interfaceKeys = [
        'SAVE',
        'STAGE',
        'PRESENTATION_MODE',
        'GRID',
        'CHANGE_BG',
        'ADD_TEXT',
        'RESET_CHAR',
        'GREEN_FLAG',
        'PAGES',
        'PROJECT_INFO',
        'UNDO_REDO',
        'PROGRAMMING_SCRIPT',
        'PROGRAMMING_AREA',
        'BLOCKS_PALETTE',
        'BLOCKS_CATEGORIES',
        'CHARACTERS'
    ];

    var interfaceDescriptions = [];
    for (var i = 0; i < interfaceKeys.length; i++) {
        var key = interfaceKeys[i];
        interfaceDescriptions.push([
            Localization.localize('INTERFACE_GUIDE_' + key, {N: i+1}),
            Localization.localize('INTERFACE_GUIDE_' + key + '_DESCRIPTION')
        ]);
    }


    var currentButton = document.getElementById('interface-button-save');

    var switchHelp = function (e) {
        var target = e.target;
        if (target.className == 'interface-button-text') {
            var descriptionId = parseInt(target.innerText - 1);
            interfaceKeyHeaderNode.textContent = interfaceDescriptions[descriptionId][0];
            interfaceKeyDescriptionNode.textContent = interfaceDescriptions[descriptionId][1];
            currentButton.className = 'interface-button';
            currentButton = target.parentNode;
            currentButton.className = currentButton.className + ' interface-button-selected';
            ScratchAudio.sndFXWithVolume('keydown.wav', 0.3);
        }
    };
    document.addEventListener('touchstart', switchHelp, false);
}

function inappPaintEditorGuide () {
    var paintKeyHeaderNode = gn('paint-key-header');
    var paintKeyDescriptionNode = gn('paint-key-description');

    paintKeyHeaderNode.textContent = Localization.localize('PAINT_GUIDE_UNDO', {N:1});
    paintKeyDescriptionNode.textContent = Localization.localize('PAINT_GUIDE_UNDO_DESCRIPTION');

    var paintKeys = [
        'UNDO',
        'REDO',
        'SHAPE',
        'CHARACTER_NAME',
        'CUT',
        'DUPLICATE',
        'ROTATE',
        'DRAG',
        'SAVE',
        'FILL',
        'CAMERA',
        'COLOR',
        'LINE_WIDTH'
    ];

    var paintDescriptions = [];
    for (var i = 0; i < paintKeys.length; i++) {
        var key = paintKeys[i];
        paintDescriptions.push([
            Localization.localize('PAINT_GUIDE_' + key, {N: i+1}),
            Localization.localize('PAINT_GUIDE_' + key + '_DESCRIPTION')
        ]);
    }


    var currentButton = document.getElementById('paint-button-undo');

    var switchHelp = function (e) {
        var target = e.target;
        if (target.className == 'paint-button-text') {
            var descriptionId = parseInt(target.innerText - 1);
            paintKeyHeaderNode.textContent = paintDescriptions[descriptionId][0];
            paintKeyDescriptionNode.textContent = paintDescriptions[descriptionId][1];
            currentButton.className = 'paint-button';
            currentButton = target.parentNode;
            currentButton.className = currentButton.className + ' paint-button-selected';
            ScratchAudio.sndFXWithVolume('keydown.wav', 0.3);
        }
    };
    document.addEventListener('touchstart', switchHelp, false);
}

function inappBlocksGuide () {
    // Localized category names
    gn('yellow-block-category-header').textContent = Localization.localize('BLOCKS_TRIGGERING_BLOCKS');
    gn('blue-block-category-header').textContent = Localization.localize('BLOCKS_MOTION_BLOCKS');
    gn('purple-block-category-header').textContent = Localization.localize('BLOCKS_LOOKS_BLOCKS');
    gn('green-block-category-header').textContent = Localization.localize('BLOCKS_SOUND_BLOCKS');
    gn('orange-block-category-header').textContent = Localization.localize('BLOCKS_CONTROL_BLOCKS');
    gn('red-block-category-header').textContent = Localization.localize('BLOCKS_END_BLOCKS');

    var blockDescriptionKeys = [
        'BLOCKS_GREEN_FLAG',
        'BLOCKS_GREEN_FLAG_DESCRIPTION',
        'BLOCKS_ON_TAP',
        'BLOCKS_ON_TAP_DESCRIPTION',
        'BLOCKS_ON_TOUCH',
        'BLOCKS_ON_TOUCH_DESCRIPTION',
        'BLOCKS_ON_MESSAGE',
        'BLOCKS_ON_MESSAGE_DESCRIPTION',
        'BLOCKS_SEND_MESSAGE',
        'BLOCKS_SEND_MESSAGE_DESCRIPTION',
        'BLOCKS_MOVE_RIGHT',
        'BLOCKS_MOVE_RIGHT_DESCRIPTION',
        'BLOCKS_MOVE_LEFT',
        'BLOCKS_MOVE_LEFT_DESCRIPTION',
        'BLOCKS_MOVE_UP',
        'BLOCKS_MOVE_UP_DESCRIPTION',
        'BLOCKS_MOVE_DOWN',
        'BLOCKS_MOVE_DOWN_DESCRIPTION',
        'BLOCKS_TURN_RIGHT',
        'BLOCKS_TURN_RIGHT_DESCRIPTION',
        'BLOCKS_TURN_LEFT',
        'BLOCKS_TURN_LEFT_DESCRIPTION',
        'BLOCKS_HOP',
        'BLOCKS_HOP_DESCRIPTION',
        'BLOCKS_GO_HOME',
        'BLOCKS_GO_HOME_DESCRIPTION',
        'BLOCKS_SAY',
        'BLOCKS_SAY_DESCRIPTION',
        'BLOCKS_GROW',
        'BLOCKS_GROW_DESCRIPTION',
        'BLOCKS_SHRINK',
        'BLOCKS_SHRINK_DESCRIPTION',
        'BLOCKS_RESET_SIZE',
        'BLOCKS_RESET_SIZE_DESCRIPTION',
        'BLOCKS_HIDE',
        'BLOCKS_HIDE_DESCRIPTION',
        'BLOCKS_SHOW',
        'BLOCKS_SHOW_DESCRIPTION',
        'BLOCKS_POP',
        'BLOCKS_POP_DESCRIPTION',
        'BLOCKS_PLAY_RECORDED',
        'BLOCKS_PLAY_RECORDED_DESCRIPTION',
        'BLOCKS_WAIT',
        'BLOCKS_WAIT_DESCRIPTION',
        'BLOCKS_STOP',
        'BLOCKS_STOP_DESCRIPTION',
        'BLOCKS_SET_SPEED',
        'BLOCKS_SET_SPEED_DESCRIPTION',
        'BLOCKS_REPEAT',
        'BLOCKS_REPEAT_DESCRIPTION',
        'BLOCKS_END',
        'BLOCKS_END_DESCRIPTION',
        'BLOCKS_REPEAT_FOREVER',
        'BLOCKS_REPEAT_FOREVER_DESCRIPTION',
        'BLOCKS_GO_TO_PAGE',
        'BLOCKS_GO_TO_PAGE_DESCRIPTION'
    ];

    for (let key of blockDescriptionKeys) {
        gn(key).textContent = Localization.localize(key);
    }
}

// App-wide entry-point
window.onload = () => {
    // Function to be called after settings, locale strings, and Media Lib
    // are asynchronously loaded. This is overwritten per HTML page below.
    let entryFunction = () => {};

    // Root directory for includes. Needed in case we are in the inapp-help
    // directory (and root becomes '../')
    let root = './';

    // scratchJrPage is defined in the HTML pages
    let page = window.scratchJrPage;

    switch (page) {
    case 'index':
        // Index page (splash screen)
        preprocessAndLoadCss('css', 'css/font.css');
        preprocessAndLoadCss('css', 'css/base.css');
        preprocessAndLoadCss('css', 'css/start.css');
        preprocessAndLoadCss('css', 'css/thumbs.css');
        entryFunction = () => iOS.waitForInterface(indexStartup);
        break;
    case 'home':
        // Lobby pages
        preprocessAndLoadCss('css', 'css/font.css');
        preprocessAndLoadCss('css', 'css/base.css');
        preprocessAndLoadCss('css', 'css/lobby.css');
        preprocessAndLoadCss('css', 'css/thumbs.css');
        entryFunction = () => iOS.waitForInterface(homeStartup);
        break;
    case 'editor':
        // Editor pages
        preprocessAndLoadCss('css', 'css/font.css');
        preprocessAndLoadCss('css', 'css/base.css');
        preprocessAndLoadCss('css', 'css/editor.css');
        preprocessAndLoadCss('css', 'css/editorleftpanel.css');
        preprocessAndLoadCss('css', 'css/editorstage.css');
        preprocessAndLoadCss('css', 'css/editormodal.css');
        preprocessAndLoadCss('css', 'css/librarymodal.css');
        preprocessAndLoadCss('css', 'css/paintlook.css');
        entryFunction = () => iOS.waitForInterface(editorCreateScratchJr);
        break;
    case 'gettingStarted':
        // Getting started video page
        preprocessAndLoadCss('css', 'css/font.css');
        preprocessAndLoadCss('css', 'css/base.css');
        preprocessAndLoadCss('css', 'css/gs.css');
        entryFunction = () => iOS.waitForInterface(gettingStartedVideo);
        break;
    case 'inappAbout':
        // About ScratchJr in-app help frame
        preprocessAndLoadCss('style', 'style/about.css');
        entryFunction = () => inappAbout();
        root = '../';
        break;
    case 'inappInterfaceGuide':
        // Interface guide in-app help frame
        preprocessAndLoadCss('style', 'style/style.css');
        preprocessAndLoadCss('style', 'style/interface.css');
        entryFunction = () => inappInterfaceGuide();
        root = '../';
        break;
    case 'inappPaintEditorGuide':
        // Paint editor guide in-app help frame
        preprocessAndLoadCss('style', 'style/style.css');
        preprocessAndLoadCss('style', 'style/paint.css');
        entryFunction = () => inappPaintEditorGuide();
        root = '../';
        break;
    case 'inappBlocksGuide':
        // Blocks guide in-app help frame
        preprocessAndLoadCss('style', 'style/style.css');
        preprocessAndLoadCss('style', 'style/blocks.css');
        entryFunction = () => inappBlocksGuide();
        root = '../';
        break;
    }

    // Start up sequence
    // Load settings from JSON
    loadSettings(root, () => {
        // Load locale strings from JSON
        Localization.includeLocales(root, () => {
            // Load Media Lib from JSON
            MediaLib.loadMediaLib(root, () => {
                entryFunction();
            });
        });
    });
};
