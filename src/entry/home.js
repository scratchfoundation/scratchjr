import {gn, preprocessAndLoadCss} from '../utils/lib';
import iOS from '../iPad/iOS';
import Localization from '../utils/Localization';
import Lobby from '../lobby/Lobby.js';

function startup () {
    homeStrings();
    iOS.getsettings(doNext);
    function doNext (str) {
        var list = str.split(',');
        iOS.path = list[1] == '0' ? list[0] + '/' : undefined;
        Lobby.appinit(Settings.scratchJrVersion);
    }
}

function goBack () {
    window.location.href = 'index.html?back=yes';
}

function homeStrings () {
    gn('abouttab-text').textContent = Localization.localize('ABOUT_SCRATCHJR');
    gn('interfacetab-text').textContent = Localization.localize('INTERFACE_GUIDE');
    gn('painttab-text').textContent = Localization.localize('PAINT_EDITOR_GUIDE');
    gn('blockstab-text').textContent = Localization.localize('BLOCKS_GUIDE');
}

window.onload = () => {
    Localization.includeLocales();
    preprocessAndLoadCss('css', 'css/font.css');
    preprocessAndLoadCss('css', 'css/base.css');
    preprocessAndLoadCss('css', 'css/lobby.css');
    preprocessAndLoadCss('css', 'css/thumbs.css');
    gn('logotab').ontouchend = goBack;
    iOS.waitForInterface(startup);
};
