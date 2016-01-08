//////////////////////////////////////////////////
//  Tablet interface functions
//////////////////////////////////////////////////

// This file and object are named "iOS" for legacy reasons.
// But, it is also used for the AndroidInterface. All function calls here
// are mapped to Android/iOS native calls.

iOS = function () {};
iOS.path;
iOS.camera;
iOS.database = 'projects';
iOS.mediacounter = 0;
iOS.tabletInterface = null;

iOS.waitForInterface = function (fcn) {
    // Already loaded the interface
    if (iOS.tabletInterface != null) {
        fcn();
        return;
    }

    // Android device
    if (typeof AndroidInterface !== 'undefined') {
        iOS.tabletInterface = AndroidInterface;
        if (fcn) {
            fcn();
        }
        return;
    }

    // iOS device - might not be loaded yet
    if (typeof (window.tablet) != 'object') {
        // Come back in 100ms
        setTimeout(function () {
            iOS.waitForInterface(fcn);
        }, 100);
    } else {
        // All set to run commands
        iOS.tabletInterface = window.tablet;
        if (fcn) {
            fcn();
        }
    }
};


// Database functions
iOS.stmt = function (json, fcn) {
    var result = iOS.tabletInterface.database_stmt(JSON.stringify(json));
    if (typeof (fcn) !== 'undefined') {
        fcn(result);
    }
};

iOS.query = function (json, fcn) {
    var result = iOS.tabletInterface.database_query(JSON.stringify(json));
    if (typeof (fcn) !== 'undefined') {
        fcn(result);
    }
};

iOS.setfield = function (db, id, fieldname, val, fcn) {
    var json = {};
    var keylist = [fieldname + ' = ?', 'mtime = ?'];
    json.values = [val, (new Date()).getTime().toString()];
    json.stmt = 'update ' + db + ' set ' + keylist.toString() + ' where id = ' + id;
    iOS.stmt(json, fcn);
};

// IO functions

iOS.cleanassets = function (ft, fcn) {
    iOS.tabletInterface.io_cleanassets(ft); fcn();
};
iOS.getmedia = function (file, fcn) {
    iOS.mediacounter++;
    var nextStep = function (file, key, whenDone) {
        var result = iOS.tabletInterface.io_getmedialen(file, key);
        iOS.processdata(key, 0, result, '', whenDone);
    };
    nextStep(file, iOS.mediacounter, fcn);
};

iOS.getmediadata = function (key, offset, len, fcn) {
    var result = iOS.tabletInterface.io_getmediadata(key, offset, len);
    if (fcn) {
        fcn(result);
    }
};
iOS.processdata = function (key, off, len, oldstr, fcn) {
    if (len == 0) {
        iOS.getmediadone(key);
        fcn(oldstr);
        return;
    }
    var newlen = (len < 100000) ? len : 100000;
    iOS.getmediadata(key, off, newlen, function (str) {
        iOS.processdata(key, off + newlen, len - newlen, oldstr + str, fcn);
    });
};

iOS.getsettings = function (fcn) {
    var result = iOS.tabletInterface.io_getsettings();
    if (fcn) {
        fcn(result);
    }
};

iOS.getmediadone = function (file, fcn) {
    var result = iOS.tabletInterface.io_getmediadone(file);
    if (fcn) {
        fcn(result);
    }
};
iOS.setmedia = function (str, ext, fcn) {
    var result = iOS.tabletInterface.io_setmedia(str, ext);
    if (fcn) {
        fcn(result);
    }
};
iOS.setmedianame = function (str, name, ext, fcn) {
    var result = iOS.tabletInterface.io_setmedianame(str, name, ext);
    if (fcn) {
        fcn(result);
    }
};

iOS.getmd5 = function (str, fcn) {
    var result = iOS.tabletInterface.io_getmd5(str);
    if (fcn) {
        fcn(result);
    }
};

iOS.remove = function (str, fcn) {
    var result = iOS.tabletInterface.io_remove(str);
    if (fcn) {
        fcn(result);
    }
};


// clears up all your iPad
iOS.getfile = function (str, fcn) {
    var result = iOS.tabletInterface.io_getfile(str);
    if (fcn) {
        fcn(result);
    }
};
iOS.setfile = function (name, str, fcn) {
    var result = iOS.tabletInterface.io_setfile(name, btoa(str));
    if (fcn) {
        fcn(result);
    }
};

