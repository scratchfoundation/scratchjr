import {isiOS, isAndroid, gn} from '../utils/lib';
import IO from './IO';
import iOS from './iOS';
import Android from './Android';
import Lobby from '../lobby/Lobby';
import Alert from '../editor/ui/Alert';
import ScratchAudio from '../utils/ScratchAudio';

//////////////////////////////////////////////////
//  Tablet interface functions
//////////////////////////////////////////////////

let path;
let camera;
let database = 'projects';
let tabletInterface = null;

export default class OS {
    // Getters/setters for properties used in other classes
    static get path () {
        return path;
    }

    static set path (newPath) {
        path = newPath;
    }

    static get camera () {
        return camera;
    }

    static set camera (newCamera) {
        camera = newCamera;
    }

    static get database () {
        return database;
    }

    // Wait for the tablet interface to be injected into the webview
    static waitForInterface (fcn) {
        // Already loaded the interface
        if (tabletInterface != null) {
            fcn();
            return;
        }
        if ((isAndroid && typeof AndroidInterface === 'undefined') || (isiOS && typeof (window.tablet) !== 'object')) {
            // interface not loaded - come back in 100ms
            setTimeout(function () {
                OS.waitForInterface(fcn);
            }, 100);
        }

        tabletInterface = isiOS ? iOS : Android;
        if (fcn) {
            fcn();
        }
        return;
    }

    // Database functions
    static stmt (json, fcn) {
        tabletInterface.stmt(json, fcn);
    }

    static query (json, fcn) {
        tabletInterface.query(json, fcn);
    }

    // DB helper - shared by both
    static setfield (db, id, fieldname, val, fcn) {
        var json = {};
        var keylist = [fieldname + ' = ?', 'mtime = ?'];
        json.values = [val, (new Date()).getTime().toString()];
        json.stmt = 'update ' + db + ' set ' + keylist.toString() + ' where id = ' + id;
        OS.stmt(json, fcn);
    }

    // IO functions

    static cleanassets (ft, fcn) {
        tabletInterface.cleanassets(ft, fcn);
    }

    static getsettings (fcn) {
        tabletInterface.getsettings(fcn);
    }

    // note the interfaces (iOS and Android) are responsible for deciding how
    // to manage getting media (e.g. whether it needs to be done in chunks etc)
    static getmedia (file, fcn) {
        tabletInterface.getmedia(file, fcn);
    }

    static setmedia (str, ext, fcn) {
        tabletInterface.setmedia(str, ext, fcn);
    }

    static setmedianame (str, name, ext, fcn) {
        tabletInterface.setmedianame(str, name, ext, fcn);
    }

    static getmd5 (str, fcn) {
        tabletInterface.getmd5(str, fcn);
    }

    static remove (str, fcn) {
        tabletInterface.remove(str, fcn);
    }

    static getfile (str, fcn) {
        tabletInterface.getfile(str, fcn);
    }

    static setfile (name, str, fcn) {
        tabletInterface.setfile(name, str, fcn);
    }

    // Sound functions

    static registerSound (dir, name, fcn) {
        tabletInterface.registerSound(dir, name, fcn);
    }

    static playSound (name, fcn) {
        tabletInterface.playSound(name, fcn);
    }

    static stopSound (name, fcn) {
        tabletInterface.stopSound(name, fcn);
    }

    // Web Wiew delegate call backs

    static soundDone (name) {
        ScratchAudio.soundDone(name);
    }

    static sndrecord (fcn) {
        tabletInterface.sndrecord(fcn);
    }

    static recordstop (fcn) {
        tabletInterface.recordstop(fcn);
    }

    static volume (fcn) {
        tabletInterface.volume(fcn);
    }

    static startplay (fcn) {
        tabletInterface.startplay(fcn);
    }

    static stopplay (fcn) {
        tabletInterface.stopplay(fcn);
    }

    static recorddisappear (b, fcn) {
        tabletInterface.recorddisappear(b, fcn);
    }

    // Record state
    static askpermission () {
        if (isiOS) {
            iOS.askpermission();
        }
    }

    // camera functions

    static hascamera () {
        camera = tabletInterface.hascamera();
    }

    static startfeed (data, fcn) {
        tabletInterface.startfeed(data, fcn);
    }

    static stopfeed (fcn) {
        tabletInterface.stopfeed(fcn);
    }

    static choosecamera (mode, fcn) {
        tabletInterface.choosecamera(mode, fcn);
    }

    static captureimage (fcn) {
        tabletInterface.captureimage(fcn);
    }

    static hidesplash (fcn) {
        if (isiOS) {
            iOS.hidesplash();
        }
        if (fcn) {
            fcn();
        }
    }

    static trace (str) {
        console.log(str); // eslint-disable-line no-console
    }

    static parse (str) {
        console.log(JSON.parse(str)); // eslint-disable-line no-console
    }

    static tracemedia (str) {
        console.log(atob(str)); // eslint-disable-line no-console
    }

    ignore () {
    }

    ///////////////
    // Sharing
    ///////////////

    static createZipForProject (projectData, metadata, name, fcn) {
        tabletInterface.createZipForProject(projectData, metadata, name, fcn);
    }


    // Called on the JS side to trigger native UI for project sharing.
    // fileName: name for the file to share
    // emailSubject: subject text to use for an email
    // emailBody: body HTML to use for an email
    // shareType: 0 for Email; 1 for Airdrop
    // b64data: base-64 encoded .SJR file to share

    static sendSjrToShareDialog (fileName, emailSubject, emailBody, shareType, b64data) {
        tabletInterface.sendSjrToShareDialog(fileName, emailSubject, emailBody, shareType, b64data);
    }

    // Called on the Objective-C side.  The argument is a base64-encoded .SJR file,
    // to be unzipped, processed, and stored.
    static loadProjectFromSjr (b64data) {
        try {
            IO.loadProjectFromSjr(b64data);
        } catch (err) {
            var errorMessage = 'Couldn\'t load share -- project data corrupted. ' + err.message;
            Alert.open(gn('frame'), gn('frame'), errorMessage, '#ff0000');
            console.log(err); // eslint-disable-line no-console
            return 0;
        }
        return 1;
    }

    // Name of the device/iPad to display on the sharing dialog page
    // fcn is called with the device name as an arg
    static deviceName (fcn) {
        tabletInterface.deviceName(fcn);
    }

    static analyticsEvent (category, action, label) {
        tabletInterface.analyticsEvent(category, action, label);
    }

    static setAnalyticsPlacePref (preferredPlace) {
        tabletInterface.setAnalyticsPlacePref(preferredPlace);
    }

    static setAnalyticsPref (key, value) {
        tabletInterface.setAnalyticsPref(key, value);
    }

    // Web Wiew delegate call backs

    static pageError (desc) {
        console.log('XCODE ERROR:', desc); // eslint-disable-line no-console
        if (window.location.href.indexOf('home.html') > -1) {
            if (Lobby.errorTimer) {
                Lobby.errorLoading(desc);
            }
        }
    }
}

// Expose OS methods for ScratchJr tablet sharing callbacks
window.OS = OS;
