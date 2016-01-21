import Prims from './Prims';
import Grid from '../ui/Grid';
import Vector from '../../geom/Vector';

export default class Thread {
    constructor (s, block) {
        this.firstBlock = block.findFirst();
        this.thisblock = block;
        this.oldblock = null;
        this.spr = s;
        this.audio = undefined;
        this.stack = [];
        this.firstTime = true;
        this.count = -1;
        this.waitTimer = 0;
        this.distance = -1;
        this.called = [];
        this.vector = {
            x: 0,
            y: 0
        };
        this.isRunning = true;
        this.time = 0; // for debugging purposes
        return this;
    }

    clear () {
        this.stack = [];
        this.firstTime = true;
        this.count = -1;
        this.waitTimer = 0;
        this.vector = {
            x: 0,
            y: 0
        };
        this.distance = -1;
        this.called = [];
        this.thisblock = this.firstBlock;
    }

    duplicate () {
        var thread = new Thread(this.spr, this.firstBlock);
        thread.count = -1;
        thread.firstBlock = this.firstBlock;
        thread.thisblock = this.thisblock;
        thread.oldblock = null;
        thread.spr = this.spr;
        thread.stack = this.stack;
        thread.firstTime = this.firstTime;
        thread.vector = {
            x: 0,
            y: 0
        };
        thread.waitTimer = 0;
        thread.distance = -1;
        thread.called = this.called;
        thread.isRunning = this.isRunning;
        return thread;
    }

    deselect (b) {
        while (b != null) {
            b.unhighlight();
            if (b.inside) {
                b.repeatCounter = -1;
                this.deselect(b.inside);
            }
            b = b.next;
        }
    }

    stop (b) {
        this.stopping(b);
        this.isRunning = false;
    }

    stopping (b) {
        this.endPrim(b);
        this.deselect(this.firstBlock);
        this.clear();
        this.spr.closeBalloon();
    }

    endPrim (stopMine) {
        if (!this.thisblock) {
            return;
        }
        var b = this.thisblock;
        var s = this.spr;
        switch (b.blocktype) {
        case 'down':
        case 'back':
        case 'forward':
        case 'up':
            if ((this.distance > -1) && !stopMine) {
                var vector = Vector.scale(this.vector, this.distance % 24);
                s.setPos(s.xcoor + vector.x, s.ycoor + vector.y);
            }
            break;
        case 'hop':
            var count = this.count;
            var n = Number(b.getArgValue());
            count--;
            if (count > 0) {
                var delta = 0;
                for (var i = count; i > -1; i--) {
                    delta += Prims.hopList[count];
                }
                this.vector = {
                    x: 0,
                    y: delta
                };
                var dy = s.ycoor - this.vector.y / 5 * n;
                if (dy < 0) {
                    dy = 0;
                }
                if (dy >= (360 - Grid.size)) {
                    dy = (360 - Grid.size);
                }
                s.setPos(s.xcoor + this.vector.x, dy);
            }
            break;
        case 'playsnd':
            if (this.audio) {
                this.audio.stop();
                this.audio = undefined;
            }
            break;
        case 'playusersnd':
            if (this.audio) {
                this.audio.stop();
                this.audio = undefined;
            }
            break;
        case 'hide':
            s.div.style.opacity = 0;
            if (!this.firstBlock.aStart && !stopMine) {
                s.homeshown = false;
            }
            break;
        case 'show':
            s.div.style.opacity = 1;
            if (!this.firstBlock.aStart && !stopMine) {
                s.homeshown = true;
            }
            break;
        case 'same': s.noScaleFor();
            break;
        case 'grow':
        case 'shrink':
            if (!this.firstBlock.aStart && !stopMine) {
                s.homescale = s.scale;
            }
            break;
        case 'right':
        case 'left':
            var angle = s.angle;
            if ((angle % 30) != 0) {
                angle = (Math.floor(angle / 30) + 1) * 30;
            }
            s.setHeading(angle);
            break;
        }
    }
}
