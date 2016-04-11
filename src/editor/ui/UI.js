//////////////////////////////////////
//  General UI Layout
/////////////////////////////////////

import ScratchJr from '../ScratchJr';
import BlockSpecs from '../blocks/BlockSpecs';
import Alert from './Alert';
import Project from './Project';
import Thumbs from './Thumbs';
import Palette from './Palette';
import Grid from './Grid';
import Stage from '../engine/Stage';
import ScriptsPane from './ScriptsPane';
import Undo from './Undo';
import Library from './Library';
import iOS from '../../iPad/iOS';
import IO from '../../iPad/IO';
import MediaLib from '../../iPad/MediaLib';
import Paint from '../../painteditor/Paint';
import Events from '../../utils/Events';
import Localization from '../../utils/Localization';
import ScratchAudio from '../../utils/ScratchAudio';
import {frame, gn, CSSTransition, localx, newHTML, scaleMultiplier, getIdFor, isTablet, newDiv,
    newTextInput, isAndroid, getDocumentWidth, getDocumentHeight, setProps, globalx} from '../../utils/lib';

let projectNameTextInput = null;
let info = null;
let okclicky = null;
let infoBoxOpen = false;

export default class UI {
    static get infoBoxOpen () {
        return infoBoxOpen;
    }
    static layout () {
        UI.topSection();
        UI.middleSection();
        UI.BottomSection();
        UI.fullscreenControls();
        UI.createFormForText(frame);
        ScratchJr.setupKeypad();
        ScratchJr.setupEditableField();
        UI.aspectRatioAdjustment();
    }

    // Helps debug on Android 4.2 by enabling the user to type in a
    // JavaScript expression and evaluate the output and render to console.log.
    /*static addDebugControl () {
        var div = newHTML('div', 'debug', document.body);
        setProps(div.style, {
            position: 'absolute',
            left: '0px',
            top: '0px',
            width: '64px',
            height: '64px',
            background: 'red',
            zIndex: 30000
        });
        div.ontouchstart = function (e) {
            console.log(eval(prompt('Enter Debug JavaScript')));
        };
    }*/

    /** Tweak some elements depending on aspect ratio */
    static aspectRatioAdjustment () {
        var aspect = getDocumentWidth() / getDocumentHeight();
        if (aspect > 1.45) {
            // Nudge sprite list right a bit and the pages list left a bit
            gn('library').style.left = '3vw';
            gn('pages').style.right = '1vw';
        }
    }

    static topSection () {
        var div = newHTML('div', 'topsection', frame);
        div.setAttribute('id', 'topsection');
        if (ScratchJr.isEditable()) {
            UI.addProjectInfo();
        }
        UI.leftPanel(div);
        UI.stageArea(div);
        UI.rightPanel(div);
    }

    static leftPanel (div) {
        // sprite library
        var sl = newHTML('div', 'leftpanel', div);
        var flip = newHTML('div', 'flipme', sl);
        flip.setAttribute('id', 'flip');
        flip.ontouchstart = function (evt) {
            ScratchJr.saveAndFlip(evt);
        }; // move to project
        UI.layoutLibrary(sl);
    }

    static middleSection () {
        var bp = newHTML('div', 'blockspalette', frame);
        bp.setAttribute('id', 'blockspalette');
        Palette.setup(bp);
        Undo.setup(bp);
    }

    static BottomSection () {
        ScriptsPane.createScripts(frame);
    }

    static addProjectInfo () {
        info = newHTML('div', 'info', frame);
        info.setAttribute('id', 'projectinfo');
        var infobox = newHTML('div', 'infobox fade', frame);
        infobox.setAttribute('id', 'infobox');
        okclicky = newHTML('div', 'paintdone', infobox);
        newHTML('div', 'infoboxlogo', infobox);
        var nameField = UI.addEditableName(infobox);
        var staticinfo = newHTML('div', 'fixedinfo', infobox);
        var author = newHTML('div', 'infolabel', staticinfo);
        author.setAttribute('id', 'deviceName');

        if (window.Settings.shareEnabled) {
            // Sharing
            var shareButtons = newHTML('div', 'infoboxShareButtons', infobox);

            var shareEmail = newHTML('div', 'infoboxShareButton', shareButtons);
            shareEmail.id = 'infoboxShareButtonEmail';
            shareEmail.textContent = Localization.localize('SHARING_BY_EMAIL');

            if (isAndroid) {
                shareEmail.style.margin = 'auto';
            } else {
                shareEmail.style.float = 'left';
            }

            if (!isAndroid) {
                var shareAirdrop = newHTML('div', 'infoboxShareButton', shareButtons);
                shareAirdrop.id = 'infoboxShareButtonAirdrop';
                shareAirdrop.textContent = Localization.localize('SHARING_BY_AIRDROP');
                shareAirdrop.style.float = 'right';
                shareAirdrop.ontouchstart = function (e) {
                    UI.parentalGate(e, function (e) {
                        UI.infoDoShare(e, nameField, shareLoadingGif, 1);
                    });
                };
            }

            iOS.deviceName(function (name) {
                gn('deviceName').textContent = name;
            });

            var shareLoadingGif = newHTML('img', 'infoboxShareLoading', shareButtons);
            shareLoadingGif.src = './assets/ui/loader.png';

            shareEmail.ontouchstart = function (e) {
                UI.parentalGate(e, function (e) {
                    UI.infoDoShare(e, nameField, shareLoadingGif, 0);
                });
            };
        }

        info.ontouchend = UI.showInfoBox;
        okclicky.ontouchstart = UI.hideInfoBox;
        okclicky.ontouchstart = function (evt) {
            UI.hideInfoBox(evt, nameField);
        };
    }

