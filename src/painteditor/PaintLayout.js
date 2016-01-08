/////////////////////////////////
//Layout Setup
/////////////////////////////////

Paint.layout = function () {
    Paint.topbar();
    var div = newHTML('div', 'innerpaint', Paint.frame);
    Paint.leftPalette(div);
    var workspaceContainer = newHTML('div', 'workspacebkg-container', div);
    var workspace = newHTML('div', 'workspacebkg', workspaceContainer);
    workspace.setAttribute('id', 'workspacebkg');
    Paint.rightPalette(div);
    Paint.colorPalette(Paint.frame);
    Paint.selectButton('path');
    Paint.createSVGeditor(workspace);
};

/////////////////////////////////
//top bar
/////////////////////////////////

Paint.topbar = function () {
    var pt = newHTML('div', 'paintop', Paint.frame);
    Paint.checkMark(pt);
    PaintUndo.setup(pt); // plug here the undo
    Paint.nameOfcostume(pt);
};

Paint.checkMark = function (pt) {
    var clicky = newHTML('div', 'paintdone', pt);
    clicky.id = 'donecheck';
    if (isTablet) {
        clicky.ontouchstart = Paint.backToProject;
    } else {
        clicky.onmousedown = Paint.backToProject;
    }
};

Paint.nameOfcostume = function (p) {
    var sform = newHTML('form', 'spriteform', p);
    sform.name = 'spriteform';
    var ti = newHTML('input', undefined, sform);
    ti.onkeypress = undefined;
    ti.autocomplete = 'off';
    ti.autocorrect = false;
    ti.name = 'name';
    ti.maxLength = 25;
    ti.firstTime = true;
    ti.onfocus = Paint.nameFocus;
    ti.onblur = Paint.nameBlur;
    ti.onkeypress = Paint.handleNamePress;
    ti.onkeyup = Paint.handleKeyRelease;
    sform.onsubmit = Paint.submitNameChange;
};

Paint.submitNameChange = function (e) {
    e.preventDefault();
    var input = e.target;
    input.blur();
};

Paint.nameFocus = function (e) {
    e.preventDefault();
    e.stopPropagation();
    var ti = e.target;
    ti.firstTime = true;
    ScratchJr.activeFocus = ti;
    if (isAndroid) {
        AndroidInterface.scratchjr_setsoftkeyboardscrolllocation(
            ti.getBoundingClientRect().top * window.devicePixelRatio,
            ti.getBoundingClientRect().bottom * window.devicePixelRatio
        );
    }
    Undo.aux = Project.getProject(ScratchJr.stage.currentPage.id);
    setTimeout(function () {
        ti.setSelectionRange(ti.value.length, ti.value.length);
    }, 1);
};

Paint.nameBlur = function (e) {
    ScratchJr.activeFocus = undefined;
    var spr = ScratchJr.getSprite();
    var ti = e.target;
    var val = ScratchJr.validate(ti.value, spr.name);
    ti.value = val.substring(0, ti.maxLength);
    ScratchJr.storyStart('Paint.nameBlur');
};

Paint.handleNamePress = function (e) {
    var key = e.keyCode || e.which;
    if (key == 13) {
        Paint.submitNameChange(e);
    } else {
        var ti = e.target;
        if (ti.firstTime) {
            ti.firstTime = false;
            ti.value = '';
        }
        if (ti.value.length == 25) {
            ScratchAudio.sndFX('boing.wav');
        }
    }
};

Paint.handleKeyRelease = function (e) {
    var key = e.keyCode || e.which;
    var ti = e.target;
    if (key != 8) {
        return;
    }
    if (ti.firstTime) {
        ti.firstTime = false;
        ti.value = '';
    }
};

/////////////////////////////////
//Left Palette
/////////////////////////////////

Paint.leftPalette = function (div) {
    var leftpal = newHTML('div', 'side up', div);
    var pal = newHTML('div', 'paintpalette', leftpal);
    pal.setAttribute('id', 'paintpalette');
    Paint.setupEditPalette(pal);
    Paint.createSizeSelector(pal);
};

