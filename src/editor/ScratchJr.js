var ScratchJr = function () {};

ScratchJr.workingCanvas = document.createElement('canvas');
ScratchJr.workingCanvas2 = document.createElement('canvas');
ScratchJr.activeFocus = undefined;
ScratchJr.changed = false;
// Our behavior for story-starters are slightly different from ScratchJr.changed
// e.g. moving a script around doesn't "start a story" while we would want it
// to save a normal user project.
ScratchJr.storyStarted = false;
ScratchJr.runtime = undefined;
ScratchJr.stage = undefined;
ScratchJr.inFullscreen = false;
ScratchJr.keypad = undefined;
ScratchJr.textForm = undefined;
ScratchJr.editfirst = false;
ScratchJr.stagecolor = Settings.stageColor;
ScratchJr.defaultSprite = Settings.defaultSprite;

///////////////////////////////////////////
//Layers definitions for the whole site
///////////////////////////////////////////

//layaring variables
ScratchJr.layerTop = 10;
ScratchJr.layerBelowTop = 8;
ScratchJr.layerAboveBottom = 4;
ScratchJr.layerBottom = 2;
ScratchJr.dragginLayer = 7000;

//positioning variables
ScratchJr.stagedy = 10;
ScratchJr.indent = 10;
ScratchJr.scriptsdy = 390 + ScratchJr.stagedy + 5;
ScratchJr.paletteh = 62;

ScratchJr.currentProject = undefined;
ScratchJr.editmode;
ScratchJr.database = 'projects';

ScratchJr.isDebugging = false;
ScratchJr.time;
ScratchJr.userStart = false;
ScratchJr.onHold = false;
ScratchJr.shaking = undefined;
ScratchJr.stopShaking = undefined;
ScratchJr.version = undefined;

ScratchJr.autoSaveEnabled = true;
ScratchJr.autoSaveSetInterval = null;

ScratchJr.appinit = function (v) {
    ScratchJr.version = v;
    document.body.scrollTop = 0;
    ScratchJr.time = (new Date()) - 0;
    var urlvars = getUrlVars();
    iOS.hascamera();
    ScratchJr.log('starting the app');
    BlockSpecs.initBlocks();
    Project.loadIcon = document.createElement('img');
    Project.loadIcon.src = 'assets/loading.png';
    ScratchJr.log('blocks init', ScratchJr.getTime(), 'sec', BlockSpecs.loadCount);
    ScratchJr.currentProject = urlvars.pmd5;
    ScratchJr.editmode = urlvars.mode;
    libInit();
    Project.init();
    ScratchJr.log('Start ui init', ScratchJr.getTime(), 'sec');
    Project.setProgress(10);
    ScratchAudio.init();
    Library.init();
    Paint.init();
    Record.init();
    Prims.init();
    ScratchJr.runtime = new Runtime();
    Undo.init();
    ScratchJr.editorEvents();
    Project.load(ScratchJr.currentProject);
    Events.init();
    if (Settings.autoSaveInterval > 0) {
        ScratchJr.autoSaveSetInterval = window.setInterval(function () {
            if (ScratchJr.autoSaveEnabled) {
                ScratchJr.saveProject(null, function () {
                    Alert.close();
                });
            }
        }, Settings.autoSaveInterval);
    }
};

// Event handler for when a story is started
// When called and enabled, this will trigger sample projects to save copies
// Here for debugging, run-time filtering, etc.
ScratchJr.storyStart = function (/*eventName*/) {
    // console.log("Story started: " + eventName);
    ScratchJr.storyStarted = true;
};

ScratchJr.editorEvents = function () {
    document.ongesturestart = undefined;
    document.ontouchmove = function (e) {
        e.preventDefault();
    };
    window.ontouchstart = ScratchJr.triggerAudio;
    if (isTablet) {
        window.ontouchend = undefined;
    } else {
        window.onmouseup = undefined;
    }
};