// iOS sound

iOS.sndrecord = function (fcn) {
    var result = iOS.tabletInterface.recordsound_recordstart();
    if (fcn) {
        fcn(result);
    }
};
iOS.recordstop = function (fcn) {
    var result = iOS.tabletInterface.recordsound_recordstop();
    if (fcn) {
        fcn(result);
    }
};
iOS.volume = function (fcn) {
    var result = iOS.tabletInterface.recordsound_volume();
    if (fcn) {
        fcn(result);
    }
};
iOS.startplay = function (fcn) {
    var result = iOS.tabletInterface.recordsound_startplay();
    if (fcn) {
        fcn(result);
    }
};
iOS.stopplay = function (fcn) {
    var result = iOS.tabletInterface.recordsound_stopplay();
    if (fcn) {
        fcn(result);
    }
};
iOS.recorddisappear = function (b, fcn) {
    var result = iOS.tabletInterface.recordsound_recordclose(b);
    if (fcn) {
        fcn(result);
    }
};

// Record state
iOS.askpermission = function () {
    if (isiOS) {
        iOS.tabletInterface.askForPermission();
    }
};

// camera functions

iOS.hascamera = function () {
    iOS.camera = iOS.tabletInterface.scratchjr_cameracheck();
};
iOS.startfeed = function (data, fcn) {
    var str = JSON.stringify(data);
    var result = iOS.tabletInterface.scratchjr_startfeed(str);
    if (fcn) {
        fcn(result);
    }
};

iOS.stopfeed = function (fcn) {
    var result = iOS.tabletInterface.scratchjr_stopfeed();
    if (fcn) {
        fcn(result);
    }
};
iOS.choosecamera = function (mode, fcn) {
    var result = iOS.tabletInterface.scratchjr_choosecamera(mode);
    if (fcn) {
        fcn(result);
    }
};
iOS.captureimage = function (fcn) {
    iOS.tabletInterface.scratchjr_captureimage(fcn);
};
iOS.hidesplash = function (fcn) {
    if (isiOS) {
        iOS.tabletInterface.hideSplash();
    }
    if (fcn) {
        fcn();
    }
};

iOS.trace = function (str) {
    console.log(str); // eslint-disable-line no-console
};
iOS.parse = function (str) {
    console.log(JSON.parse(str)); // eslint-disable-line no-console
};
iOS.tracemedia = function (str) {
    console.log(atob(str)); // eslint-disable-line no-console
};
iOS.ignore = function () {};

///////////////
// Sharing
///////////////


// Called on the JS side to trigger native UI for project sharing.
// fileName: name for the file to share
// emailSubject: subject text to use for an email
// emailBody: body HTML to use for an email
// shareType: 0 for Email; 1 for Airdrop
// b64data: base-64 encoded .SJR file to share

iOS.sendSjrToShareDialog = function (fileName, emailSubject, emailBody, shareType, b64data) {
    iOS.tabletInterface.sendSjrUsingShareDialog(fileName, emailSubject, emailBody, shareType, b64data);
};

// Called on the Objective-C side.  The argument is a base64-encoded .SJR file,
// to be unzipped, processed, and stored.
iOS.loadProjectFromSjr = function (b64data) {
    try {
        IO.loadProjectFromSjr(b64data);
    } catch (err) {
        var errorMessage = 'Couldn\'t load share -- project data corrupted. ' + err.message;
        Alert.open(gn('frame'), gn('frame'), errorMessage, '#ff0000');
        console.log(err); // eslint-disable-line no-console
        return 0;
    }
    return 1;
};

// Name of the device/iPad to display on the sharing dialog page
// fcn is called with the device name as an arg
iOS.deviceName = function (fcn) {
    fcn(iOS.tabletInterface.deviceName());
};

iOS.analyticsEvent = function (category, action, label, value) {
    if (!label) {
        label = '';
    }
    if (!value) {
        value = 1;
    }
    iOS.tabletInterface.analyticsEvent(category, action, label, value);
};

// Web Wiew delegate call backs

iOS.pageError = function (desc) {
    console.log('XCODE ERROR:', desc); // eslint-disable-line no-console
    if (window.location.href.indexOf('home.html') > -1) {
        if (Lobby.errorTimer) {
            Lobby.errorLoading(desc);
        }
    }
};
