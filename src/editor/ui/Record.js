var Record = function () {};

Record.isAndroid = isAndroid;
Record.interval = null;
Record.recordedSound = null;
Record.isRecording = false;
Record.isPlaying = false;
Record.available = true;
Record.error = false;
Record.dialogOpen = false;
Record.timeLimit = null;
Record.playTimeLimit = null;

// Create the recording window, including buttons and volume indicators
Record.init = function () {
    var modal = newHTML('div', 'record fade', frame);
    modal.setAttribute('id', 'recorddialog');
    var topbar = newHTML('div', 'toolbar', modal);
    var actions = newHTML('div', 'actions', topbar);
    newHTML('div', 'microphone', actions);
    var buttons = newHTML('div', 'recordbuttons', actions);
    var okbut = newHTML('div', 'recorddone', buttons);
    if (isTablet) {
        okbut.ontouchstart = Record.saveSoundAndClose;
    } else {
        okbut.onmousedown = Record.saveSoundAndClose;
    }
    var sc = newHTML('div', 'soundbox', modal);
    sc.setAttribute('id', 'soundbox');
    var sv = newHTML('div', 'soundvolume', sc);
    sv.setAttribute('id', 'soundvolume');
    for (var i = 0; i < 13; i++) {
        var si = newHTML('div', 'indicator', sv);
        newHTML('div', 'soundlevel', si);
    }
    var ctrol = newHTML('div', 'soundcontrols', sc);
    ctrol.setAttribute('id', 'soundcontrols');
    var lib = [['record', Record.record], ['stop', Record.stopSnd], ['play', Record.playSnd]];
    for (var j = 0; j < lib.length; j++) {
        Record.newToggleClicky(ctrol, 'id_', lib[j][0], lib[j][1]);
    }
};

// Dialog box hide/show
Record.appear = function () {
    gn('backdrop').setAttribute('class', 'modal-backdrop fade in');
    setProps(gn('backdrop').style, {
        display: 'block'
    });
    gn('recorddialog').setAttribute('class', 'record fade in');
    ScratchJr.stopStrips();
    Record.dialogOpen = true;
    ScratchJr.onBackButtonCallback.push(Record.saveSoundandClose);
};

Record.disappear = function () {
    setTimeout(function () {
        gn('backdrop').setAttribute('class', 'modal-backdrop fade');
        setProps(gn('backdrop').style, {
            display: 'none'
        });
        gn('recorddialog').setAttribute('class', 'record fade');
    }, 333);
    Record.dialogOpen = false;
    ScratchJr.onBackButtonCallback.pop();
};

// Register toggle buttons and handlers
Record.newToggleClicky = function (p, prefix, key, fcn) {
    var button = newHTML('div', 'controlwrap', p);
    newHTML('div', key + 'snd off', button);
    button.setAttribute('type', 'toggleclicky');
    button.setAttribute('id', prefix + key);
    if (fcn) {
        if (isTablet) {
            button.ontouchstart = function (evt) {
                fcn(evt);
            };
        } else {
            button.onmousedown = function (evt) {
                fcn(evt);
            };
        }
    }
    return button;
};

// Toggle button appearance on/off
Record.toggleButtonUI = function (button, newState) {
    var element = 'id_' + button;
    var newStateStr = (newState) ? 'on' : 'off';
    var attrclass = button + 'snd';
    gn(element).childNodes[0].setAttribute('class', attrclass + ' ' + newStateStr);
};

// Volume UI updater
Record.updateVolume = function (f) {
    var num = Math.round(f * 13);
    var div = gn('soundvolume');
    if (!Record.isRecording) {
        num = 0;
    }
    for (var i = 0; i < 13; i++) {
        div.childNodes[i].childNodes[0].setAttribute('class', ((i > num) ? 'soundlevel off' : 'soundlevel on'));
    }
};

// Stop recording UI and turn off volume levels
Record.recordUIoff = function () {
    Record.toggleButtonUI('record', false);
    var div = gn('soundvolume');
    for (var i = 0; i < gn('soundvolume').childElementCount; i++) {
        div.childNodes[i].childNodes[0].setAttribute('class', 'soundlevel off');
    }
};

// On press record button
Record.record = function (e) {
    if (Record.error) {
        Record.killRecorder(e);
        return;
    }
    if (Record.isPlaying) {
        Record.stopPlayingSound(doRecord);
    } else {
        doRecord();
    }
    function doRecord () {
        if (Record.isRecording) {
            Record.stopRecording(); // Stop if we're already recording
        } else {
            iOS.sndrecord(Record.startRecording); // Start a recording
        }
    }
};

Record.startRecording = function (filename) {
    if (parseInt(filename) < 0) {
        // Error in getting record filename - go back to editor
        Record.recordedSound = undefined;
        Record.isRecording = false;
        Record.killRecorder();
        Palette.selectCategory(3);
    } else {
        // Save recording's filename for later
        Record.recordedSound = filename;
        Record.isRecording = true;
        Record.error = false;
        Record.soundname = filename;
        Record.toggleButtonUI('record', true);
        var poll = function () {
            iOS.volume(Record.updateVolume, Record.recordError);
        };
        Record.interval = setInterval(poll, 33);
        Record.timeLimit = setTimeout(function () {
            if (Record.isRecording) {
                Record.stopRecording();
            }
        }, 60000);
    }
};