ScratchJr.prepareAudio = function () {
    if (ScratchAudio.firstTime) {
        ScratchAudio.firstClick();
    }
    if (!ScratchAudio.firstTime) {
        window.ontouchstart = ScratchJr.unfocus;
    }
};

ScratchJr.triggerAudio = function (evt) {
    ScratchJr.prepareAudio();
    ScratchJr.unfocus(evt);
};

ScratchJr.unfocus = function (evt) {
    if (Palette.helpballoon) {
        Palette.helpballoon.parentNode.removeChild(Palette.helpballoon);
        Palette.helpballoon = undefined;
    }
    if (document.forms.editable) {
        if (evt && (evt.target == document.forms.editable.field)) {
            return;
        } // block is being edit
    }
    if (document.forms.activetextbox) {
        if (evt && (evt.target == document.forms.activetextbox.typing)) {
            return;
        } // stage text box
    }
    if (document.forms.projectname) {
        if (evt && (evt.target == document.forms.projectname.myproject)) {
            return;
        } // infobox text box
    }
    if (document.activeElement.tagName.toLowerCase() == 'input') {
        document.activeElement.blur();
    }
    ScratchJr.clearSelection();
    ScratchJr.blur();
};

ScratchJr.clearSelection = function () {
    if (ScratchJr.shaking) {
        ScratchJr.stopShaking(ScratchJr.shaking);
    }
};

ScratchJr.blur = function () {
    if (ScratchAudio.firstTime) {
        ScratchAudio.firstClick();
    }
    ScratchJr.editDone();
    Menu.closeMyOpenMenu();
};

ScratchJr.getSprite = function () {
    if (!ScratchJr.stage.currentPage.currentSpriteName) {
        return undefined;
    }
    if (!gn(ScratchJr.stage.currentPage.currentSpriteName)) {
        return undefined;
    }
    return gn(ScratchJr.stage.currentPage.currentSpriteName).owner;
};

ScratchJr.gestureStart = function (e) {
    e.preventDefault();
    if (ScratchAudio.firstTime) {
        ScratchAudio.firstClick();
    }
};

ScratchJr.log = function () {
    if (!ScratchJr.isDebugging) {
        return;
    }
    var len = arguments.length;
    var res = '';
    for (var i = 0; i < len - 1; i++) {
        res = res + arguments[i] + ' ';
    }
    res += arguments[len - 1];
    console.log(res); //eslint-disable-line no-console
};

ScratchJr.getTime = function () {
    return ((new Date()) - ScratchJr.time) / 1000;
};

ScratchJr.isSampleOrStarter = function () {
    return ScratchJr.editmode == 'look' || ScratchJr.editmode == 'storyStarter';
};
ScratchJr.isEditable = function () {
    return ScratchJr.editmode != 'look';
};

// Called when ScratchJr is brought back to focus
// Here, we fix up some UI elements that may not have been properly shut down when the app was paused.
// Note that on Android Lollipop and up we have much more limited opportunity to save progress, etc. before the app is
// paused, and so we just suspend the whole webview and then restore it here.
ScratchJr.onResume = function () {
    // no nothing special, for now.
    if (Record.dialogOpen) {
        Record.recordError();
    }

    // Re-enable autosaves
    ScratchJr.autoSaveEnabled = true;
    ScratchJr.autoSaveSetInterval = window.setInterval(function () {
        if (ScratchJr.autoSaveEnabled) {
            ScratchJr.saveProject(null, function () {
                Alert.close();
            });
        }
    }, Settings.autoSaveInterval);
};

ScratchJr.onPause = function () {
    ScratchJr.autoSaveEnabled = false;
    window.clearInterval(ScratchJr.autoSaveSetInterval);
};

