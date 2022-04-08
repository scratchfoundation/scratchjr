import {preprocessAndLoadCss} from '../utils/lib';
import Localization from '../utils/Localization';
import InitialOptions from '../utils/InitialOptions';
import OS from '../tablet/OS';
import IO from '../tablet/IO';
import MediaLib from '../tablet/MediaLib';

import {indexMain} from './index';
import {homeMain} from './home';
import {editorMain} from './editor';
import {gettingStartedMain} from './gettingstarted';
import {
    inappInterfaceGuide,
    inappAbout,
    inappBlocksGuide,
    inappPaintEditorGuide,
    inappPrivacyPolicy
} from './inapp';

function loadSettings (settingsRoot, whenDone) {
    IO.requestFromServer(settingsRoot + 'settings.json', (result) => {
        window.Settings = JSON.parse(result);
        whenDone();
    });
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

    // Load CSS and set root/entryFunction for all pages
    switch (page) {
    case 'index':
        // Index page (splash screen)
        preprocessAndLoadCss('css', 'css/font.css');
        preprocessAndLoadCss('css', 'css/base.css');
        preprocessAndLoadCss('css', 'css/start.css');
        preprocessAndLoadCss('css', 'css/thumbs.css');
        /* For parental gate. These CSS properties should be refactored */
        preprocessAndLoadCss('css', 'css/editor.css');
        entryFunction = () => OS.waitForInterface(function () {
            var assets = Object.keys(MediaLib.keys).join(',');
            OS.registerLibraryAssets(MediaLib.version, assets, indexMain);
        });
        break;
    case 'home':
        // Lobby pages
        preprocessAndLoadCss('css', 'css/font.css');
        preprocessAndLoadCss('css', 'css/base.css');
        preprocessAndLoadCss('css', 'css/lobby.css');
        preprocessAndLoadCss('css', 'css/thumbs.css');
        entryFunction = () => OS.waitForInterface(homeMain);
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
        entryFunction = () => OS.waitForInterface(editorMain);
        break;
    case 'gettingStarted':
        // Getting started video page
        preprocessAndLoadCss('css', 'css/font.css');
        preprocessAndLoadCss('css', 'css/base.css');
        preprocessAndLoadCss('css', 'css/gs.css');
        entryFunction = () => OS.waitForInterface(gettingStartedMain);
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
    case 'inappPrivacyPolicy':
        // Blocks guide in-app help frame
        preprocessAndLoadCss('style', 'style/style.css');
        preprocessAndLoadCss('style', 'style/privacy.css');
        entryFunction = () => inappPrivacyPolicy();
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
        // Initialize currentUsage data
        InitialOptions.initWithSettings(window.Settings.initialOptions);
    });
};
