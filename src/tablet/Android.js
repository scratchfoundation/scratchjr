//////////////////////////////////////////////////
//  Android interface functions
//  AndroidInterface will be the class defined for all the native function calls
//////////////////////////////////////////////////

let mediacounter = 0;

export default class Android {
    // Database functions
    static stmt (json, fcn) {
        var result = AndroidInterface.database_stmt(JSON.stringify(json));
        if (typeof (fcn) !== 'undefined') {
            fcn(result);
        }
    }

    static query (json, fcn) {
        var result = AndroidInterface.database_query(JSON.stringify(json));
        if (typeof (fcn) !== 'undefined') {
            fcn(result);
        }
    }

    // marty functions
    static martyCmd (json, fcn) {
        const result = AndroidInterface.marty_cmd(JSON.stringify(json));
        if (typeof (fcn) !== 'undefined') {
            fcn(result);
        }
    }


    // IO functions

    static cleanassets (ft, fcn) {
        AndroidInterface.io_cleanassets(ft); fcn();
    }

    static getmedia (file, fcn) {
        mediacounter++;
        var nextStep = function (file, key, whenDone) {
            var result = AndroidInterface.io_getmedialen(file, key);
            Android.processdata(key, 0, result, '', whenDone);
        };
        nextStep(file, mediacounter, fcn);
    }

    static getmediadata (key, offset, len, fcn) {
        var result = AndroidInterface.io_getmediadata(key, offset, len);
        if (fcn) {
            fcn(result);
        }
    }

    static processdata (key, off, len, oldstr, fcn) {
        if (len == 0) {
            Android.getmediadone(key);
            fcn(oldstr);
            return;
        }
        var newlen = (len < 100000) ? len : 100000;
        Android.getmediadata(key, off, newlen, function (str) {
            Android.processdata(key, off + newlen, len - newlen, oldstr + str, fcn);
        });
    }

    static getsettings (fcn) {
        var result = AndroidInterface.io_getsettings();
        if (fcn) {
            fcn(result);
        }
    }

    static getmediadone (file, fcn) {
        var result = AndroidInterface.io_getmediadone(file);
        if (fcn) {
            fcn(result);
        }
    }

    static setmedia (str, ext, fcn) {
        var result = AndroidInterface.io_setmedia(str, ext);
        if (fcn) {
            fcn(result);
        }
    }

    static setmedianame (str, name, ext, fcn) {
        var result = AndroidInterface.io_setmedianame(str, name, ext);
        if (fcn) {
            fcn(result);
        }
    }

    static getmd5 (str, fcn) {
        var result = AndroidInterface.io_getmd5(str);
        if (fcn) {
            fcn(result);
        }
    }

    static remove (str, fcn) {
        var result = AndroidInterface.io_remove(str);
        if (fcn) {
            fcn(result);
        }
    }

    static getfile (str, fcn) {
        var result = AndroidInterface.io_getfile(str);
        if (fcn) {
            fcn(result);
        }
    }

    static setfile (name, str, fcn) {
        var result = AndroidInterface.io_setfile(name, btoa(str));
        if (fcn) {
            fcn(result);
        }
    }

    // Sound functions

    static registerSound (dir, name, fcn) {
        var result = AndroidInterface.io_registersound(dir, name);
        if (fcn) {
            fcn(result);
        }
    }

    static playSound (name, fcn) {
        var result = AndroidInterface.io_playsound(name);
        if (fcn) {
            fcn(result);
        }
    }

    static stopSound (name, fcn) {
        var result = AndroidInterface.io_stopsound(name);
        if (fcn) {
            fcn(result);
        }
    }

    // Web Wiew delegate call backs

    static sndrecord (fcn) {
        var result = AndroidInterface.recordsound_recordstart();
        if (fcn) {
            fcn(result);
        }
    }

    static recordstop (fcn) {
        var result = AndroidInterface.recordsound_recordstop();
        if (fcn) {
            fcn(result);
        }
    }

    static volume (fcn) {
        var result = AndroidInterface.recordsound_volume();
        if (fcn) {
            fcn(result);
        }
    }

    static startplay (fcn) {
        var result = AndroidInterface.recordsound_startplay();
        if (fcn) {
            fcn(result);
        }
    }

    static stopplay (fcn) {
        var result = AndroidInterface.recordsound_stopplay();
        if (fcn) {
            fcn(result);
        }
    }

    static recorddisappear (b, fcn) {
        var result = AndroidInterface.recordsound_recordclose(b);
        if (fcn) {
            fcn(result);
        }
    }

    // camera functions

    static hascamera () {
        return AndroidInterface.scratchjr_cameracheck();
    }

    static startfeed (data, fcn) {
        var str = JSON.stringify(data);
        var result = AndroidInterface.scratchjr_startfeed(str);
        if (fcn) {
            fcn(result);
        }
    }

    static stopfeed (fcn) {
        var result = AndroidInterface.scratchjr_stopfeed();
        if (fcn) {
            fcn(result);
        }
    }

    static choosecamera (mode, fcn) {
        var result = AndroidInterface.scratchjr_choosecamera(mode);
        if (fcn) {
            fcn(result);
        }
    }

    static captureimage (fcn) {
        AndroidInterface.scratchjr_captureimage(fcn);
    }

    static hidesplash (fcn) {
        // just call funct, splash is hidden in native code
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
        AndroidInterface.sendSjrUsingShareDialog(fileName, emailSubject, emailBody, shareType, b64data);
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
        fcn(AndroidInterface.deviceName());
    }

    static analyticsEvent (category, action, label) {
        AndroidInterface.analyticsEvent(category, action, label);
    }

    static setAnalyticsPlacePref (preferredPlace) {
        AndroidInterface.setAnalyticsPlacePref(preferredPlace);
    }

    static setAnalyticsPref (key, value) {
        AndroidInterface.setAnalyticsPref(key, value);
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

// // Expose Android methods for ScratchJr tablet sharing callbacks
// window.Android = Android;
