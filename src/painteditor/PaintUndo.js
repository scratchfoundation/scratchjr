import ScratchJr from '../editor/ScratchJr';
import Path from './Path';
import Paint from './Paint';
import Camera from './Camera';
import SVGTools from './SVGTools';
import {newHTML, gn, isTablet} from '../utils/lib';
import ScratchAudio from '../utils/ScratchAudio';
//////////////////////////////////
// Undo / Redo Functions
//////////////////////////////////

let buffer = [];
let index = 0;

export default class PaintUndo {
    // Getters/setters for globally used properties
    static set buffer (newBuffer) {
        buffer = newBuffer;
    }

    static get index () {
        return index;
    }

    static set index (newIndex) {
        index = newIndex;
    }

    ////////////////////////////////////////
    // Undo Controls Setup
    ///////////////////////////////////////
    static setup (p) {
        var div = newHTML('div', 'paintundo', p);
        div.setAttribute('id', 'paintundocontrols');
        var lib = [['undo', PaintUndo.undo], ['redo', PaintUndo.redo]];
        var dx = 20;
        for (var i = 0; i < lib.length; i++) {
            var bt = PaintUndo.newToggleClicky(div, 'id_p', lib[i][0], lib[i][1]);
            dx += bt.offsetWidth;
            dx += 20;
        }
        PaintUndo.updateActiveUndo();
    }

    static newToggleClicky (p, prefix, key, fcn) {
        var button = newHTML('div', 'undocircle', p);
        newHTML('div', key + ' off', button);
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
    }

    static runUndo () {
        Path.quitEditMode();
        Paint.root.removeChild(gn('layer1'));
        Paint.root.appendChild(SVGTools.toObject(buffer[index]));
        Paint.root.appendChild(gn('draglayer'));
        Paint.root.appendChild(gn('paintgrid'));
        Paint.setZoomTo(Paint.currentZoom);
    }

    // you record before introducing a change
    static record (dontStartStories) {
        if ((index + 1) <= buffer.length) {
            buffer.splice(index + 1, buffer.length);
        }
        buffer.push(PaintUndo.getCanvas());
        index++;
        if (gn('id_pundo')) {
            PaintUndo.updateActiveUndo();
        }
        if (!dontStartStories) {
            ScratchJr.storyStart('PaintUndo.record'); // Record a change for sample projects in story-starter mode
        }
    }

    static getCanvas () {
        return SVGTools.svg2string(gn('layer1'));
    }

    //////////////////////////////////
    // Control buttons callbacks
    //////////////////////////////////

    static undo (e) {
        if (e.touches && (e.touches.length > 1)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (Camera.active) {
            Camera.doAction('undo');
        }
        while (index >= buffer.length) {
            index--;
        }
        index--;
        var snd = (index < 0) ? 'boing.wav' : 'tap.wav';
        ScratchAudio.sndFX(snd);
        if (index < 0) {
            index = 0;
        } else {
            PaintUndo.runUndo();
        }
        PaintUndo.updateActiveUndo();
    }

    static redo (e) {
        if (e.touches && (e.touches.length > 1)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (Camera.active) {
            Camera.doAction('undo');
        }
        index++;
        var snd = (index > buffer.length - 1) ? 'boing.wav' : 'tap.wav';
        ScratchAudio.sndFX(snd);
        if (index > buffer.length - 1) {
            index = buffer.length - 1;
        } else {
            PaintUndo.runUndo();
        }
        PaintUndo.updateActiveUndo();
    }

    static updateActiveUndo () {
        if (gn('id_pundo')) {
            if (buffer.length == 1) {
                PaintUndo.tunOffButton(gn('id_pundo'));
            } else {
                if (index < 1) {
                    PaintUndo.tunOffButton(gn('id_pundo'));
                } else {
                    PaintUndo.tunOnButton(gn('id_pundo'));
                }
            }
            if (index >= buffer.length - 1) {
                PaintUndo.tunOffButton(gn('id_predo'));
            } else {
                PaintUndo.tunOnButton(gn('id_predo'));
            }
        }
    }

    static tunOnButton (p) {
        var kid = p.childNodes[0];
        var kclass = kid.getAttribute('class').split(' ')[0];
        kid.setAttribute('class', kclass + ' on');
    }

    static tunOffButton (p) {
        var kid = p.childNodes[0];
        var kclass = kid.getAttribute('class').split(' ')[0];
        kid.setAttribute('class', kclass + ' off');
    }
}
