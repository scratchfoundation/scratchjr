import ScratchJr from '../editor/ScratchJr';
import iOS from '../iPad/iOS';
import Localization from '../utils/Localization';
import Record from '../editor/ui/Record';
import Camera from '../painteditor/Camera';
import {preprocessAndLoadCss} from '../utils/lib';

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
    preprocessAndLoadCss('css', 'css/font.css');
    preprocessAndLoadCss('css', 'css/base.css');
    preprocessAndLoadCss('css', 'css/editor.css');
    preprocessAndLoadCss('css', 'css/editorleftpanel.css');
    preprocessAndLoadCss('css', 'css/editorstage.css');
    preprocessAndLoadCss('css', 'css/editormodal.css');
    preprocessAndLoadCss('css', 'css/librarymodal.css');
    preprocessAndLoadCss('css', 'css/paintlook.css');
    Localization.includeLocales();
    iOS.waitForInterface(createScratchJr);
};
