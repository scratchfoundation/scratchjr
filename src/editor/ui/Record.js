import ScratchJr from '../ScratchJr';
import Palette from './Palette';
import Undo from './Undo';
import OS from '../../tablet/OS';
import ScratchAudio from '../../utils/ScratchAudio';
import {frame, gn, newHTML, isAndroid, setProps} from '../../utils/lib';

let interval = null;
let recordedSound = null;
let isRecording = false;
let isPlaying = false;
let available = true;
let error = false;
let dialogOpen = false;
let timeLimit = null;
let playTimeLimit = null;

let volumeIndex = 0;
let volumes = [];

export default class Record {
    static get available () {
        return available;
    }

    static set available (newAvailable) {
        available = newAvailable;
    }

    static get dialogOpen () {
        return dialogOpen;
    }

    // Create the recording window, including buttons and volume indicators
    static init () {
        var modal = newHTML('div', 'record fade', frame);
        modal.setAttribute('id', 'recorddialog');
        var topbar = newHTML('div', 'toolbar', modal);
        var actions = newHTML('div', 'actions', topbar);
        newHTML('div', 'microphone', actions);
        var buttons = newHTML('div', 'recordbuttons', actions);
        var okbut = newHTML('div', 'recorddone', buttons);
        okbut.onclick = Record.saveSoundAndClose;
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
    }

    // Dialog box hide/show
    static appear () {
        OS.analyticsEvent('editor', 'record_dialog_open');
        gn('backdrop').setAttribute('class', 'modal-backdrop fade in');
        setProps(gn('backdrop').style, {
            display: 'block'
        });
        gn('recorddialog').setAttribute('class', 'record fade in');
        ScratchJr.stopStrips();
        dialogOpen = true;
        ScratchJr.onBackButtonCallback.push(Record.saveSoundandClose);
    }

    static disappear () {
        OS.analyticsEvent('editor', 'record_dialog_close');
        setTimeout(function () {
            gn('backdrop').setAttribute('class', 'modal-backdrop fade');
            setProps(gn('backdrop').style, {
                display: 'none'
            });
            gn('recorddialog').setAttribute('class', 'record fade');
        }, 333);
        dialogOpen = false;
        ScratchJr.onBackButtonCallback.pop();
    }

    // Register toggle buttons and handlers
    static newToggleClicky (p, prefix, key, fcn) {
        var button = newHTML('div', 'controlwrap', p);
        newHTML('div', key + 'snd off', button);
        button.setAttribute('type', 'toggleclicky');
        button.setAttribute('id', prefix + key);
        if (fcn) {
            button.onclick = function (evt) {
                fcn(evt);
            };
        }
        return button;
    }

    // Toggle button appearance on/off
    static toggleButtonUI (button, newState) {
        var element = 'id_' + button;
        var newStateStr = (newState) ? 'on' : 'off';
        var attrclass = button + 'snd';
        gn(element).childNodes[0].setAttribute('class', attrclass + ' ' + newStateStr);
    }

    // Volume UI updater
    static updateVolume (f) {
        var num = Math.round(f * 13);
        var div = gn('soundvolume');
        if (!isRecording && !isPlaying) {
            num = 0;
        }
        for (var i = 0; i < 13; i++) {
            div.childNodes[i].childNodes[0].setAttribute('class', ((i > num) ? 'soundlevel off' : 'soundlevel on'));
        }
    }

    // Stop recording UI and turn off volume levels
    static recordUIoff () {
        Record.toggleButtonUI('record', false);
        var div = gn('soundvolume');
        for (var i = 0; i < gn('soundvolume').childElementCount; i++) {
            div.childNodes[i].childNodes[0].setAttribute('class', 'soundlevel off');
        }
    }

    // On press record button
    static record (e) {
        if (error) {
            Record.killRecorder(e);
            return;
        }
        if (isPlaying) {
            Record.stopPlayingSound(doRecord);
        } else {
            doRecord();
        }
        function doRecord () {
            if (isRecording) {
                Record.stopRecording(); // Stop if we're already recording
            } else {
                OS.sndrecord(Record.startRecording); // Start a recording
            }
        }
    }

    static startRecording (filename) {
        OS.analyticsEvent('editor', 'start_recording');
        volumes = [];
        if (parseInt(filename) < 0) {
            // Error in getting record filename - go back to editor
            recordedSound = undefined;
            isRecording = false;
            Record.killRecorder();
            Palette.selectCategory(3);
        } else {
            // Save recording's filename for later
            recordedSound = filename;
            isRecording = true;
            error = false;
            Record.soundname = filename;
            Record.toggleButtonUI('record', true);
            var poll = function () {
                OS.volume(function (f) {
                    volumes.push(f);
                    Record.updateVolume(f);
                });
            };
            interval = setInterval(poll, 33);
            timeLimit = setTimeout(function () {
                if (isRecording) {
                    Record.stopRecording();
                }
            }, 30000);
        }
    }

