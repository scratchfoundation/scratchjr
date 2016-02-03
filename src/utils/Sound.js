import {isAndroid} from './lib';
import ScratchAudio from './ScratchAudio';

export default class Sound {
    constructor (buffer) {
        if (isAndroid) {
            this.url = buffer;
            this.soundPlayId = null;
        } else {
            this.buffer = buffer;
            this.source = null;
        }
    }

    play () {
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
    }

    playWithVolume (n) {
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
    }

    done () {
        if (isAndroid) {
            return (this.soundPlayId == null) || !AndroidInterface.audio_isplaying(this.soundPlayId);
        } else {
            return (this.source == null) || (this.source.playbackState == 3);
        }
    }

    clear () {
        if (isAndroid) {
            this.soundPlayId = null;
        } else {
            this.source = null;
        }
    }

    stop () {
        if (isAndroid) {
            if (this.soundPlayId) {
                AndroidInterface.audio_stop(this.soundPlayId);
            }
            this.soundPlayId = null;
        } else {
            this.source.noteOff(0);
            this.source = null;
        }
    }
}