Paint.setupEditPalette = function (pal) {
    var section = newHTML('div', 'section', pal);
    section.setAttribute('id', 'painttools');
    var list = ['path', 'ellipse', 'rect', 'tri'];
    var i = 0;
    for (i = 0; i < list.length; i++) {
        var but = newHTML('div', 'element off', section);
        var icon = newHTML('div', 'tool ' + list[i] + ' off', but);
        icon.setAttribute('key', list[i]);
        if (isTablet) {
            icon.ontouchstart = Paint.setMode;
        } else {
            icon.onmousedown = Paint.setMode;
        }
    }
};

Paint.createSizeSelector = function (pal) {
    var section = newHTML('div', 'section space', pal);
    section.setAttribute('id', 'sizeSelector');
    for (var i = 0; i < Paint.pensizes.length; i++) {
        var ps = newHTML('div', 'pensizeholder', section);
        ps.key = i;
        ps.ontouchstart = function (e) {
            e.preventDefault();
            e.stopPropagation();
            var n = Number(this.key);
            Paint.strokewidth = Paint.pensizes[Number(this.key)];
            Paint.selectPenSize(n);
        };
        var c = newHTML('div', 'line t' + i, ps);
        Paint.drawPenSizeInColor(c);
    }
    Paint.strokewidth = Paint.pensizes[1];
    Paint.selectPenSize(1);
};

////////////////////////////////////////
// Pen sizes
////////////////////////////////////////


Paint.drawPenSizeInColor = function (c) {
    c.style.background = Paint.fillcolor;
};

Paint.updateStrokes = function () {
    var div = gn('sizeSelector');
    if (!div) {
        return;
    }
    for (var i = 0; i < div.childElementCount; i++) {
        var elem = div.childNodes[i];
        Paint.drawPenSizeInColor(elem.childNodes[0]);
    }
};

Paint.selectPenSize = function (str) {
    var p = gn('sizeSelector');
    for (var i = 0; i < p.childElementCount; i++) {
        var elem = p.childNodes[i];
        if (elem.key == str) {
            elem.setAttribute('class', 'pensizeholder on');
        } else {
            elem.setAttribute('class', 'pensizeholder off');
        }
    }
};

/////////////////////////////////
//Right Palette
/////////////////////////////////

Paint.rightPalette = function (div) {
    var rightpal = newHTML('div', 'side', div);
    Paint.addSidePalette(rightpal, 'selectortools', ['select', 'rotate']);
    Paint.addSidePalette(rightpal, 'edittools', ['stamper', 'scissors']);
    Paint.addSidePalette(rightpal, 'filltools',
        (iOS.camera == '1' && Camera.available) ? ['camera', 'paintbucket'] : ['paintbucket']);
};

Paint.addSidePalette = function (p, id, list) {
    var pal = newHTML('div', 'paintpalette short', p);
    pal.setAttribute('id', id);
    for (var i = 0; i < list.length; i++) {
        var but = newHTML('div', 'element off', pal);
        var icon = newHTML('div', 'tool ' + list[i] + ' off', but);
        icon.setAttribute('key', list[i]);
        icon.ontouchstart = Paint.setMode;
    }
};

Paint.cameraToolsOn = function () {
    gn('backdrop').setAttribute('class', 'modal-backdrop fade dark');
    setProps(gn('backdrop').style, {
        display: 'block'
    });
    var topbar = newHTML('div', 'phototopbar', gn('backdrop'));
    topbar.setAttribute('id', 'photocontrols');
    //  var actions = newHTML("div",'actions', topbar);
    //  var buttons = newHTML('div', 'photobuttons', actions);
    var fc = newHTML('div', 'flipcamera', topbar);
    fc.setAttribute('id', 'cameraflip');
    fc.setAttribute('key', 'cameraflip');
    if (isAndroid && !AndroidInterface.scratchjr_has_multiple_cameras()) {
        fc.style.display = 'none';
    }

    fc.ontouchstart = Paint.setMode;
    var captureContainer = newHTML('div', 'snapshot-container', gn('backdrop'));
    captureContainer.setAttribute('id', 'capture-container');
    var capture = newHTML('div', 'snapshot', captureContainer);
    capture.setAttribute('id', 'capture');
    capture.setAttribute('key', 'camerasnap');
    capture.ontouchstart = Paint.setMode;
    var cc = newHTML('div', 'cameraclose', topbar);
    cc.setAttribute('id', 'cameraclose');
    cc.ontouchstart = Paint.closeCameraMode;
};

