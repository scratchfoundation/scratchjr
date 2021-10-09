//////////////////////////////////////////////////
//  iOS interface functions
// window.tablet is the class where native functions are injected for calling in
// javascript. It will be initialized prior to calling any functions in this class
//////////////////////////////////////////////////

import OS from './OS';
import '@babel/polyfill';

let mediacounter = 0;
let callbacks = {};

export default class iOS {
    static getId () {
        do { //eslint-disable-line no-constant-condition
            var id = 'jr' + ((new Date()).getTime()) + Math.floor(Math.random() * 10000);
            if (!callbacks[id]) {
                return id;
            }
        } while (true);
    }

    static call (method) {
        return new Promise((resolve) => {
            var id = iOS.getId();
            callbacks[id] = resolve;
            var args = [].slice.call(arguments);
            args.shift();
            window.tablet.postMessage({
                id: id,
                method: method,
                params: args
            });
        });
    }

    static resolve (id, res) {
        if (!id) {
            return;
        }
        const callbackFn = callbacks[id];
        if (!callbackFn) {
            return;
        }
        if (typeof callbackFn === 'function') {
            callbackFn(res);
        }
        delete callbacks[id];
    }

    // Database functions
    static stmt (json, fcn) {
        (async () => {
            var result = await iOS.call('database_stmt', JSON.stringify(json));
            if (typeof (fcn) !== 'undefined') {
                fcn(result);
            }
        })();
    }

    static query (json, fcn) {
        (async () => {
            var result = await iOS.call('database_query', JSON.stringify(json));
            if (typeof result == 'object') {
                result = JSON.stringify(result);
            }
            if (typeof (fcn) !== 'undefined') {
                fcn(result);
            }
        })();
    }

    static setfield (db, id, fieldname, val, fcn) {
        var json = {};
        var keylist = [fieldname + ' = ?', 'mtime = ?'];
        json.values = [val, (new Date()).getTime().toString()];
        json.stmt = 'update ' + db + ' set ' + keylist.toString() + ' where id = ' + id;
        iOS.stmt(json, fcn);
    }

    // IO functions

    static cleanassets (ft, fcn) {
        iOS.call('io_cleanassets', ft);
        fcn();
    }

    static getmedia (file, fcn) {
        mediacounter++;
        var nextStep = function (file, key, whenDone) {
            (async () => {
                var result = await iOS.call('io_getmedialen', file, key);
                iOS.processdata(key, 0, result * 1, '', whenDone);
            })();
        };
        nextStep(file, mediacounter, fcn);
    }

    static getmediadata (key, offset, len, fcn) {
        (async () => {
            var result = await iOS.call('io_getmediadata', key, offset, len);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static processdata (key, off, len, oldstr, fcn) {
        if (len == 0) {
            iOS.getmediadone(key);
            fcn(oldstr);
            return;
        }
        var newlen = (len < 100000) ? len : 100000;
        iOS.getmediadata(key, off, newlen, function (str) {
            iOS.processdata(key, off + newlen, len - newlen, oldstr + str, fcn);
        });
    }

    static getsettings (fcn) {
        (async () => {
            var result = await iOS.call('io_getsettings');
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static getmediadone (file, fcn) {
        (async () => {
            var result = await iOS.call('io_getmediadone', file);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static setmedia (str, ext, fcn) {
        (async () => {
            var result = await iOS.call('io_setmedia', str, ext);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static setmedianame (str, name, ext, fcn) {
        (async () => {
            var result = await iOS.call('io_setmedianame', str, name, ext);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static getmd5 (str, fcn) {
        (async () => {
            var result = await iOS.call('io_getmd5', str);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static remove (str, fcn) {
        (async () => {
            var result = await iOS.call('io_remove', str);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static getfile (str, fcn) {
        (async () => {
            var result = await iOS.call('io_getfile', str);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static setfile (name, str, fcn) {
        (async () => {
            var result = await iOS.call('io_setfile', name, btoa(str));
            if (fcn) {
                fcn(result);
            }
        })();
    }

    // Sound functions

    static registerSound (dir, name, fcn) {
        (async () => {
            var result = await iOS.call('io_registersound', dir, name);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static playSound (name, fcn) {
        (async () => {
            var result = await iOS.call('io_playsound', name);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static stopSound (name, fcn) {
        (async () => {
            var result = await iOS.call('io_stopsound', name);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    // Web Wiew delegate call backs

    static sndrecord (fcn) {
        (async () => {
            var result = await iOS.call('recordsound_recordstart');
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static recordstop (fcn) {
        (async () => {
            var result = await iOS.call('recordsound_recordstop');
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static volume (fcn) {
        (async () => {
            var result = await iOS.call('recordsound_volume');
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static startplay (fcn) {
        (async () => {
            var result = await iOS.call('recordsound_startplay');
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static stopplay (fcn) {
        (async () => {
            var result = await iOS.call('recordsound_stopplay');
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static recorddisappear (b, fcn) {
        (async () => {
            var result = iOS.call('recordsound_recordclose', b);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    // Record state
    static askpermission () {
        iOS.call('askForPermission');
    }

    // camera functions

    static hascamera () {
        (async () => {
            OS.camera = await iOS.call('scratchjr_cameracheck');
        })();
    }

    static startfeed (data, fcn) {
        (async () => {
            var str = JSON.stringify(data);
            var result = await iOS.call('scratchjr_startfeed', str);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static stopfeed (fcn) {
        (async () => {
            var result = await iOS.call('scratchjr_stopfeed');
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static choosecamera (mode, fcn) {
        (async () => {
            var result = await iOS.call('scratchjr_choosecamera', mode);
            if (fcn) {
                fcn(result);
            }
        })();
    }

    static captureimage (fcn) {
        iOS.call('scratchjr_captureimage', fcn);
    }

    static hidesplash (fcn) {
        (async () => {
            iOS.call('hideSplash');
            if (fcn) {
                fcn();
            }
        })();
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
        (async () => {
            const fullName = await iOS.call('createZipForProject', projectData, metadata, name);
            if (fcn) {
                fcn(fullName);
            }
        })();
    }

    // Called on the JS side to trigger native UI for project sharing.
    // fileName: name for the file to share
    // emailSubject: subject text to use for an email
    // emailBody: body HTML to use for an email
    // shareType: 0 for Email; 1 for Airdrop
    // b64data: base-64 encoded .SJR file to share

    static sendSjrToShareDialog (fileName, emailSubject, emailBody, shareType) {
        iOS.call('sendSjrUsingShareDialog', fileName, emailSubject, emailBody, shareType);
    }

    static registerLibraryAssets (version, assets, fcn) {
        (async () => {
            await iOS.call('registerLibraryAssets', version, assets);
            fcn && fcn();
        })();
    }

    // Name of the device/iPad to display on the sharing dialog page
    // fcn is called with the device name as an arg
    static deviceName (fcn) {
        (async () => {
            fcn(await iOS.call('deviceName'));
        })();
    }

    static analyticsEvent (category, action, label) {
        iOS.call('analyticsEvent', category, action, label);
    }

    static setAnalyticsPlacePref (preferredPlace) {
        iOS.call('setAnalyticsPlacePref', preferredPlace);
    }

    static setAnalyticsPref (key, value) {
        iOS.call('setAnalyticsPref', key, value);
    }
}

// Expose iOS methods for ScratchJr tablet sharing callbacks
window.iOS = iOS;