ScratchJr.saveProject = function (e, onDone) {
    if (ScratchJr.isEditable() && ScratchJr.editmode == 'storyStarter' && ScratchJr.storyStarted && !Project.error) {
        iOS.analyticsEvent('samples', 'story_starter_edited', Project.metadata.name);
        // Get the new project name
        IO.uniqueProjectName({
            name: Project.metadata.name
        }, function (jsonData) {
            var newName = jsonData.name;
            Project.metadata.name = newName;
            // Create the new project
            IO.createProject({
                name: newName,
                version: ScratchJr.version,
                mtime: (new Date()).getTime().toString()
            }, function (md5) {
                // Save project data
                ScratchJr.currentProject = md5;
                Project.prepareToSave(ScratchJr.currentProject, onDone);
            });
        }, true);
    } else if (ScratchJr.isEditable() && ScratchJr.currentProject && !Project.error && ScratchJr.changed) {
        Project.prepareToSave(ScratchJr.currentProject, onDone);
    } else {
        if (onDone) {
            onDone();
        }
    }
};

ScratchJr.saveAndFlip = function (e){
    ScratchJr.onHold = true;
    ScratchJr.stopStripsFromTop(e);
    ScratchJr.unfocus(e);
    ScratchJr.saveProject(e, ScratchJr.flippage);
};

ScratchJr.flippage = function () {
    Alert.close();
    iOS.cleanassets('wav', doNext);
    function doNext () {
        iOS.cleanassets('svg', ScratchJr.switchPage);
    }
};

ScratchJr.switchPage = function () {
    window.location.href = ScratchJr.getGotoLink();
};

ScratchJr.getGotoLink = function () {
    if (ScratchJr.editmode == 'storyStarter') {
        if (!ScratchJr.storyStarted) {
            return 'home.html?place=help';
        } else {
            return 'home.html?place=home';
        }
    }

    if (!ScratchJr.currentProject) {
        return 'home.html?place=home';
    }

    if (Project.metadata.gallery == 'samples') {
        return 'home.html?place=help';
    } else {
        return 'home.html?place=home&timestamp=' + new Date().getTime();
    }
};

ScratchJr.updateRunStopButtons = function () {
    var isOff = ScratchJr.runtime.inactive();
    if (ScratchJr.inFullscreen) {
        gn('go').className = isOff ? 'go on presentationmode' : 'go off presentationmode';
        UI.updatePageControls();
    } else {
        gn('go').className = isOff ? 'go on' : 'go off';
        Grid.updateCursor();
    }
    if (ScratchJr.getSprite()) {
        if (isOff && !ScratchJr.inFullscreen) {
            ScratchJr.getSprite().select();
        } else {
            ScratchJr.getSprite().unselect();
        }
    }
    if (isOff && ScratchJr.userStart) {
        ScratchJr.stage.currentPage.updateThumb();
        //	ScratchJr.log ('total time', ScratchJr.getTime(), 'sec');
        ScratchJr.userStart = false;
    }
};

ScratchJr.runStrips = function (e) {
    ScratchJr.prepareAudio();
    ScratchJr.stopStripsFromTop(e);
    ScratchJr.unfocus(e);
    ScratchJr.startGreenFlagThreads();
    ScratchJr.userStart = true;
//  ScratchJr.time = (new Date()) - 0;
};

ScratchJr.startGreenFlagThreads = function () {
    ScratchJr.resetSprites();
    ScratchJr.startCurrentPageStrips(['onflag', 'ontouch']);
};

ScratchJr.startCurrentPageStrips = function (list) {
    var page = ScratchJr.stage.currentPage.div;
    for (var i = 0; i < page.childElementCount; i++) {
        var spr = page.childNodes[i].owner;
        if (!spr) {
            continue;
        }
        if (!gn(spr.id + '_scripts')) {
            continue;
        } // text case
        ScratchJr.startScriptsFor(spr, list);
    }
};

ScratchJr.startScriptsFor = function (spr, list) {
    var sc = gn(spr.id + '_scripts');
    var topblocks = sc.owner.getBlocksType(list);
    for (var j = 0; j < topblocks.length; j++) {
        var b = topblocks[j];
        ScratchJr.runtime.addRunScript(spr, b);
    }
};

