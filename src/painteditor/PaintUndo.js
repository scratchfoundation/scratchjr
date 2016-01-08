//////////////////////////////////
// Undo / Redo Functions
//////////////////////////////////
var PaintUndo = function () {};

PaintUndo.buffer = [];
PaintUndo.index = 0;

////////////////////////////////////////
// Undo Controls Setup
///////////////////////////////////////

PaintUndo.setup = function (p) {
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
};

PaintUndo.newToggleClicky = function (p, prefix, key, fcn) {
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
};

PaintUndo.runUndo = function () {
    Path.quitEditMode();
    Paint.root.removeChild(gn('layer1'));
    Paint.root.appendChild(SVGTools.toObject(PaintUndo.buffer[PaintUndo.index]));
    Paint.root.appendChild(gn('draglayer'));
    Paint.root.appendChild(gn('paintgrid'));
    Paint.setZoomTo(Paint.currentZoom);
};

// you record before introducing a change
PaintUndo.record = function (dontStartStories) {
    if ((PaintUndo.index + 1) <= PaintUndo.buffer.length) {
        PaintUndo.buffer.splice(PaintUndo.index + 1, PaintUndo.buffer.length);
    }
    PaintUndo.buffer.push(PaintUndo.getCanvas());
    PaintUndo.index++;
    if (gn('id_pundo')) {
        PaintUndo.updateActiveUndo();
    }
    if (!dontStartStories) {
        ScratchJr.storyStart('PaintUndo.record'); // Record a change for sample projects in story-starter mode
    }
};

PaintUndo.getCanvas = function () {
    return SVGTools.svg2string(gn('layer1'));
};

//////////////////////////////////
// Control buttons callbacks
//////////////////////////////////

PaintUndo.undo = function (e) {
    if (e.touches && (e.touches.length > 1)) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (Camera.active) {
        Camera.doAction('undo');
    }
    while (PaintUndo.index >= PaintUndo.buffer.length) {
        PaintUndo.index--;
    }
    PaintUndo.index--;
    var snd = (PaintUndo.index < 0) ? 'boing.wav' : 'tap.wav';
    ScratchAudio.sndFX(snd);
    if (PaintUndo.index < 0) {
        PaintUndo.index = 0;
    } else {
        PaintUndo.runUndo();
    }
    PaintUndo.updateActiveUndo();
};

PaintUndo.redo = function (e) {
    if (e.touches && (e.touches.length > 1)) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (Camera.active) {
        Camera.doAction('undo');
    }
    PaintUndo.index++;
    var snd = (PaintUndo.index > PaintUndo.buffer.length - 1) ? 'boing.wav' : 'tap.wav';
    ScratchAudio.sndFX(snd);
    if (PaintUndo.index > PaintUndo.buffer.length - 1) {
        PaintUndo.index = PaintUndo.buffer.length - 1;
    } else {
        PaintUndo.runUndo();
    }
    PaintUndo.updateActiveUndo();
};

PaintUndo.updateActiveUndo = function () {
    if (gn('id_pundo')) {
        if (PaintUndo.buffer.length == 1) {
            PaintUndo.tunOffButton(gn('id_pundo'));
        } else {
            if (PaintUndo.index < 1) {
                PaintUndo.tunOffButton(gn('id_pundo'));
            } else {
                PaintUndo.tunOnButton(gn('id_pundo'));
            }
        }
        if (PaintUndo.index >= PaintUndo.buffer.length - 1) {
            PaintUndo.tunOffButton(gn('id_predo'));
        } else {
            PaintUndo.tunOnButton(gn('id_predo'));
        }
    }
};

PaintUndo.tunOnButton = function (p) {
    var kid = p.childNodes[0];
    var kclass = kid.getAttribute('class').split(' ')[0];
    kid.setAttribute('class', kclass + ' on');
};

PaintUndo.tunOffButton = function (p) {
    var kid = p.childNodes[0];
    var kclass = kid.getAttribute('class').split(' ')[0];
    kid.setAttribute('class', kclass + ' off');
};
