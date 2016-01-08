var Sound = function (buffer) {
    if (isAndroid) {
        this.url = buffer;
        this.soundPlayId = null;
    } else {
        this.buffer = buffer;
        this.source = null;
    }
};

Sound.prototype.play = function () {
    if (isAndroid) {
        if (this.soundPlayId) {
            this.stop();
        }
        this.soundPlayId = AndroidInterface.audio_play(this.url, 1.0);
    } else {
        if (this.source) {
            this.stop();
        }
        this.source = ScratchAudio.context.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(ScratchAudio.context.destination);
        this.source.noteOn(0);
    }
};

Sound.prototype.playWithVolume = function (n) {
    if (isAndroid) {
        if (this.soundPlayId) {
            this.stop();
        }

        if (n > 0) {
            // This method is not currently called with any value other than 0. If 0, don't play the sound.
            this.soundPlayId = AndroidInterface.audio_play(this.url, n);
        }
    } else {
        if (this.source) {
            this.stop();
        }
        this.gainNode = ScratchAudio.context.createGainNode();
        this.source = ScratchAudio.context.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(this.gainNode);
        this.gainNode.connect(ScratchAudio.context.destination);
        this.source.noteOn(0);
        this.gainNode.gain.value = n;
    }
};

Sound.prototype.done = function () {
    if (isAndroid) {
        return (this.soundPlayId == null) || !AndroidInterface.audio_isplaying(this.soundPlayId);
    } else {
        return (this.source == null) || (this.source.playbackState == 3);
    }
};
Sound.prototype.clear = function () {
    if (isAndroid) {
        this.soundPlayId = null;
    } else {
        this.source = null;
    }
};

Sound.prototype.stop = function () {
    if (isAndroid) {
        if (this.soundPlayId) {
            AndroidInterface.audio_stop(this.soundPlayId);
        }
        this.soundPlayId = null;
    } else {
        this.source.noteOff(0);
        this.source = null;
    }
};