Paint.closeCameraMode = function () {
    ScratchAudio.sndFX('exittap.wav');
    Camera.close();
    Paint.selectButton('select');
};

Paint.cameraToolsOff = function () {
    gn('backdrop').setAttribute('class', 'modal-backdrop fade');
    setProps(gn('backdrop').style, {
        display: 'none'
    });
    if (gn('photocontrols')) {
        gn('photocontrols').parentNode.removeChild(gn('photocontrols'));
    }
    if (gn('capture')) {
        var captureContainer = gn('capture').parentNode;
        var captureContainerParent = captureContainer.parentNode;
        captureContainer.removeChild(gn('capture'));
        captureContainerParent.removeChild(gn('capture-container'));
    }
};

//////////////////////////////////
// canvas Area
//////////////////////////////////


Paint.setUpCanvasArea = function () {
    var workspace = gn('workspacebkg');
    var dx = Math.floor((workspace.offsetWidth - Paint.workspaceWidth) / 2);
    var dy = Math.floor((workspace.offsetHeight - Paint.workspaceHeight) / 2);
    var w = Paint.workspaceWidth;
    var h = Paint.workspaceHeight;

    var div = gn('maincanvas');
    div.style.background = '#F5F2F7';
    div.style.top = '0px';
    div.style.left = '0px';

    div.style.width = w + 'px';
    div.style.height = h + 'px';
    div.cx = div.offsetWidth / 2;
    div.cy = div.offsetHeight / 2;
    div.dx = dx;
    div.dy = dy;

    Paint.root.setAttributeNS(null, 'width', w);
    Paint.root.setAttributeNS(null, 'height', h);
    Paint.drawGrid(w, h);
    PaintAction.clearEvents();
};

/////////////////////////////////
//Color Palette
/////////////////////////////////

Paint.colorPalette = function (div) {
    var swatchlist = Paint.initSwatchList();
    var spalContainer = newHTML('div', 'swatchpalette-container', div);
    var spal = newHTML('div', 'swatchpalette', spalContainer);
    spal.setAttribute('id', 'swatches');
    for (var i = 0; i < swatchlist.length; i++) {
        var colour = newHTML('div', 'swatchbucket', spal);
        // bucket
        var sf = newHTML('div', 'swatchframe', colour);
        var sc = newHTML('div', 'swatchcolor', sf);
        sc.style.background = swatchlist[i];
        //
        sf = newHTML('div', 'splasharea off', colour);
        Paint.setSplashColor(sf, Paint.splash, swatchlist[i]);
        Paint.addImageUrl(sf, Paint.splashshade);
        colour.ontouchstart = Paint.selectSwatch;
    }
    Paint.setSwatchColor(gn('swatches').childNodes[swatchlist.indexOf('#1C1C1C')]);
};