ScratchJr.stopStripsFromTop = function (e) {
    e.preventDefault();
    e.stopPropagation();
    ScratchJr.unfocus(e);
    ScratchJr.stopStrips();
    ScratchJr.userStart = false;
};

ScratchJr.stopStrips = function () {
    ScratchJr.runtime.stopThreads();
    ScratchJr.stage.currentPage.updateThumb();
};

ScratchJr.resetSprites = function () {
    ScratchJr.stage.resetPage(ScratchJr.stage.currentPage);
};

ScratchJr.fullScreen = function (e) {
    if (gn('full').className == 'fullscreen') {
        ScratchJr.onBackButtonCallback.push(function () {
            var fakeEvent = document.createEvent('TouchEvent');
            fakeEvent.initTouchEvent();
            ScratchJr.quitFullScreen(fakeEvent);
        });

        ScratchJr.enterFullScreen(e);
    } else {
        ScratchJr.quitFullScreen(e);
    }
};

ScratchJr.displayStatus = function (type) {
    var ids = ['topsection', 'blockspalette', 'scripts', 'flip', 'projectinfo'];
    for (var i = 0; i < ids.length; i++) {
        if (gn(ids[i])) {
            gn(ids[i]).style.display = type;
        }
    }
};

ScratchJr.enterFullScreen = function (e) {
    if (ScratchJr.onHold) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    ScratchJr.unfocus(e);
    ScratchJr.displayStatus('none');
    ScratchJr.inFullscreen = true;
    UI.enterFullScreen();
    iOS.analyticsEvent('editor', 'full_screen_entered');
    document.body.style.background = 'black';
};

ScratchJr.quitFullScreen = function (e) {
    //  ScratchJr.time = (new Date()) - 0;
    e.preventDefault();
    e.stopPropagation();
    ScratchJr.displayStatus('block');
    ScratchJr.inFullscreen = false;
    UI.quitFullScreen();
    ScratchJr.onBackButtonCallback.pop();
    document.body.style.background = 'white';
};

/////////////////////////////////////////
//UI calls
/////////////////////////////////////////

ScratchJr.getActiveScript = function () {
    var str = ScratchJr.stage.currentPage.currentSpriteName + '_scripts';
    return gn(str);
};

ScratchJr.getBlocks = function () {
    return ScratchJr.getActiveScript().owner.getBlocks();
};

/////////////////////////////////////////////////
//Setup editable field


ScratchJr.setupEditableField = function () {
    ScratchJr.textForm = newHTML('form', 'textform', frame);
    ScratchJr.textForm.name = 'editable';
    var ti = newHTML('input', 'textinput', ScratchJr.textForm);
    ti.name = 'field';
    ti.onkeypress = function (evt) {
        handleKeyPress(evt);
    };
    ScratchJr.textForm.onsubmit = function (evt) {
        submitOverride(evt);
    };
    function handleKeyPress (e) {
        var key = e.keyCode || e.which;
        if (key == 13) {
            submitOverride(e);
        }
    }
    function submitOverride (e) {
        e.preventDefault();
        e.stopPropagation();
        var input = e.target;
        input.blur();

        // Hitting enter does not trigger editDone()
        // so you need to pop the queue here.
        ScratchJr.onBackButtonCallback.pop();
    }
    ti.maxLength = 50;
    ti.onfocus = ScratchJr.handleTextFieldFocus;
    ti.onblur = ScratchJr.handleTextFieldBlur;
};

/////////////////////////////////////////////////
//Argument Clicked


ScratchJr.editArg = function (e, ti) {
    e.preventDefault();
    e.stopPropagation();
    if (ti && ti.owner.isText()) {
        ScratchJr.textClicked(e, ti);
    } else {
        ScratchJr.numberClicked(e, ti);
    }

    ScratchJr.onBackButtonCallback.push(function () {
        ScratchJr.editDone();
    });
};