// Press the play button
Record.playSnd = function (e) {
    if (Record.error) {
        Record.killRecorder(e);
        return;
    }
    if (!Record.recordedSound) {
        return;
    }
    if (Record.isPlaying) {
        Record.stopPlayingSound();
    } else {
        if (Record.isRecording) {
            Record.stopRecording(Record.startPlaying);
        } else {
            Record.startPlaying();
        }
    }
};

// Start playing the sound and switch UI appropriately
Record.startPlaying = function () {
    iOS.startplay(Record.timeOutPlay);
    Record.toggleButtonUI('play', true);
    Record.isPlaying = true;
};

// Gets the sound duration from iOS and changes play UI state after time
Record.timeOutPlay = function (timeout) {
    if (parseInt(timeout) < 0) {
        timeout = 0.1; // Error - stop playing immediately
    }
    Record.playTimeLimit = setTimeout(function () {
        Record.toggleButtonUI('play', false);
        Record.isPlaying = false;
    }, timeout * 1000);
};

// Press on stop
Record.stopSnd = function (e) {
    if (Record.error) {
        Record.killRecorder(e);
        return;
    }
    if (!Record.recordedSound) {
        return;
    }
    Record.flashStopButton();
    if (Record.isRecording) {
        Record.stopRecording();
    } else if (Record.isPlaying) {
        Record.stopPlayingSound();
    }
};

Record.flashStopButton = function () {
    Record.toggleButtonUI('stop', true);
    setTimeout(function () {
        Record.toggleButtonUI('stop', false);
    }, 200);
};

// Stop playing the sound and switch UI appropriately
Record.stopPlayingSound = function (fcn) {
    iOS.stopplay(fcn);
    Record.toggleButtonUI('play', false);
    Record.isPlaying = false;
    window.clearTimeout(Record.playTimeLimit);
    Record.playTimeLimit = null;
};

// Stop the volume monitor and recording
Record.stopRecording = function (fcn) {
    if (Record.timeLimit != null) {
        clearTimeout(Record.timeLimit);
        Record.timeLimit = null;
    }
    if (Record.interval != null) {
        window.clearInterval(Record.interval);
        Record.interval = null;
        setTimeout(function () {
            Record.volumeCheckStopped(fcn);
        }, 33);
    } else {
        Record.volumeCheckStopped(fcn);
    }
};

Record.volumeCheckStopped = function (fcn) {
    Record.isRecording = false;
    Record.recordUIoff();
    iOS.recordstop(fcn);
};

// Press OK (check)
Record.saveSoundAndClose = function () {
    if (Record.error || !Record.recordedSound) {
        Record.killRecorder();
    } else {
        if (Record.isPlaying) {
            Record.stopPlayingSound(Record.closeContinueSave);
        } else {
            if (Record.isRecording) {
                Record.stopRecording(Record.closeContinueSave);
            } else {
                Record.closeContinueSave();
            }
        }
    }
};

Record.closeContinueSave = function () {
    iOS.recorddisappear('YES', Record.getUserSound);
};

Record.closeContinueRemove = function () {
    // don't get the sound - proceed right to tearDown
    iOS.recorddisappear('NO', Record.tearDownRecorder);
};

Record.getUserSound = function () {
    Record.isRecording = false;
    if (!Record.isAndroid) {
        iOS.getmedia(Record.recordedSound, Record.registerProjectSound);
    } else {
        // On Android, just pass URL
        Record.registerProjectSound(null);
    }
};

Record.registerProjectSound = function (data) {
    function loadingDone (snd) {
        if (snd != 'error') {
            var spr = ScratchJr.getSprite();
            var page = spr.div.parentNode.owner;
            spr.sounds.push(Record.recordedSound);
            Undo.record({
                action: 'recordsound',
                who: spr.id,
                where: page.id,
                sound: Record.recordedSound
            });
            ScratchJr.storyStart('Record.registerProjectSound');
        }
        Record.tearDownRecorder();
        Palette.selectCategory(3);
    }
    if (!Record.isAndroid) {
        ScratchAudio.loadFromData(Record.recordedSound, data, loadingDone);
    } else {
        // On Android, just pass URL
        ScratchAudio.loadFromLocal(Record.recordedSound, loadingDone);
    }
};

// Called on error - remove everything and hide the recorder
Record.killRecorder = function () {
    // Inform iOS and then tear-down
    if (Record.isPlaying) {
        Record.stopPlayingSound(Record.closeContinueRemove); // stop playing and tear-down
    } else {
        if (Record.isRecording) {
            Record.stopRecording(Record.closeContinueRemove); // stop recording and tear-down
        } else {
            Record.closeContinueRemove();
        }
    }
};

Record.tearDownRecorder = function () {
    // Clear errors
    if (Record.error) {
        Record.error = false;
    }
    // Refresh audio context
    ScratchAudio.firstTime = true;
    Record.isRecording = false;
    Record.recordedSound = null;
    // Hide the dialog
    Record.disappear();
};

// Called when the app is put into the background
Record.recordError = function () {
    Record.error = true;
    Record.killRecorder();
};