    static parentalGate (evt, callback) {
        ScratchAudio.sndFX('tap.wav');
        var pgFrame = newHTML('div', 'parentalgate', gn('frame'));

        var pgCloseButton = newHTML('div', 'paintdone', pgFrame);
        pgCloseButton.ontouchstart = function () {
            parentalGateClose(false);
        };

        var pgProblem = newHTML('div', 'parentalgateproblem', pgFrame);
        var pgChoiceA = newHTML('div', 'parentalgatechoice', pgFrame);
        var pgChoiceB = newHTML('div', 'parentalgatechoice', pgFrame);
        var pgChoiceC = newHTML('div', 'parentalgatechoice', pgFrame);

        var problems = [
            // Problem, Choice A, Choice B, Choice C, Correct choice #
            ['30 + 7', '37', '9', '28', 0],
            ['22 + 3', '18', '25', '3', 1],
            ['91 + 1', '32', '74', '92', 2],
            ['30 + 4', '34', '59', '12', 0],
            ['48 + 1', '9', '49', '20', 1],
            ['32 + 6', '23', '99', '38', 2],
            ['53 + 4', '57', '12', '90', 0],
            ['26 + 3', '17', '29', '8', 1],
            ['71 + 1', '58', '14', '72', 2],
            ['11 + 8', '19', '23', '67', 0]
        ];

        var problemChoice = Math.floor(Math.random() * problems.length);
        var theProblem = problems[problemChoice];

        pgProblem.textContent = theProblem[0];
        pgChoiceA.textContent = theProblem[1];
        pgChoiceB.textContent = theProblem[2];
        pgChoiceC.textContent = theProblem[3];

        pgChoiceA.ontouchstart = function () {
            parentalGateClose(theProblem[4] == 0);
        };
        pgChoiceB.ontouchstart = function () {
            parentalGateClose(theProblem[4] == 1);
        };
        pgChoiceC.ontouchstart = function () {
            parentalGateClose(theProblem[4] == 2);
        };


        var pgExplain = newHTML('div', 'parentalgateexplain', pgFrame);
        pgExplain.textContent = Localization.localize('PARENTAL_GATE_EXPLANATION');

        function parentalGateClose (success) {
            ScratchAudio.sndFX('exittap.wav');
            gn('frame').removeChild(pgFrame);
            if (success) {
                callback(evt);
            }
        }
    }

    /*
    +    Save the project, including the new name, then package the project and send native-side for sharing
    +
    +    evt: reference to touch event triggering share
    +    nameField: reference to the project rename field
    +    shareLoadingGif: reference to HTML element to show during packaging/loading and hide for completion
    +    shareType: which dialog to show - 0 for email; 1 for airdrop
    + */

    static infoDoShare (evt, nameField, shareLoadingGif, shareType) {
        ScratchAudio.sndFX('tap.wav');
        shareLoadingGif.style.visibility = 'visible';
        nameField.blur(); // Hide the keyboard for name changes

        setTimeout(saveAndShare, 500); // 500ms delay to wait for loading GIF to show and keyboard to hide

        iOS.analyticsEvent('editor', 'share_button', (shareType == 0) ? 'email' : 'airdrop');

        function saveAndShare () {
            // Save the project's new name
            UI.handleTextFieldSave(true);

            // Save any changes made to the project
            ScratchJr.onHold = true; // Freeze the editing UI
            ScratchJr.stopStripsFromTop(evt);

            Project.prepareToSave(ScratchJr.currentProject, function () {
                Alert.close();

                // Package the project as a .sjr file
                IO.zipProject(ScratchJr.currentProject, function (contents) {
                    ScratchJr.onHold = false; // Unfreeze the editing UI
                    var emailSubject = Localization.localize('SHARING_EMAIL_SUBJECT', {
                        PROJECT_NAME: IO.shareName
                    });
                    iOS.sendSjrToShareDialog(IO.zipFileName, emailSubject, Localization.localize('SHARING_EMAIL_TEXT'),
                        shareType, contents);

                    shareLoadingGif.style.visibility = 'hidden';
                });
            });
        }
    }