    // Press the play button
    static playSnd (e) {
        if (error) {
            Record.killRecorder(e);
            return;
        }
        if (!recordedSound) {
            return;
        }
        if (isPlaying) {
            Record.stopPlayingSound();
        } else {
            if (isRecording) {
                Record.stopRecording(Record.startPlaying);
            } else {
                Record.startPlaying();
            }
        }
    }

    // Start playing the sound and switch UI appropriately
    static startPlaying () {
        OS.startplay(Record.timeOutPlay);
        Record.toggleButtonUI('play', true);
        isPlaying = true;
        volumeIndex = 0;
        var poll = function () {
            let f = 0;
            if (volumeIndex < volumes.length) {
                f = volumes[volumeIndex];
                volumeIndex++;
            }
            Record.updateVolume(f);
        };
        interval = setInterval(poll, 33);
    }

    // Gets the sound duration from iOS and changes play UI state after time
    static timeOutPlay (timeout) {
        if (parseInt(timeout) < 0) {
            timeout = 0.1; // Error - stop playing immediately
        }
        playTimeLimit = setTimeout(function () {
            Record.toggleButtonUI('play', false);
            isPlaying = false;
            if (interval) {
                clearTimeout(interval);
                interval = null;
            }
        }, timeout * 1000);
    }

    // Press on stop
    static stopSnd (e) {
        if (error) {
            Record.killRecorder(e);
            return;
        }
        if (!recordedSound) {
            return;
        }
        Record.flashStopButton();
        if (isRecording) {
            Record.stopRecording();
        } else if (isPlaying) {
            Record.stopPlayingSound();
        }
    }

    static flashStopButton () {
        Record.toggleButtonUI('stop', true);
        setTimeout(function () {
            Record.toggleButtonUI('stop', false);
        }, 200);
    }

    // Stop playing the sound and switch UI appropriately
    static stopPlayingSound (fcn) {
        OS.stopplay(fcn);
        Record.toggleButtonUI('play', false);
        isPlaying = false;
        window.clearTimeout(playTimeLimit);
        playTimeLimit = null;
    }

    // Stop the volume monitor and recording
    static stopRecording (fcn) {
        OS.analyticsEvent('editor', 'stop_recording');
        if (timeLimit != null) {
            clearTimeout(timeLimit);
            timeLimit = null;
        }
        if (interval != null) {
            window.clearInterval(interval);
            interval = null;
            setTimeout(function () {
                Record.volumeCheckStopped(fcn);
            }, 33);
        } else {
            Record.volumeCheckStopped(fcn);
        }
    }

    static volumeCheckStopped (fcn) {
        isRecording = false;
        Record.recordUIoff();
        OS.recordstop(fcn);
    }

    // Press OK (check)
    static saveSoundAndClose () {
        if (error || !recordedSound) {
            Record.killRecorder();
        } else {
            if (isPlaying) {
                Record.stopPlayingSound(Record.closeContinueSave);
            } else {
                if (isRecording) {
                    Record.stopRecording(Record.closeContinueSave);
                } else {
                    Record.closeContinueSave();
                }
            }
        }
    }

    static closeContinueSave () {
        OS.recorddisappear('YES', Record.registerProjectSound);
    }

    static closeContinueRemove () {
        // don't get the sound - proceed right to tearDown
        OS.recorddisappear('NO', Record.tearDownRecorder);
    }

    static registerProjectSound () {
        function whenDone (snd) {
            if (snd != 'error') {
                var spr = ScratchJr.getSprite();
                var page = spr.div.parentNode.owner;
                spr.sounds.push(recordedSound);
                Undo.record({
                    action: 'recordsound',
                    who: spr.id,
                    where: page.id,
                    sound: recordedSound
                });
                ScratchJr.storyStart('Record.registerProjectSound');
            }
            Record.tearDownRecorder();
            Palette.selectCategory(3);
        }
        if (!isAndroid) {
            ScratchAudio.loadFromLocal('Documents', recordedSound, whenDone);
        } else {
            // On Android, just pass URL
            ScratchAudio.loadFromLocal('', recordedSound, whenDone);
        }
    }

    // Called on error - remove everything and hide the recorder
    static killRecorder () {
        // Inform iOS and then tear-down
        if (isPlaying) {
            Record.stopPlayingSound(Record.closeContinueRemove); // stop playing and tear-down
        } else {
            if (isRecording) {
                Record.stopRecording(Record.closeContinueRemove); // stop recording and tear-down
            } else {
                Record.closeContinueRemove();
            }
        }
    }

    static tearDownRecorder () {
        // Clear errors
        if (error) {
            error = false;
        }
        // Refresh audio context
        isRecording = false;
        recordedSound = null;
        // Hide the dialog
        Record.disappear();
    }

    // Called when the app is put into the background
    static recordError () {
        error = true;
        Record.killRecorder();
    }
}