Paint.setSplashColor = function (p, str, color) {
    var dataurl = 'data:image/svg+xml;base64,' + btoa(str.replace(/#662D91/g, color));
    Paint.addImageUrl(p, dataurl);
};

Paint.addImageUrl = function (p, url) {
    var img = document.createElement('img');
    img.src = url;
    img.style.position = 'absolute';
    p.appendChild(img);
};

Paint.selectSwatch = function (e) {
    if (e.touches && (e.touches.length > 1)) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (Camera.active) {
        return;
    }
    var t;
    if (window.event) {
        t = window.event.srcElement;
    } else {
        t = e.target;
    }
    var b = 'swatchbucket' != t.className;
    while (b) {
        t = t.parentNode;
        b = t && ('swatchbucket' != t.className);
    }
    if (!t) {
        return;
    }
    ScratchAudio.sndFX('splash.wav');
    Paint.setSwatchColor(t);
};

Paint.setSwatchColor = function (t) {
    var tools = ['select', 'wand', 'stamper', 'scissors', 'rotate'];
    if (t && (tools.indexOf(Paint.mode) > -1)) {
        Paint.selectButton('paintbucket');
    }
    var c = t.childNodes[0].childNodes[0].style.backgroundColor;
    for (var i = 0; i < gn('swatches').childElementCount; i++) {
        var mycolor = gn('swatches').childNodes[i].childNodes[0].childNodes[0].style.backgroundColor;
        if (c == mycolor) {
            gn('swatches').childNodes[i].childNodes[1].setAttribute('class', 'splasharea on');
        } else {
            gn('swatches').childNodes[i].childNodes[1].setAttribute('class', 'splasharea off');
        }
    }
    Paint.fillcolor = c;
    Path.quitEditMode();
    Paint.updateStrokes();
};

Paint.initSwatchList = function () {
    return [
        //	"#FF5500", // new orange
        '#FFD2F2', '#FF99D6', '#FF4583', // red pinks
        '#C30001', '#FF0023', '#FF8300', '#FFB200',
        '#FFF42E',
        '#FFF9C2', // pale yellow
        '#E2FFBD', //  pale green
        '#CFF500', // lime green
        '#50D823', // problematic
        //          "#2BFC49", // less problematic
        '#29C130',
        //          "#56C43B",  // ERROR?
        '#2BBF8A', // new green
        '#027607', '#114D24', //greens
        '#FFFFFF', '#CCDDE7', '#61787C', '#1C1C1C', // grays
        '#D830A3', // sarah's pink shoes border
        '#FF64E9', // purple pinks
        '#D999FF', ' #A159D3', // vilote
        '#722696', // sarah's violet
        '#141463', '#003399', '#1D40ED',
        '#0079D3', '#009EFF', '#76C8FF',
        '#ACE0FD', '#11B7BC', '#21F9F3', '#C3FCFC', '#54311E',
        '#8E572A', '#E4B69D', '#FFCDA4', '#FFEDD7' // skin colors

    ];
};

/////////////////////////////////////////////////
//  Setup SVG Editor
////////////////////////////////////////////////


Paint.createSVGeditor = function (container) {
    var div = newHTML('div', 'maincanvas', container);
    div.setAttribute('id', 'maincanvas');
    div.style.background = '#F5F2F7';
    div.style.top = '0px';
    div.style.left = '0px';
    window.onmousemove = undefined;
    window.onmouseup = undefined;
    Paint.root = SVGTools.create(div);
    Paint.root.setAttribute('class', 'active3d');
    xform = Transform.getTranslateTransform();
    selxform = Transform.getTranslateTransform();
    var layer = SVGTools.createGroup(Paint.root, 'layer1');
    layer.setAttribute('style', 'pointer-events:visiblePainted');
    SVGTools.createGroup(Paint.root, 'draglayer');
    SVGTools.createGroup(Paint.root, 'paintgrid');
    gn('paintgrid').setAttribute('opacity', 0.5);
};

Paint.clearWorkspace = function () {
    var fcn = function (div) {
        while (div.childElementCount > 0) {
            div.removeChild(div.childNodes[0]);
        }
    };
    fcn(gn('layer1'));
    fcn(gn('paintgrid'));
    fcn(gn('draglayer'));
    Path.quitEditMode();
};

Paint.drawGrid = function (w, h) {
    var attr, path;
    if (!Paint.isBkg) {
        attr = {
            'd': Paint.getGridPath(w, h, 12),
            'id': getIdFor('gridpath'),
            'opacity': 1,
            'stroke': '#dcddde',
            'fill': 'none',
            'stroke-width': 0.5
        };
        path = SVGTools.addChild(gn('paintgrid'), 'path', attr);
        path.setAttribute('style', 'pointer-events:none;');
    }
    attr = {
        'd': Paint.getGridPath(w, h, Paint.isBkg ? 24 : 48),
        'id': getIdFor('gridpath'),
        'opacity': 1,
        'stroke': '#c1c2c3',
        'fill': 'none',
        'stroke-width': 0.5
    };
    path = SVGTools.addChild(gn('paintgrid'), 'path', attr);
    path.setAttribute('style', 'pointer-events:none;');
};

Paint.getGridPath = function (w, h, gridsize) {
    var str = '';
    var dx = gridsize;
    // vertical
    var cmd;
    for (var i = 0; i < w / gridsize; i++) {
        cmd = 'M' + dx + ',' + 0 + 'L' + dx + ',' + h;
        str += cmd;
        dx += gridsize;
    }
    var dy = gridsize;
    // horizontal
    for (i = 0; i < h / gridsize; i++) {
        cmd = 'M' + 0 + ',' + dy + 'L' + w + ',' + dy;
        str += cmd;
        dy += gridsize;
    }
    return str;
};