ScratchJr.textClicked = function (e, div) {
    var b = div.owner; // b is a BlockArg
    ScratchJr.activeFocus = b;
    var pt = b.getScreenPt();
    var sc = ScratchJr.getActiveScript();
    div = sc.parentNode;
    var w = div.offsetWidth;
    var h = div.offsetHeight;
    var dx = ((pt.x + 480 * scaleMultiplier) > w) ? (w - 486 * scaleMultiplier) : pt.x - 6 * scaleMultiplier;
    var ti = document.forms.editable.field;
    ti.style.textAlign = 'center';
    document.forms.editable.style.left = dx + 'px';
    var top = pt.y + 55 * scaleMultiplier;
    document.forms.editable.style.top = top + 'px';
    if (isAndroid) {
        AndroidInterface.scratchjr_setsoftkeyboardscrolllocation(
            top * window.devicePixelRatio, (top + h) * window.devicePixelRatio
        );
    }
    document.forms.editable.className = 'textform on';
    ti.value = b.argValue;
    if (isAndroid) {
        AndroidInterface.scratchjr_forceShowKeyboard();
    }
    ti.focus();
};

ScratchJr.handleTextFieldFocus = function (e) {
    e.preventDefault();
    e.stopPropagation();
    ScratchJr.activeFocus.oldvalue = ScratchJr.activeFocus.input.textContent;
};

ScratchJr.handleTextFieldBlur = function (e) {
    ScratchJr.onBackButtonCallback.pop();
    e.preventDefault();
    e.stopPropagation();
    var ti = document.forms.editable.field;
    var str = ti.value.substring(0, ti.maxLength);
    ScratchJr.activeFocus.argValue = str;
    ScratchJr.activeFocus.setValue(str);
    document.forms.editable.className = 'textform off';
    if (ScratchJr.activeFocus.daddy.div.parentNode) {
        var spr = ScratchJr.activeFocus.daddy.div.parentNode.owner.spr;
        var action = {
            action: 'scripts',
            where: spr.div.parentNode.owner.id,
            who: spr.id
        };
        if (ScratchJr.activeFocus.input.textContent != ScratchJr.activeFocus.oldvalue) {
            Undo.record(action);
            ScratchJr.storyStart('ScratchJr.handleTextFieldBlur');
        }
    }
    ScratchJr.activeFocus = undefined;
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
    if (isAndroid) {
        AndroidInterface.scratchjr_forceHideKeyboard();
    }
};

/////////////////////////////////////////
//Numeric keyboard
/////////////////////////////////////////

ScratchJr.setupKeypad = function () {
    ScratchJr.keypad = newHTML('div', 'picokeyboard', frame);
    ScratchJr.keypad.ontouchstart = ScratchJr.eatEvent;
    var pad = newHTML('div', 'insidekeyboard', ScratchJr.keypad);
    for (var i = 1; i < 10; i++) {
        ScratchJr.keyboardAddKey(pad, i, 'onekey');
    }
    ScratchJr.keyboardAddKey(pad, '-', 'onekey minus');
    //  ScratchJr.keyboardAddKey (pad, undefined, 'onekey space');
    ScratchJr.keyboardAddKey(pad, '0', 'onekey');
    ScratchJr.keyboardAddKey(pad, undefined, 'onekey delete');
//  var keym = newHTML("div", 'onkey' ,pad);
};

ScratchJr.eatEvent = function (e) {
    e.preventDefault();
    e.stopPropagation();
};

ScratchJr.keyboardAddKey = function (p, str, c) {
    var keym = newHTML('div', c, p);
    var mk = newHTML('span', undefined, keym);
    mk.textContent = str ? str : '';
    keym.ontouchstart = ScratchJr.numEditKey;
};


/////////////////////////////////////////////////
//Number Clicked


