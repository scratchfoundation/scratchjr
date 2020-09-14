import ScratchJr from '../editor/ScratchJr';
import OS from '../tablet/OS';
import Camera from '../painteditor/Camera';
import Record from '../editor/ui/Record';

export function editorMain () {
    OS.getsettings(doNext);
    OS.analyticsEvent('editor', 'project_editor_open');
    function doNext (str) {
        var list = str.split(',');
        OS.path = list[1] == '0' ? list[0] + '/' : undefined;
        if (list.length > 2) {
            Record.available = list[2] == 'YES' ? true : false;
        }
        if (list.length > 3) {
            Camera.available = list[3] == 'YES' ? true : false;
        }
        ScratchJr.appinit(window.Settings.scratchJrVersion);
    }
}
