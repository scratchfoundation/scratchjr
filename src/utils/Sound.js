import {isAndroid} from './lib';
import iOS from '../iPad/iOS';

export default class Sound {
    constructor (name, time) {
        if (isAndroid) {
            this.url = name;
            this.soundPlayId = null;
        } else {
            this.name = name;
            this.time = time;
            this.playing = false;
        }
    }

    play () {
        if (isAndroid) {
            if (this.soundPlayId) {
                this.stop();
            }
            this.soundPlayId = AndroidInterface.audio_play(this.url, 1.0);
        } else {
            if (this.playing) {
                this.stop();
            }
            iOS.playSound(this.name);
            this.playing = true;
        }
    }

    done () {
        if (isAndroid) {
            return (this.soundPlayId == null) || !AndroidInterface.audio_isplaying(this.soundPlayId);
        } else {
            return (!this.playing);
        }
    }

    clear () {
        if (isAndroid) {
            this.soundPlayId = null;
        } else {
            this.playing = false;
        }
    }

    stop () {
        if (isAndroid) {
            if (this.soundPlayId) {
                AndroidInterface.audio_stop(this.soundPlayId);
            }
            this.soundPlayId = null;
        } else {
            iOS.stopSound(this.name);
            this.playing = false;
        }
    }
}