ScratchJr.numberClicked = function (e, ti) {
    var delta = (ScratchJr.activeFocus) ? ScratchJr.activeFocus.delta : 0;
    if (ScratchJr.activeFocus && (ScratchJr.activeFocus.type == 'blockarg')) {
        ScratchJr.activeFocus.div.className = 'numfield off';
        ScratchJr.numEditDone();
    }
    var b = ti.owner; // b is a BlockArg
    ScratchJr.activeFocus = b;
    ScratchJr.activeFocus.delta = delta;
    b.oldvalue = ti.textContent;
    ScratchJr.activeFocus.div.className = 'numfield on';
    ScratchJr.keypad.className = 'picokeyboard on';
    ScratchJr.editfirst = true;
    var p = ti.parentNode.parentNode.owner;
    if (Number(p.min) < 0) {
        ScratchJr.setMinusKey();
    } else {
        ScratchJr.setSpaceKey();
    }
    if (delta == 0) {
        ScratchJr.needsToScroll(b);
    }
};

ScratchJr.needsToScroll = function (b) {
    // needs scroll
    var look = ScratchJr.getActiveScript(); // look canvas
    var dx = b.daddy.div.left + b.daddy.div.offsetWidth + look.left;
    var w = window.innerWidth - ScratchJr.keypad.offsetWidth - 10;
    var delta = (dx > w) ? (w - dx) : 0;
    if (delta < 0) {
        var transition = {
            duration: 0.5,
            transition: 'ease-out',
            style: {
                left: (look.left + delta) + 'px'
            },
            onComplete: function () {
                ScriptsPane.scroll.refresh();
            }
        };
        CSSTransition3D(look, transition);
    }
    ScratchJr.activeFocus.delta = delta;
};

ScratchJr.numEditKey = function (e) {
    e.preventDefault();
    e.stopPropagation();
    var t = e.target;
    if (!t) {
        return;
    }
    if (t.className == '') {
        t = t.parentNode;
    }
    if (t.className != 'onekey space') {
        ScratchAudio.sndFX('keydown.wav');
    }
    var c = t.textContent;
    var input = ScratchJr.activeFocus.input;
    if (!c) {
        if ((t.parentNode.className == 'onekey delete') || (t.className == 'onekey delete')) {
            ScratchJr.numEditDelete();
        }
        return;
    }
    var val = input.textContent;
    if (ScratchJr.editfirst) {
        ScratchJr.editfirst = false;
        val = '0';
    }
    if ((c == '-') && (val != '0')) {
        ScratchAudio.sndFX('boing.wav');
        return;
    }
    if (val == '0') {
        val = c;
    } else {
        val += c;
    }
    if ((Number(val).toString() != 'NaN') && ((Number(val) > 99) || (Number(val) < -99))) {
        ScratchAudio.sndFX('boing.wav');
    } else {
        ScratchJr.activeFocus.setValue(val);
    }
};

ScratchJr.setSpaceKey = function () {
    ScratchJr.keypad.childNodes[0].childNodes[9].className = 'onekey space';
    ScratchJr.keypad.childNodes[0].childNodes[9].childNodes[0].textContent = '';
};

ScratchJr.setMinusKey = function () {
    ScratchJr.keypad.childNodes[0].childNodes[9].className = 'onekey minus';
    ScratchJr.keypad.childNodes[0].childNodes[9].childNodes[0].textContent = '-';
};

ScratchJr.validateNumber = function (val) {
    return Number(val);
};

ScratchJr.revokeInput = function (val) {
    return val;
};

ScratchJr.numEditDelete = function () {
    var val = ScratchJr.activeFocus.input.textContent;
    if (val.length != 0) {
        val = val.substring(0, val.length - 1);
    }
    if (val.length == 0) {
        val = '0';
    }
    ScratchJr.activeFocus.setValue(val);
};

