//////////////////////////////////////////////////
//  iOS interface functions
// window.tablet is the class where native functions are injected for calling in
// javascript. It will be initialized prior to calling any functions in this class
//////////////////////////////////////////////////

let mediacounter = 0;

export default class iOS {

    // Database functions
    static stmt (json, fcn) {
        var result = window.tablet.database_stmt(JSON.stringify(json));
        if (typeof (fcn) !== 'undefined') {
            fcn(result);
        }
    }

    static query (json, fcn) {
        var result = window.tablet.database_query(JSON.stringify(json));
        if (typeof (fcn) !== 'undefined') {
            fcn(result);
        }
    }

    // IO functions

    static cleanassets (ft, fcn) {
        window.tablet.io_cleanassets(ft); fcn();
    }

    static getsettings (fcn) {
        var result = window.tablet.io_getsettings();
        if (fcn) {
            fcn(result);
        }
    }

    static getmedia (file, fcn) {
        mediacounter++;
        var nextStep = function (file, key, whenDone) {
            var result = window.tablet.io_getmedialen(file, key);
            iOS.processdata(key, 0, result, '', whenDone);
        };
        nextStep(file, mediacounter, fcn);
    }

    static getmediadata (key, offset, len, fcn) {
        var result = window.tablet.io_getmediadata(key, offset, len);
        if (fcn) {
            fcn(result);
        }
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

    static getmediadone (file, fcn) {
        var result = window.tablet.io_getmediadone(file);
        if (fcn) {
            fcn(result);
        }
    }

    static setmedia (str, ext, fcn) {
        var result = window.tablet.io_setmedia(str, ext);
        if (fcn) {
            fcn(result);
        }
    }

    static setmedianame (str, name, ext, fcn) {
        var result = window.tablet.io_setmedianame(str, name, ext);
        if (fcn) {
            fcn(result);
        }
    }

    static getmd5 (str, fcn) {
        var result = window.tablet.io_getmd5(str);
        if (fcn) {
            fcn(result);
        }
    }

    static remove (str, fcn) {
        var result = window.tablet.io_remove(str);
        if (fcn) {
            fcn(result);
        }
    }

    static getfile (str, fcn) {
        var result = window.tablet.io_getfile(str);
        if (fcn) {
            fcn(result);
        }
    }

    static setfile (name, str, fcn) {
        var result = window.tablet.io_setfile(name, btoa(str));
        if (fcn) {
            fcn(result);
        }
    }

    // Sound functions

    static registerSound (dir, name, fcn) {
        var result = window.tablet.io_registersound(dir, name);
        if (fcn) {
            fcn(result);
        }
    }

    static playSound (name, fcn) {
        var result = window.tablet.io_playsound(name);
        if (fcn) {
            fcn(result);
        }
    }

    static stopSound (name, fcn) {
        var result = window.tablet.io_stopsound(name);
        if (fcn) {
            fcn(result);
        }
    }

    // Web Wiew delegate call backs

    static sndrecord (fcn) {
        var result = window.tablet.recordsound_recordstart();
        if (fcn) {
            fcn(result);
        }
    }

    static recordstop (fcn) {
        var result = window.tablet.recordsound_recordstop();
        if (fcn) {
            fcn(result);
        }
    }

    static volume (fcn) {
        var result = window.tablet.recordsound_volume();
        if (fcn) {
            fcn(result);
        }
    }

    static startplay (fcn) {
        var result = window.tablet.recordsound_startplay();
        if (fcn) {
            fcn(result);
        }
    }

    static stopplay (fcn) {
        var result = window.tablet.recordsound_stopplay();
        if (fcn) {
            fcn(result);
        }
    }

    static recorddisappear (b, fcn) {
        var result = window.tablet.recordsound_recordclose(b);
        if (fcn) {
            fcn(result);
        }
    }

    // Record state
    static askpermission () {
        window.tablet.askForPermission();
    }

    // camera functions

    static hascamera () {
        return window.tablet.scratchjr_cameracheck();
    }

    static startfeed (data, fcn) {
        var str = JSON.stringify(data);
        var result = window.tablet.scratchjr_startfeed(str);
        if (fcn) {
            fcn(result);
        }
    }

    static stopfeed (fcn) {
        var result = window.tablet.scratchjr_stopfeed();
        if (fcn) {
            fcn(result);
        }
    }

    static choosecamera (mode, fcn) {
        var result = window.tablet.scratchjr_choosecamera(mode);
        if (fcn) {
            fcn(result);
        }
    }

    static captureimage (fcn) {
        window.tablet.scratchjr_captureimage(fcn);
    }

    static hidesplash (fcn) {
        window.tablet.hideSplash();
        if (fcn) {
            fcn();
        }
    }

    ///////////////
    // Sharing
    ///////////////


    // Called on the JS side to trigger native UI for project sharing.
    // fileName: name for the file to share
    // emailSubject: subject text to use for an email
    // emailBody: body HTML to use for an email
    // shareType: 0 for Email; 1 for Airdrop
    // b64data: base-64 encoded .SJR file to share

    static sendSjrToShareDialog (fileName, emailSubject, emailBody, shareType, b64data) {
        window.tablet.sendSjrUsingShareDialog(fileName, emailSubject, emailBody, shareType, b64data);
    }

    // // Called on the Objective-C side.  The argument is a base64-encoded .SJR file,
    // // to be unzipped, processed, and stored.
    // static loadProjectFromSjr (b64data) {
    //     try {
    //         IO.loadProjectFromSjr(b64data);
    //     } catch (err) {
    //         var errorMessage = 'Couldn\'t load share -- project data corrupted. ' + err.message;
    //         Alert.open(gn('frame'), gn('frame'), errorMessage, '#ff0000');
    //         console.log(err); // eslint-disable-line no-console
    //         return 0;
    //     }
    //     return 1;
    // }

    // Name of the device/iPad to display on the sharing dialog page
    // fcn is called with the device name as an arg
    static deviceName (fcn) {
        fcn(window.tablet.deviceName());
    }

    static analyticsEvent (category, action, label) {
        window.tablet.analyticsEvent(category, action, label);
    }

    static setAnalyticsPlacePref (preferredPlace) {
        window.tablet.setAnalyticsPlacePref(preferredPlace);
    }

    static setAnalyticsPref (jsonStr) {
        window.tablet.setAnalyticsPref(jsonStr);
    }

    // // Web Wiew delegate call backs
    //
    // static pageError (desc) {
    //     console.log('XCODE ERROR:', desc); // eslint-disable-line no-console
    //     if (window.location.href.indexOf('home.html') > -1) {
    //         if (Lobby.errorTimer) {
    //             Lobby.errorLoading(desc);
    //         }
    //     }
    // }
}

// Expose iOS methods for ScratchJr tablet sharing callbacks
// window.iOS = iOS;
