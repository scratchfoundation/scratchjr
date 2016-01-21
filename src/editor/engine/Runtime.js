import ScratchJr from '../ScratchJr';
import Project from '../../ui/Project';
import Prims from './Prims';
import Thread from './Thread';

export default class Runtime {
    constructor () {
        this.threadsRunning = [];
        this.thread = undefined;
        this.intervalId = undefined;
        this.yield = false;
    }

    beginTimer () {
        if (this.intervalId != null) {
            window.clearInterval(this.intervalId);
        }
        var rt = this;
        this.intervalId = window.setInterval(function () {
            rt.tickTask();
        }, 32);
        Project.saving = false;
        // Prims.time = (new Date() - 0);
        this.threadsRunning = [];
    }

    tickTask () {
        ScratchJr.updateRunStopButtons();
        if (this.threadsRunning.length < 1) {
            return;
        }
        var activeThreads = [];
        for (var i = 0; i < this.threadsRunning.length; i++) {
            if (this.threadsRunning[i].isRunning) {
                activeThreads.push(this.threadsRunning[i]);
            }
        }
        this.threadsRunning = activeThreads;
        for (var j = 0; j < this.threadsRunning.length; j++) {
            this.step(j);
        }
    }

    inactive () {
        if (this.threadsRunning.length < 1) {
            return true;
        }
        var inactive = true;
        for (var i = 0; i < this.threadsRunning.length; i++) {
            var t = this.threadsRunning[i];
            if (!t) {
                continue;
            }
            if (t.isRunning && (t.firstBlock.blocktype != 'ontouch')) {
                inactive = false;
            }
            if ((t.firstBlock.blocktype == 'ontouch') && (t.thisblock != null)
                && (t.thisblock.blocktype != 'ontouch')) {
                inactive = false;
            }
        }
        return inactive;
    }

    step (n) {
        this.yield = false;
        this.thread = this.threadsRunning[n];
        while (true) { // eslint-disable-line no-constant-condition
            if (!this.thread.isRunning) {
                return;
            }
            if (this.thread.waitTimer > 0) {
                this.thread.waitTimer += -1;
                return;
            }
            //  if (this.thread.spr.parentNode.id == "frame") return; // object is being dragged
            if (this.yield) {
                return;
            }
            if (this.thread.thisblock == null) {
                this.endCase();
                this.yield = true;
            } else {
                this.runPrim();
            }
        }
    }

    addRunScript (spr, b) {
        this.restartThread(spr, b);
    }

    stopThreads () {
        for (var i in this.threadsRunning) {
            this.threadsRunning[i].stop();
        }
        this.threadsRunning = [];
    }

    stopThreadBlock (b) {
        for (var i in this.threadsRunning) {
            if (this.threadsRunning[i].firstBlock == b) {
                this.threadsRunning[i].stop();
            }
        }
    }

    stopThreadSprite (spr) {
        for (var i in this.threadsRunning) {
            if (this.threadsRunning[i].spr == spr) {
                this.threadsRunning[i].stop();
            }
        }
    }

    removeRunScript (spr) {
        var res = [];
        for (var i in this.threadsRunning) {
            if (this.threadsRunning[i].spr == spr) {
                if (this.threadsRunning[i].isRunning) {
                    if (this.threadsRunning[i].thisblock != null) {
                        this.threadsRunning[i].endPrim();
                    }
                    res.push(this.threadsRunning[i].duplicate());
                }
                this.threadsRunning[i].isRunning = false;
                if (this.threadsRunning[i].oldblock != null) {
                    this.threadsRunning[i].oldblock.unhighlight();
                }
            }
        }
        return res;
    }

    runPrim () {
        if (this.thread.oldblock != null) {
            this.thread.oldblock.unhighlight();
        }
        this.thread.oldblock = null;
        var token = Prims.table[this.thread.thisblock.blocktype];
        if (token == null) {
            token = Prims.table.missing;
        } else {
            var noh = ['repeat', 'gotopage'];
            if (noh.indexOf(this.thread.thisblock.blocktype) < 0) {
                this.thread.thisblock.highlight();
                this.thread.oldblock = this.thread.thisblock;
            }
            Prims.time = (new Date() - 0);
            token(this.thread);
        }
    }

    endCase () {
        if (this.thread.oldblock != null) {
            this.thread.oldblock.unhighlight();
        }
        if (this.thread.stack.length == 0) {
            Prims.Done(this.thread);
        } else {
            var thing = (this.thread.stack).pop();
            this.thread.thisblock = thing;
            this.runPrim();
        }
    }

    restartThread (spr, b, active) {
        var newThread = new Thread(spr, b);
        var wasRunning = false;
        for (var i = 0; i < this.threadsRunning.length; i++) {
            if (this.threadsRunning[i].firstBlock == b) {
                wasRunning = true;
                if (b.blocktype != 'ontouch') { // on touch demons are special - they are not interruptable
                    if (this.threadsRunning[i].oldblock != null) {
                        this.threadsRunning[i].oldblock.unhighlight();
                    }
                    this.threadsRunning[i].stopping(active);
                    newThread = this.threadsRunning[i];
                }
            }
        }
        if (!wasRunning) {
            this.threadsRunning.push(newThread);
        }
        return newThread;
    }
}
