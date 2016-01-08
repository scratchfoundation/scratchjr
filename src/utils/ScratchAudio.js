////////////////////////////////////////////////////
/// Sound Playing
////////////////////////////////////////////////////

ScratchAudio = function () {};

ScratchAudio.isAndroid = isAndroid;
ScratchAudio.uiSounds = {};
ScratchAudio.context;
ScratchAudio.firstTime = true;
ScratchAudio.defaultSounds = ['cut.wav', 'snap.wav', 'copy.wav', 'grab.wav', 'boing.wav', 'tap.wav',
    'keydown.wav', 'entertap.wav', 'exittap.wav', 'splash.wav'];
ScratchAudio.projectSounds = {};
ScratchAudio.path = '';

ScratchAudio.firstClick = function () { // trick to abilitate the Audio context in iOS 8+
    var res = true;
    if (ScratchAudio.uiSounds['keydown.wav']) {
        ScratchAudio.uiSounds['keydown.wav'].playWithVolume(0);
        res = false;
    }
    ScratchAudio.firstTime = res;
};

ScratchAudio.firstOnTouchEnd = function () { // trick to abilitate the Audio context in iOS 9
    if (ScratchAudio.uiSounds['keydown.wav']) {
        ScratchAudio.uiSounds['keydown.wav'].playWithVolume(0);
    }
    window.removeEventListener('touchend', ScratchAudio.firstOnTouchEnd, false);
};

ScratchAudio.sndFX = function (name) {
    ScratchAudio.sndFXWithVolume(name, 1.0);
};

ScratchAudio.sndFXWithVolume = function (name, volume) {
    if (!ScratchAudio.isAndroid) {
        if (!ScratchAudio.uiSounds[name]) {
            return;
        }
        ScratchAudio.uiSounds[name].playWithVolume(volume);
        ScratchAudio.firstTime = false;
    } else {
        AndroidInterface.audio_sndfxwithvolume(name, volume);
    }
};

ScratchAudio.init = function (prefix) {
    if (!prefix) {
        prefix = '';
    }
    if (!ScratchAudio.isAndroid) {
        ScratchAudio.context = new webkitAudioContext();
    } else {
        ScratchAudio.context = {
            decodeAudioData: function () {
            },
            play: function () {
            }
        };
    }
    ScratchAudio.context.sampleRate = 44100;
    ScratchAudio.uiSounds = {};
    for (var i = 0; i < ScratchAudio.defaultSounds.length; i++) {
        ScratchAudio.addSound(prefix + 'sounds/', ScratchAudio.defaultSounds[i], ScratchAudio.uiSounds);
    }
    ScratchAudio.addSound(ScratchAudio.path, prefix + 'pop.mp3', ScratchAudio.projectSounds);
};

ScratchAudio.addSound = function (url, snd, dict, fcn) {
    if (!ScratchAudio.isAndroid) {

        var bufferSound = function () {
            ScratchAudio.context.decodeAudioData(request.response, onDecode, onDecodeError);
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
};

ScratchAudio.loadProjectSound = function (md5, fcn) {
    if (!md5) {
        return;
    }
    if (md5.indexOf('/') > -1) {
        ScratchAudio.loadFromLocal(md5, fcn);
    } else {

        if (md5.indexOf('wav') > -1) {
            if (!ScratchAudio.isAndroid) {
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
};

ScratchAudio.loadFromLocal = function (md5, fcn) {
    if (ScratchAudio.projectSounds[md5] != undefined) {
        return;
    }
    ScratchAudio.addSound(ScratchAudio.path, md5, ScratchAudio.projectSounds, fcn);
};

ScratchAudio.loadFromData = function (md5, data, fcn) {
    if (!data) {
        ScratchAudio.projectSounds[md5] = ScratchAudio.projectSounds['pop.mp3'];
    } else {
        var onDecode = function (buffer) {
            ScratchAudio.projectSounds[md5] = new Sound(buffer);
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
        ScratchAudio.context.decodeAudioData(buffer, onDecode, onError);

    }
};

window.addEventListener('touchend', ScratchAudio.firstOnTouchEnd, false);
