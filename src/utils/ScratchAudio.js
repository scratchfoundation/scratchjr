import {isAndroid} from './lib';

////////////////////////////////////////////////////
/// Sound Playing
////////////////////////////////////////////////////

export let uiSounds = {};
export let context;
export let firstTime = true;
let defaultSounds = ['cut.wav', 'snap.wav', 'copy.wav', 'grab.wav', 'boing.wav', 'tap.wav',
    'keydown.wav', 'entertap.wav', 'exittap.wav', 'splash.wav'];
export let projectSounds = {};
let path = '';

export default class ScratchAudio {
    static firstClick () { // trick to abilitate the Audio context in iOS 8+
        var res = true;
        if (uiSounds['keydown.wav']) {
            uiSounds['keydown.wav'].playWithVolume(0);
            res = false;
        }
        firstTime = res;
    }

    static firstOnTouchEnd () { // trick to abilitate the Audio context in iOS 9
        if (uiSounds['keydown.wav']) {
            uiSounds['keydown.wav'].playWithVolume(0);
        }
        window.removeEventListener('touchend', ScratchAudio.firstOnTouchEnd, false);
    }

    static sndFX (name) {
        ScratchAudio.sndFXWithVolume(name, 1.0);
    }

    static sndFXWithVolume (name, volume) {
        if (!isAndroid) {
            if (!uiSounds[name]) {
                return;
            }
            uiSounds[name].playWithVolume(volume);
            firstTime = false;
        } else {
            AndroidInterface.audio_sndfxwithvolume(name, volume);
        }
    }

    static init (prefix) {
        if (!prefix) {
            prefix = '';
        }
        if (!isAndroid) {
            context = new webkitAudioContext();
        } else {
            context = {
                decodeAudioData: function () {
                },
                play: function () {
                }
            };
        }
        uiSounds = {};
        for (var i = 0; i < defaultSounds.length; i++) {
            ScratchAudio.addSound(prefix + 'sounds/', defaultSounds[i], uiSounds);
        }
        ScratchAudio.addSound(path, prefix + 'pop.mp3', projectSounds);
    }

    static addSound (url, snd, dict, fcn) {
        if (!isAndroid) {

            var bufferSound = function () {
                context.decodeAudioData(request.response, onDecode, onDecodeError);
            };
            var onDecodeError = function () {
                if (fcn) {
                    fcn('error');
                }
            };
            var onDecode = function (buffer) {
                dict[snd] = new Sound(buffer);
                if (fcn) {
                    fcn(snd);
                }
            };
            var transferFailed = function (e) {
                e.preventDefault();
                e.stopPropagation();
            };
            var request = new XMLHttpRequest();
            request.open('GET', url + snd, true);
            request.responseType = 'arraybuffer';
            request.addEventListener('load', bufferSound, false);
            request.addEventListener('error', transferFailed, false);
            request.send(null);
        } else {
            // In Android, this is handled outside of JavaScript, so just place a stub here.
            dict[snd] = new Sound(url + snd);
            if (fcn) {
                fcn(snd);
            }
        }
    }

    static loadProjectSound (md5, fcn) {
        if (!md5) {
            return;
        }
        if (md5.indexOf('/') > -1) {
            ScratchAudio.loadFromLocal(md5, fcn);
        } else {

            if (md5.indexOf('wav') > -1) {
                if (!isAndroid) {
                    iOS.getmedia(md5, nextStep);
                } else {
                    // On Android, all sounds play server-side
                    ScratchAudio.loadFromLocal(md5, fcn);
                }
            } else {
                ScratchAudio.loadFromLocal(md5, fcn);
            }
        }
        function nextStep (data) {
            ScratchAudio.loadFromData(md5, data, fcn);
        }
    }

    static loadFromLocal (md5, fcn) {
        if (projectSounds[md5] != undefined) {
            return;
        }
        ScratchAudio.addSound(path, md5, projectSounds, fcn);
    }

    static loadFromData (md5, data, fcn) {
        if (!data) {
            projectSounds[md5] = projectSounds['pop.mp3'];
        } else {
            var onDecode = function (buffer) {
                projectSounds[md5] = new Sound(buffer);
                if (fcn) {
                    fcn(md5);
                }
            };
            var onError = function () {
                //	console.log ("error", md5, err);
                if (fcn) {
                    fcn('error');
                }
            };
            var byteString = atob(data); // take out the base 64 encoding
            var buffer = new ArrayBuffer(byteString.length);
            var bytearray = new Uint8Array(buffer);
            for (var i = 0; i < byteString.length; i++) {
                bytearray[i] = byteString.charCodeAt(i);
            }
            context.decodeAudioData(buffer, onDecode, onError);

        }
    }
}

window.addEventListener('touchend', ScratchAudio.firstOnTouchEnd, false);