ScratchJr.editDone = function () {
    if (document.activeElement.tagName === 'INPUT') {
        document.activeElement.blur();
    }
    if (ScratchJr.activeFocus == undefined) {
        return;
    }
    if (ScratchJr.activeFocus.type != 'blockarg') {
        return;
    }
    if (ScratchJr.activeFocus.isText()) {
        document.forms.editable.field.blur();
    } else {
        ScratchJr.closeNumberEdit();
        ScratchJr.onBackButtonCallback.pop();
    }
};

ScratchJr.closeNumberEdit = function () {
    ScratchJr.numEditDone();
    ScratchJr.resetScroll();
    ScratchJr.keypad.className = 'picokeyboard off';
    ScratchJr.activeFocus.div.className = 'numfield off';
    ScratchJr.activeFocus = undefined;
};

ScratchJr.numEditDone = function () {
    var val = ScratchJr.activeFocus.input.textContent;
    if (val == '-') {
        val = 0;
    }
    if (val == '-0') {
        val = 0;
    }
    val = ScratchJr.validateNumber(val);
    var ba = ScratchJr.activeFocus;
    ScratchJr.activeFocus.setValue(parseFloat(val));
    ba.argValue = val;
    if (ba.daddy && ba.daddy.div.parentNode.owner) {
        var spr = ba.daddy.div.parentNode.owner.spr;
        if (spr && spr.div.parentNode) {
            var action = {
                action: 'scripts',
                where: spr.div.parentNode.owner.id,
                who: spr.id
            };
            if (ba.argValue != ba.oldvalue) {
                ScratchJr.storyStart('ScratchJr.numEditDone');
                Undo.record(action);
            }
        }
    }
};

ScratchJr.resetScroll = function () {
    var delta = ScratchJr.activeFocus.delta;
    if (delta < 0) {
        var look = ScratchJr.getActiveScript(); // look canvas
        var transition = {
            duration: 0.5,
            transition: 'ease-out',
            style: {
                left: (look.left - delta) + 'px'
            },
            onComplete: function () {
                ScriptsPane.scroll.refresh();
            }
        };
        CSSTransition3D(look, transition);
    }
};

ScratchJr.validate = function (str, name) {
    var str2 = str.replace(/\s*/g, '');
    if (str2.length == 0) {
        return name;
    }
    return str;
};

/////////////////
//Application on the background


// XXX: does this ever happen?
// I'm pretty sure this is dead code -TM
ScratchJr.saveProjectState = function () {
    ScratchAudio.sndFX('tap.wav');
    if (frame.style.display == 'none') {
        Paint.saveEditState(ScratchJr.stopServer);
    } else {
        ScratchJr.unfocus();
        ScratchJr.stopStrips();
        if (ScratchJr.isEditable() && ScratchJr.currentProject && !Project.error && ScratchJr.changed) {
            Project.save(ScratchJr.currentProject, ScratchJr.stopServer);
        }
    }
};

ScratchJr.stopServer = function () {
    iOS.stopserver(iOS.trace);
};

/**
 * The functions that are invokved when the Android back button is clicked.
 * Methods are called from the rear and popped off after each invocation.
 */
ScratchJr.onBackButtonCallback = [];

/**
 * Handles updating the UI when the Android back button is clicked.  This
 * method invokes the methods defined at {@link ScratchJr.onBackButtonCallback}
 * if not empty, otherwise it invokes {@link ScratchJr.saveAndFlip}.  The
 * back button callback is set by UI components when they initialize a modal
 * or popup, so it is the responsibility of popup components to correctly cleanup
 * the onBackButtonCallback.
 */
ScratchJr.goBack = function () {
    if (ScratchJr.onBackButtonCallback.length === 0) {
        var e = document.createEvent('TouchEvent');
        e.initTouchEvent();
        e.preventDefault();
        e.stopPropagation();
        ScratchJr.saveAndFlip(e);
    } else {
        var callbackReference = ScratchJr.onBackButtonCallback[ScratchJr.onBackButtonCallback.length - 1];
        callbackReference();
    }
};