    static addEditableName (p) {
        var pname = newHTML('form', 'projectname', p);
        pname.name = 'projectname';
        pname.id = 'title';
        pname.onsubmit = function (evt) {
            submitChange(evt);
        };
        var ti = newHTML('input', 'pnamefield', pname);
        projectNameTextInput = ti;
        ti.name = 'myproject';
        ti.maxLength = 30;
        ti.onkeypress = undefined;
        ti.autocomplete = 'off';
        ti.autocorrect = false;
        ti.onblur = undefined;
        ti.onfocus = function (e) {
            e.preventDefault();
            ti.oldvalue = ti.value;
            if (isAndroid) {
                AndroidInterface.scratchjr_setsoftkeyboardscrolllocation(
                    ti.getBoundingClientRect().top * devicePixelRatio,
                    ti.getBoundingClientRect().bottom * devicePixelRatio
                );
                AndroidInterface.scratchjr_forceShowKeyboard();
            }
        };
        ti.onkeypress = function (evt) {
            handleNamePress(evt);
        };
        function handleNamePress (e) {
            var key = e.keyCode || e.which;
            if (key == 13) {
                submitChange(e);
            }
        }
        function submitChange (e) {
            e.preventDefault();
            var input = e.target;
            input.blur();
        }
        return ti;
    }

