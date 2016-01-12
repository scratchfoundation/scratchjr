import Lib from '../utils/lib';

function createScratchJr () {
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
        ScratchJr.appinit(Settings.scratchJrVersion);
    }
}

window.onload = () => {
    Lib.preprocessAndLoadCss('css', 'css/font.css');
    Lib.preprocessAndLoadCss('css', 'css/base.css');
    Lib.preprocessAndLoadCss('css', 'css/editor.css');
    Lib.preprocessAndLoadCss('css', 'css/editorleftpanel.css');
    Lib.preprocessAndLoadCss('css', 'css/editorstage.css');
    Lib.preprocessAndLoadCss('css', 'css/editormodal.css');
    Lib.preprocessAndLoadCss('css', 'css/librarymodal.css');
    Lib.preprocessAndLoadCss('css', 'css/paintlook.css');
    Localization.includeLocales();
    iOS.waitForInterface(createScratchJr);
};