    static handleTextFieldSave (dontHide) {
        // Handle story-starter mode project
        if (ScratchJr.isEditable() && ScratchJr.editmode == 'storyStarter' && !Project.error) {
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
                    Project.metadata.id = md5;
                    ScratchJr.currentProject = md5;
                    ScratchJr.editmode = 'edit';
                    Project.metadata.gallery = '';
                    UI.finishTextFieldSave(dontHide);
                });
            });
        } else {
            UI.finishTextFieldSave(dontHide);
        }
    }

    static finishTextFieldSave (dontHide) {
        var ti = projectNameTextInput;
        var pname = (ti.value.length == 0) ? ti.oldvalue : ti.value.substring(0, ti.maxLength);
        if (Project.metadata.name != pname) {
            ScratchJr.storyStart('UI.handleTextFieldSave');
        }
        Project.metadata.name = pname;
        ScratchJr.changed = true;
        iOS.setfield(iOS.database, Project.metadata.id, 'name', pname);
        if (!dontHide) {
            ScratchAudio.sndFX('exittap.wav');
            gn('infobox').className = 'infobox fade';
        }
    }

    static showInfoBox (e) {
        infoBoxOpen = true;
        e.preventDefault();
        e.stopPropagation();
        if (Paint.saving) {
            return;
        }
        if (ScratchJr.onHold) {
            return;
        }

        // Prevent button from thrashing
        setTimeout(function () {
            okclicky.ontouchend = UI.hideInfoBox;
            projectNameTextInput.onblur = function () {
                if (isAndroid) {
                    AndroidInterface.scratchjr_forceHideKeyboard();
                }
            };
        }, 500);
        projectNameTextInput.onblur = function () {
            if (ScratchJr.isEditable()) {
                (document.forms.projectname.myproject).focus();
            }
        };
        info.ontouchend = null;

        ScratchJr.onBackButtonCallback.push(function () {
            var e2 = document.createEvent('TouchEvent');
            e2.initTouchEvent();
            e2.preventDefault();
            e2.stopPropagation();
            UI.hideInfoBox(e2);
        });

        ScratchAudio.sndFX('entertap.wav');
        ScratchJr.stopStrips();
        if (!Project.metadata.ctime) {
            Project.metadata.mtime = (new Date()).getTime();
            Project.metadata.ctime = UI.formatTime((new Date()).getTime());
        }

        if (ScratchJr.isEditable()) {
            (document.forms.projectname.myproject).value = Project.metadata.name;
        } else {
            gn('pname').textContent = Project.metadata.name;
        }
        gn('infobox').className = 'infobox fade in';
        if (ScratchJr.isEditable()) {
            setTimeout(function () {
                //(document.forms["projectname"]["myproject"]).focus();
            }, 500);
        }
    }

    static formatTime (unixtime) {
        var date = new Date(unixtime);
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hour = date.getHours();
        var min = date.getMinutes();
        var sec = date.getSeconds();
        return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
    }

    static hideInfoBox (e) {
        e.preventDefault();
        e.stopPropagation();
        ScratchJr.onBackButtonCallback.pop();

        // Prevent button thrashing
        okclicky.ontouchend = null;
        setTimeout(function () {
            info.ontouchend = UI.showInfoBox;
        }, 500);

        if (ScratchJr.isEditable()) {
            (document.forms.projectname.myproject).blur();
            UI.handleTextFieldSave();
        } else {
            ScratchAudio.sndFX('exittap.wav');
            gn('infobox').className = 'infobox fade';
        }
        infoBoxOpen = false;
    }

    //////////////////////////////////////
    //   Library
    /////////////////////////////////////

    static layoutLibrary (sl) {
        var sprites = newHTML('div', 'thumbpanel', sl);
        sprites.setAttribute('id', 'library');
        //scrolling area
        var p = newHTML('div', 'spritethumbs', sprites);
        var div = newHTML('div', 'spritecc', p);
        div.setAttribute('id', 'spritecc');
        div.ontouchstart = UI.spriteThumbsActions;

        // scrollbar
        var sb = newHTML('div', 'scrollbar', sprites);
        sb.setAttribute('id', 'scrollbar');
        var sbthumb = newHTML('div', 'sbthumb', sb);
        sbthumb.setAttribute('id', 'sbthumb');

        // new sprite
        if (ScratchJr.isEditable()) {
            var ns = newHTML('div', 'addsprite', sprites);
            ns.ontouchstart = UI.addSprite;
        }
    }

    static mascotData (page) {
        var sprAttr = {
            flip: false,
            angle: 0,
            shown: true,
            type: 'sprite',
            scale: 0.5,
            defaultScale: 0.5,
            speed: 2,
            dirx: 1,
            diry: 1,
            sounds: ['pop.mp3'],
            homex: 240,
            homey: 180,
            xcoor: 240,
            ycoor: 180,
            homeshown: true,
            homeflip: false,
            homescale: 0.5,
            scripts: []
        };
        sprAttr.page = page;
        sprAttr.md5 = ScratchJr.defaultSprite;
        var catkey = MediaLib.keys[sprAttr.md5].name;
        sprAttr.id = getIdFor(catkey);
        sprAttr.name = catkey;
        return sprAttr;
    }

    //////////////////////////////////////
    // Scrolling
    //////////////////////////////////////

    static needsScroll () {
        var sc = gn('spritecc');
        var p = sc.parentNode;
        if (((sc.scrollHeight / p.offsetHeight) == 1) || (gn('spritecc').childElementCount == 0)) {
            gn('scrollbar').setAttribute('class', 'scrollbar off');
        } else {
            gn('scrollbar').setAttribute('class', 'scrollbar on');
            UI.updateSpriteScroll();
        }
    }

    static updateSpriteScroll () {
        var sc = gn('spritecc');
        var dy = sc.offsetTop;
        var p = sc.parentNode;
        var top = -dy / (sc.scrollHeight / p.offsetHeight);
        var size = (p.offsetHeight / sc.scrollHeight) * p.offsetHeight;
        var thumb = gn('sbthumb');
        thumb.style.height = size + 'px';
        thumb.style.top = top + 'px';
    }

    static scrollContents (dy) {
        var sc = gn('spritecc');
        var valy = sc.offsetTop - dy;
        if (valy > 0) {
            valy = 0;
        }
        var transition = {
            duration: 0.5,
            transition: 'ease-out',
            style: {
                top: valy + 'px'
            }
        };
        CSSTransition(sc, transition);
    }

    static spriteInView (spr) {
        var sc = gn('spritecc');
        var achild = spr.thumbnail;
        if (!achild) {
            return;
        }
        var h = gn('spritecc').parentNode.offsetHeight;
        var scroll = -gn('spritecc').offsetTop;
        var dy = -gn('spritecc').offsetTop;
        if ((achild.offsetTop + achild.offsetHeight + scroll) > h) {
            dy = h - (achild.offsetTop + achild.offsetHeight);
        }
        if (achild.offsetTop <= scroll) {
            dy = achild.offsetTop + scroll;
        }
        if (dy > 0) {
            dy = 0;
        }
        sc.style.top = dy + 'px';
        UI.needsScroll();
    }

    static resetSpriteLibrary () {
        if (!ScratchJr.getSprite()) {
            return;
        }
        UI.spriteInView(ScratchJr.getSprite());
    }

    ///////////////////////////////////
    // Sprite Thumbs Events
    //////////////////////////////////

    static spriteThumbsActions (e) {
        if (isTablet && e.touches && (e.touches.length > 1)) {
            return;
        }
        if (ScratchJr.onHold) {
            return;
        }
        var t;
        var pt = Events.getTargetPoint(e);
        if (window.event) {
            t = window.event.srcElement;
        } else {
            t = e.target;
        }
        //	if ((t.nodeName == "INPUT") || (t.nodeName == "FORM")) return;
        e.preventDefault();
        e.stopPropagation();
        ScratchJr.blur();
        t.focus();
        if (t.className == 'brush') {
            UI.putInPaintEditor(e); return;
        }
        var tb = Thumbs.getType(t, 'spritethumb');
        if (!tb) {
            if (ScratchJr.shaking) {
                ScratchJr.clearSelection();
            }
            return;
        }
        var x = localx(t, pt.x);
        if (tb && (x < 70) && ScratchJr.isEditable()) {
            Thumbs.startDragThumb(e, tb);
        } else {
            UI.startSpriteScroll(e, tb);
        }
    }

    static startSpriteScroll (e, tb) {
        if (ScratchJr.shaking) {
            ScratchJr.clearSelection();
        }
        if (!tb) {
            return;
        }
        if (gn('scrollbar').className == 'scrollbar off') {
            Events.startDrag(e, tb, UI.ignoreEvent, UI.ignoreEvent, UI.ignoreEvent, UI.spriteClicked,
                ScratchJr.isEditable() ? Thumbs.startCharShaking : undefined);
        } else {
            Events.startDrag(e, tb, UI.prepareToScroll, UI.stopScroll, UI.spriteScolling, UI.spriteClicked,
                ScratchJr.isEditable() ? Thumbs.startCharShaking : undefined);
        }
    }

    static ignoreEvent (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    static prepareToScroll (e) {
        e.preventDefault();
        e.stopPropagation();
        UI.spriteScolling(e, Events.dragthumbnail);
    }

    static stopScroll (e) {
        e.preventDefault();
        e.stopPropagation();
        UI.spriteScolling(e, Events.dragthumbnail);
    }

    static spriteScolling (e) {
        var pt = Events.getTargetPoint(e);
        var deltay = Events.dragmousey - pt.y;
        Events.dragmousey = pt.y;
        var sc = gn('spritecc');
        var dy = sc.offsetTop;
        dy -= deltay;
        var p = sc.parentNode;
        if (dy > 0) {
            dy = 0;
        }
        if ((dy + sc.offsetHeight) < p.offsetHeight) {
            dy = p.offsetHeight - sc.offsetHeight;
        }
        sc.style.top = dy + 'px';
        UI.updateSpriteScroll();
    }

    static spriteClicked (e, el) {
        e.preventDefault();
        e.stopPropagation();
        var t;
        if (window.event) {
            t = window.event.srcElement;
        } else {
            t = e.target;
        }
        if (ScratchJr.isEditable() && ScratchJr.getSprite() &&
            (((t.className == 'sname') && (el.owner == ScratchJr.getSprite().id))
            || (t.className == 'brush'))) {
            UI.putInPaintEditor(e);
            return;
        }
        if (el.className.indexOf('shakeme') < 0) {
            el.setAttribute('class', 'spritethumb on');
        }
        Thumbs.clickOnSprite(e, el);
    }

    static putInPaintEditor (e) {
        ScratchJr.unfocus(e);
        var s = ScratchJr.getSprite();
        if (!s) {
            return;
        }
        ScratchJr.stopStrips();
        Paint.open(false, s.md5, s.id, s.name, s.defaultScale, Math.round(s.w), Math.round(s.h));
    }

    ///////////////////////////////
    // Setup Stage Variables
    //////////////////////////////

    static stageArea (inner) {
        var outerDiv = newHTML('div', 'centerpanel', inner);
        var div = newHTML('div', 'stageframe', outerDiv);
        div.setAttribute('id', 'stageframe');
        ScratchJr.stage = new Stage(div);
        Grid.init(div);
        if (ScratchJr.isEditable()) {
            UI.creatTopBarClicky(div, 'addtext', 'addText', UI.addText);
            UI.creatTopBarClicky(div, 'setbkg', 'changeBkg', UI.addBackground);
        }
        UI.creatTopBarClicky(div, 'grid', 'gridToggle off', UI.switchGrid);
        UI.creatTopBarClicky(div, 'go', 'go on', UI.toggleRun);
        UI.creatTopBarClicky(div, 'resetall', 'resetall', UI.resetAllSprites);
        UI.creatTopBarClicky(div, 'full', 'fullscreen', ScratchJr.fullScreen);
        UI.toggleGrid(true);
    }

    static resetAllSprites (e) {
        e.preventDefault();
        e.stopPropagation();
        if (ScratchJr.onHold) {
            return;
        }
        ScratchAudio.sndFX('tap.wav');
        if (!ScratchJr.runtime.inactive()) {
            ScratchJr.stopStripsFromTop(e);
        }
        ScratchJr.resetSprites();
    }

    static toggleRun (e) {
        var isOff = ScratchJr.runtime.inactive();
        if (isOff) {
            ScratchJr.runStrips(e);
        } else {
            ScratchJr.stopStripsFromTop(e);
        }
    }

    static switchGrid () {
        ScratchAudio.sndFX('tap.wav');
        UI.toggleGrid(!Grid.hidden);
    }

    static toggleGrid (b) {
        Grid.hide(b);
        gn('grid').className = Grid.hidden ? 'gridToggle off' : 'gridToggle on';
    }

    static creatTopBarClicky (p, str, mstyle, fcn) {
        var toggle = newHTML('div', mstyle, p);
        toggle.ontouchstart = fcn;
        toggle.setAttribute('id', str);
    }

    static fullscreenControls () {
        UI.nextpage = newHTML('div', 'nextpage off', frame);
        UI.prevpage = newHTML('div', 'nextpage off', frame);
        if (isTablet) {
            UI.nextpage.ontouchstart = UI.nextPage;
        } else {
            UI.nextpage.onmousedown = UI.nextPage;
        }
        if (isTablet) {
            UI.prevpage.ontouchstart = UI.prevPage;
        } else {
            UI.prevpage.onmousedown = UI.prevPage;
        }
    }

    static updatePageControls () {
        var n = ScratchJr.stage.pages.indexOf(ScratchJr.stage.currentPage);
        if (n == 0) {
            UI.prevpage.setAttribute('class', 'prevpage off');
        } else {
            UI.prevpage.setAttribute('class', 'prevpage on');
        }
        if (n == (ScratchJr.stage.pages.length - 1)) {
            UI.nextpage.setAttribute('class', 'nextpage off');
        } else {
            UI.nextpage.setAttribute('class', 'nextpage on');
        }
    }

    static nextPage (e) {
        e.preventDefault();
        e.stopPropagation();
        var n = ScratchJr.stage.pages.indexOf(ScratchJr.stage.currentPage);
        n++;
        if (n >= ScratchJr.stage.pages.length) {
            return;
        }
        ScratchJr.stage.setPage(ScratchJr.stage.pages[n], false);
    }

    static prevPage (e) {
        e.preventDefault();
        e.stopPropagation();
        var n = ScratchJr.stage.pages.indexOf(ScratchJr.stage.currentPage);
        if (n < 1) {
            return;
        }
        ScratchJr.stage.setPage(ScratchJr.stage.pages[n - 1], false);
    }

    static enterFullScreen () {
        var w = Math.min(getDocumentWidth(), frame.offsetWidth);
        var h = Math.max(getDocumentHeight(), frame.offsetHeight);
        frame.appendChild(gn('stage'));
        var list = ['go', 'full'];
        for (var i = 0; i < list.length; i++) {
            gn(list[i]).className = gn(list[i]).className + ' presentationmode';
            frame.appendChild(gn(list[i]));
        }
        var scale = Math.min((w - (136 * scaleMultiplier)) / gn('stage').owner.width, h / gn('stage').owner.height);
        var dx = Math.floor((w - (gn('stage').owner.width * scale)) / 2);
        var dy = Math.floor((h - (gn('stage').owner.height * scale)) / 2);

        ScratchJr.stage.setStageScaleAndPosition(scale, dx / scale, dy / scale);

        gn('stage').owner.currentZoom = Math.floor(scale * 100) / 100;
        gn('stage').style.webkitTextSizeAdjust = Math.floor(gn('stage').owner.currentZoom * 100) + '%';
        document.body.parentNode.style.background = 'black';
        gn('stage').setAttribute('class', 'stage fullscreen');
        UI.nextpage.setAttribute('class', 'nextpage on');
    }

    static quitFullScreen () {
        var div = gn('stageframe');
        div.appendChild(gn('stage'));
        ScratchJr.stage.setStageScaleAndPosition(scaleMultiplier, 46, 74);
        gn('go').className = 'go off nopresent';
        div.appendChild(gn('go'));
        gn('full').className = 'fullscreen';
        div.appendChild(gn('full'));
        gn('stage').owner.currentZoom = 1;
        gn('stage').style.webkitTextSizeAdjust = '100%';
        document.body.parentNode.style.background = 'none';
        gn('stage').setAttribute('class', 'stage normal');
        UI.nextpage.setAttribute('class', 'nextpage off');
        UI.prevpage.setAttribute('class', 'nextpage off');
        ScratchJr.stage.setViewPage(ScratchJr.stage.currentPage);
        Thumbs.updateSprites();
        Thumbs.updatePages();
    }

    //////////////////////////////////////
    //   Right panel
    /////////////////////////////////////

    static rightPanel (div) {
        var rp = newHTML('div', 'rightpanel', div);
        var tb = newHTML('div', 'pages', rp);
        tb.setAttribute('id', 'pages');
        var ndiv = newHTML('div', 'pagescc', tb);
        ndiv.setAttribute('id', 'pagecc');
    }

    //////////////////////////////////////
    //   Tools
    /////////////////////////////////////

    static layoutToolbar (div) {
        var h = 56;
        var w = 66 * 2;
        var tb = newDiv(div, 220, 0, w, h, {
            position: 'absolute'
        });
        tb.setAttribute('id', 'toolbar');
        var addt = newHTML('div', 'addText', tb);
        addt.ontouchstart = UI.addText;
        var changebkg = newHTML('div', 'changeBkg', tb);
        changebkg.ontouchstart = UI.addBackground;
    }

    static addSprite (e) {
        if (ScratchJr.onHold) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        var pt = Events.getTargetPoint(e);
        if (pt.x > (globalx(e.target) + 167)) {
            return;
        }
        ScratchAudio.sndFX('tap.wav');
        ScratchJr.stopStrips();
        ScratchJr.unfocus(e);
        if (Events.dragthumbnail) {
            Events.mouseUp(e);
        }
        Library.open('costumes');
    }

    static addBackground (e) {
        if (ScratchJr.onHold) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        ScratchJr.stopStrips();
        ScratchJr.unfocus(e);
        if (Events.dragthumbnail) {
            Events.mouseUp(e);
        }
        Library.open('backgrounds');
    }

    static addText (e) {
        if (ScratchJr.onHold) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (isAndroid) {
            if (gn('textbox').style.visibility === 'visible') {
                return;
            }
        }
        ScratchJr.unfocus(e);
        ScratchJr.stage.currentPage.createText();
    }

    //////////////////////////////////
    // Key Handling in TextBox
    //////////////////////////////////

    static createFormForText (p) {
        var tf = newHTML('div', 'pagetext off', p);
        tf.setAttribute('id', 'textbox');
        if (isAndroid) {
            tf.onmousedown = function (e) {
                e.preventDefault();
            };
        }
        var activetb = newHTML('form', 'pageform', tf);
        activetb.name = 'activetextbox';
        activetb.id = 'myform';
        activetb.textsprite = null;
        var field = newTextInput(activetb, 'text');
        field.name = 'typing';
        field.setAttribute('class', 'edittext');
        field.maxLength = 50;
        field.onkeypress = undefined;
        field.autocomplete = 'off';
        field.autocorrect = false;
        field.onblur = undefined;
        activetb.onsubmit = undefined;
        var ta = newHTML('div', 'pagetextactions', tf);
        var clicky = newHTML('div', 'fontsizeText off', ta);
        clicky.setAttribute('id', 'fontsizebutton');
        clicky.ontouchstart = UI.openFontSizeMenu;
        var col = newHTML('div', 'changecolorText off', ta);
        col.setAttribute('id', 'fontcolorbutton');

        col.ontouchstart = UI.topLevelColor;
        UI.createColorMenu(tf);
        UI.createTextSizeMenu(tf);
    }

    static createColorMenu (div) {
        var swatchlist = BlockSpecs.fontcolors;
        var spal = newHTML('div', 'textuicolormenu off', div);
        spal.setAttribute('id', 'textcolormenu');
        for (var i = 0; i < swatchlist.length; i++) {
            var colour = newHTML('div', 'textcolorbucket', spal);
            // bucket
            var sf = newHTML('div', 'swatchframe', colour);
            var sc = newHTML('div', 'swatchcolor', sf);
            sc.style.background = swatchlist[i];
            //
            sf = newHTML('div', 'splasharea off', colour);
            Paint.setSplashColor(sf, Paint.splash, swatchlist[i]);
            Paint.addImageUrl(sf, Paint.splashshade);
            colour.ontouchstart = UI.setTextColor;
        }
        UI.setMenuTextColor(gn('textcolormenu').childNodes[9]);
    }

    static createTextSizeMenu (div) {
        var sizes = BlockSpecs.fontsizes;
        var spal = newHTML('div', 'textuifont off', div);
        spal.setAttribute('id', 'textfontsizes');
        for (var i = 0; i < sizes.length; i++) {
            var textuisize = newHTML('div', 'textuisize t' + (i + 1), spal);
            textuisize.fs = sizes[i];
            var sf = newHTML('span', undefined, textuisize);
            sf.textContent = 'A';
            textuisize.ontouchstart = UI.setTextSize;
        }
        UI.setMenuTextSize(gn('textfontsizes').childNodes[5]);
    }

    static setMenuTextColor (t) {
        var c = t.childNodes[0].childNodes[0].style.backgroundColor;
        for (var i = 0; i < gn('textcolormenu').childElementCount; i++) {
            var mycolor = gn('textcolormenu').childNodes[i].childNodes[0].childNodes[0].style.backgroundColor;
            if (c == mycolor) {
                gn('textcolormenu').childNodes[i].childNodes[1].setAttribute('class', 'splasharea on');
            } else {
                gn('textcolormenu').childNodes[i].childNodes[1].setAttribute('class', 'splasharea off');
            }
        }
    }

    static setMenuTextSize (t) {
        var c = t.fs;
        for (var i = 0; i < gn('textfontsizes').childElementCount; i++) {
            var kid = gn('textfontsizes').childNodes[i];
            var fs = kid.fs;
            var ckid = kid.className.split(' ')[1];
            if (c == fs) {
                gn('textfontsizes').childNodes[i].className = 'textuisize ' + ckid + ' on';
            } else {
                gn('textfontsizes').childNodes[i].className = 'textuisize ' + ckid + ' off';
            }
        }
    }

    /////////////////////////////////////////////////////////
    // Text color and size
    /////////////////////////////////////////////////////////

    static topLevelColor (e) {
        e.preventDefault();
        e.stopPropagation();
        if (gn('fontcolorbutton').className == 'changecolorText on') {
            gn('fontcolorbutton').className = 'changecolorText off';
            gn('textcolormenu').className = 'textuicolormenu off';
        } else {
            gn('fontsizebutton').className = 'fontsizeText off';
            gn('textfontsizes').className = 'textuifont off';
            var text = document.forms.activetextbox.textsprite;
            var indx = BlockSpecs.fontcolors.indexOf(text);
            if (indx > -1) {
                UI.setMenuTextColor(gn('textcolormenu').childNodes[indx]);
            }
            gn('textcolormenu').className = 'textuicolormenu on';
            gn('fontcolorbutton').className = 'changecolorText on';
        }
    }

    static setTextColor (e) {
        if (e.touches && (e.touches.length > 1)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (window.event) {
            t = window.event.srcElement;
        } else {
            t = e.target;
        }
        var b = 'textcolorbucket' != t.className;
        while (b) {
            var t = t.parentNode;
            b = t && ('textcolorbucket' != t.className);
        }
        if (!t) {
            return;
        }
        ScratchAudio.sndFX('splash.wav');
        UI.setMenuTextColor(t);
        var text = document.forms.activetextbox.textsprite;
        var c = t.childNodes[0].childNodes[0].style.background;
        text.setColor(c);
        Undo.record({
            action: 'edittext',
            where: text.div.parentNode.owner.id,
            who: text.id
        });
        ScratchJr.storyStart('UI.setTextColor'); // Record a change for sample projects in story-starter mode
        var ti = document.forms.activetextbox.typing;
        ti.style.color = c;
    }

    static openFontSizeMenu (e) {
        e.preventDefault();
        e.stopPropagation();
        if (gn('fontsizebutton').className == 'fontsizeText on') {
            gn('fontsizebutton').className = 'fontsizeText off';
            gn('textfontsizes').className = 'textuifont off';
        } else {
            gn('fontcolorbutton').className = 'changecolorText off';
            gn('textcolormenu').className = 'textuicolormenu off';
            var text = document.forms.activetextbox.textsprite;
            var indx = BlockSpecs.fontsizes.indexOf(text.fontsize);
            if (indx > -1) {
                UI.setMenuTextSize(gn('textfontsizes').childNodes[indx]);
            }
            gn('textfontsizes').className = 'textuifont on';
            gn('fontsizebutton').className = 'fontsizeText on';
        }
    }

    static setTextSize (e) {
        e.preventDefault();
        e.stopPropagation();
        var t;
        if (window.event) {
            t = window.event.srcElement;
        } else {
            t = e.target;
        }
        if (t.nodeName == 'SPAN') {
            t = t.parentNode;
        }
        if (!t) {
            return;
        }
        var ckid = t.className.split(' ')[0];
        if (ckid != 'textuisize') {
            return;
        }
        UI.setMenuTextSize(t);
        var text = document.forms.activetextbox.textsprite;
        text.setFontSize(t.fs);
        Undo.record({
            action: 'edittext',
            where: text.div.parentNode.owner.id,
            who: text.id
        });
        ScratchJr.storyStart('UI.setTextSize'); // Record a change for sample projects in story-starter mode
        var ti = document.forms.activetextbox.typing;
        ti.style.fontSize = (t.fs * scaleMultiplier) + 'px';
        setProps(document.forms.activetextbox.style, {
            height: ((t.fs + 10) * scaleMultiplier) + 'px'
        });
    }

    ///////////////////////////////////////////
    // UI clear
    /////////////////////////////////////////

    static clear () {
        var costumes = gn('spritecc');
        while (costumes.childElementCount > 0) {
            costumes.removeChild(costumes.childNodes[0]);
        }
        var pthumbs = gn('pagecc');
        while (pthumbs.childElementCount > 0) {
            pthumbs.removeChild(pthumbs.childNodes[0]);
        }
    }
}
