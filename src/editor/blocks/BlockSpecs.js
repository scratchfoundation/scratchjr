import Localization from '../../utils/Localization';
import IO from '../../iPad/IO';

let loadCount = 0;

let loadassets = {};
let fontwhite = '#f2f3f2';
let fontpink = '#ff8ae9';
let fontdarkgray = '#6d6e6c';
let fontblack = '#1b2a34';
let fontyellow = '#ffdd33';
let fontdarkgreen = '#287f46';
let fontpurple = '#8f56e3';
let fontblue = '#0d50ab';
let fontred = '#c4281b';
let fontorange = '#da8540';

let fontcolors = [fontred, fontorange, fontyellow,
    fontdarkgreen, fontblue, fontpink, fontpurple,
    fontwhite, fontdarkgray, fontblack];

let fontsizes = [16, 24, 36, 48, 56, 72];

let getshapes = ['LetterGet_Orange', 'LetterGet_Red', 'LetterGet_Yellow', 'LetterGet_Green',
    'LetterGet_Blue', 'LetterGet_Purple'];
let sendshapes = ['LetterSend_Orange', 'LetterSend_Red', 'LetterSend_Yellow', 'LetterSend_Green',
    'LetterSend_Blue', 'LetterSend_Purple'];

let speeds = ['speed0', 'speed1', 'speed2'];

export default class BlockSpecs {
    static get loadCount () {
        return loadCount;
    }

    static set loadCount (newLoadCount) {
        loadCount = newLoadCount;
    }

    static get fontcolors () {
        return fontcolors;
    }

    static get fontsizes () {
        return fontsizes;
    }

    static get speeds () {
        return speeds;
    }

    static initBlocks () {
        loadassets = new Object();
        BlockSpecs.loadGraphics();
        BlockSpecs.defs = BlockSpecs.setupBlocksSpecs();
        BlockSpecs.palettes = BlockSpecs.setupPalettesDef();
        BlockSpecs.categories = BlockSpecs.setupCategories();
        if (window.Settings.edition == 'PBS') {
            BlockSpecs.canvasMask = BlockSpecs.getImageFrom('assets/ui/canvasmask', 'svg');
        } else {
            BlockSpecs.canvasMask = BlockSpecs.getImageFrom('assets/ui/canvasmask');
        }
        if (window.Settings.edition != 'PBS') {
            BlockSpecs.projectThumb = BlockSpecs.getImageFrom('assets/lobby/pmask');
        }
        IO.requestFromServer('assets/balloon.svg', BlockSpecs.setBalloon);
        loadCount++;
    }

    static setBalloon (str) {
        loadCount--;
        BlockSpecs.balloon = str;
    }


    static loadGraphics () {
        BlockSpecs.mic = BlockSpecs.getImageFrom('assets/ui/recordslot', 'svg');
        BlockSpecs.yellowStart = BlockSpecs.getImageFrom('assets/blocks/start', 'svg');
        BlockSpecs.yellowStartH = BlockSpecs.getImageFrom('assets/blocks/eh/startH');

        BlockSpecs.yellowCmd = BlockSpecs.getImageFrom('assets/blocks/yellowCmd', 'svg');
        BlockSpecs.yellowCmdH = BlockSpecs.getImageFrom('assets/blocks/eh/yellowCmdH');

        BlockSpecs.redEnd = BlockSpecs.getImageFrom('assets/blocks/endshort', 'svg');
        BlockSpecs.redEndH = BlockSpecs.getImageFrom('assets/blocks/eh/stopH');

        BlockSpecs.orangeCmd = BlockSpecs.getImageFrom('assets/blocks/flow', 'svg');
        BlockSpecs.orangeCmdH = BlockSpecs.getImageFrom('assets/blocks/eh/flowH');

        BlockSpecs.limeCmd = BlockSpecs.getImageFrom('assets/blocks/sounds', 'svg');
        BlockSpecs.limeCmdH = BlockSpecs.getImageFrom('assets/blocks/eh/soundsH');

        BlockSpecs.pinkCmd = BlockSpecs.getImageFrom('assets/blocks/looks', 'svg');
        BlockSpecs.pinkCmdH = BlockSpecs.getImageFrom('assets/blocks/eh/looksH');

        BlockSpecs.redEndLong = BlockSpecs.getImageFrom('assets/blocks/endlong', 'svg');
        BlockSpecs.redEndLongH = BlockSpecs.getImageFrom('assets/blocks/eh/stoplongH');

        BlockSpecs.cShape = BlockSpecs.getImageFrom('assets/blocks/repeat');
        BlockSpecs.cShapeH = BlockSpecs.getImageFrom('assets/blocks/eh/repeatH');

        BlockSpecs.blueCmd = BlockSpecs.getImageFrom('assets/blocks/blueCmd', 'svg');
        BlockSpecs.blueCmdH = BlockSpecs.getImageFrom('assets/blocks/eh/blueCmdH');

        BlockSpecs.textfieldimg = BlockSpecs.getImageFrom('assets/misc/Text-01');
        BlockSpecs.numfieldimg = BlockSpecs.getImageFrom('assets/misc/Number-01');
        BlockSpecs.pressbutton = BlockSpecs.getImageFrom('assets/misc/pushbutton-01', 'svg');
        BlockSpecs.pressbuttonSmall = BlockSpecs.getImageFrom('assets/misc/pushbutton', 'svg');
        BlockSpecs.caretrepeat = BlockSpecs.getImageFrom('assets/blocks/caretrepeat');
        BlockSpecs.cmdS = BlockSpecs.getImageFrom('assets/blocks/shadowCmd', 'svg');
        BlockSpecs.startS = BlockSpecs.getImageFrom('assets/blocks/shadowStart', 'svg');
        BlockSpecs.endS = BlockSpecs.getImageFrom('assets/blocks/shadowEndShort', 'svg');
        BlockSpecs.endLongS = BlockSpecs.getImageFrom('assets/blocks/shadowEndLong', 'svg');
        BlockSpecs.repeatS = BlockSpecs.getImageFrom('assets/blocks/shadowRepeat');

    }

    static getImageFrom (url, ext) {
        var img = document.createElement('img');
        img.src = url + (ext ? '.' + ext : '.png');
        if (!img.complete) {
            loadassets[img.src] = img;
            loadCount++;
            img.onload = function () {
                delete loadassets[img.src];
                loadCount--;
            };
        }
        return img;
    }


    static refreshLoading () {
        for (var key in loadassets) {
            if (loadassets[key].complete) {
                loadCount--;
            }
        }
    }

    static setupCategories () {
        return new Array(
            [
                BlockSpecs.getImageFrom('assets/categories/StartOn', 'svg'),
                BlockSpecs.getImageFrom('assets/categories/StartOff', 'svg'),
                window.Settings.categoryStartColor
            ],
            [
                BlockSpecs.getImageFrom('assets/categories/MotionOn', 'svg'),
                BlockSpecs.getImageFrom('assets/categories/MotionOff', 'svg'),
                window.Settings.categoryMotionColor
            ],
            [
                BlockSpecs.getImageFrom('assets/categories/LooksOn', 'svg'),
                BlockSpecs.getImageFrom('assets/categories/LooksOff', 'svg'),
                window.Settings.categoryLooksColor
            ],
            [
                BlockSpecs.getImageFrom('assets/categories/SoundOn', 'svg'),
                BlockSpecs.getImageFrom('assets/categories/SoundOff', 'svg'),
                window.Settings.categorySoundColor
            ],
            [
                BlockSpecs.getImageFrom('assets/categories/FlowOn', 'svg'),
                BlockSpecs.getImageFrom('assets/categories/FlowOff', 'svg'),
                window.Settings.categoryFlowColor
            ],
            [
                BlockSpecs.getImageFrom('assets/categories/StopOn', 'svg'),
                BlockSpecs.getImageFrom('assets/categories/StopOff', 'svg'),
                window.Settings.categoryStopColor
            ]
        );
    }


    static setupPalettesDef () {
        return [['onflag', 'onclick', 'ontouch', 'onmessage', 'message'],
            ['forward', 'back', 'up', 'down', 'right', 'left', 'hop', 'home'],
            ['say', 'space', 'grow', 'shrink', 'same', 'space', 'hide', 'show'],
            [],
            ['wait', 'stopmine', 'setspeed', 'repeat'],
            ['endstack', 'forever']];
    }

    ///////////////////////////////
    // Data Structure
    //
    // name - blocktype, icon or datastructure, blockshape, argtype, initial value, highlight, min, max, shadow
    //
    // arg types:
    // null
    // n -> number field;
    // t -> text field
    // m  --> image menu with argvalue equal to name;
    // d --> image menu with argvalue equal to number;
    // c -- > color drop down
    // s --> sound name
    // p --> page icon
    //
    ////////////////////////////////

    static setupBlocksSpecs () {
        return {
            'onflag': ['onflag', BlockSpecs.getImageFrom('assets/blockicons/greenFlag', 'svg'),
                BlockSpecs.yellowStart, null, null, BlockSpecs.yellowStartH, null, null, BlockSpecs.startS],
            'onmessage': ['onmessage', getshapes, BlockSpecs.yellowStart, 'm', 'Orange',
                BlockSpecs.yellowStartH, null, null, BlockSpecs.startS],
            'onclick': ['onclick', BlockSpecs.getImageFrom('assets/blockicons/OnTouch', 'svg'),
                BlockSpecs.yellowStart, null, null, BlockSpecs.yellowStartH, null, null, BlockSpecs.startS],
            'ontouch': ['ontouch', BlockSpecs.getImageFrom('assets/blockicons/Bump', 'svg'),
                BlockSpecs.yellowStart, null, null, BlockSpecs.yellowStartH, null, null, BlockSpecs.startS],
            'message': ['message', sendshapes, BlockSpecs.yellowCmd, 'm', 'Orange',
                BlockSpecs.yellowCmdH, null, null, BlockSpecs.cmdS],

            'repeat': ['repeat', BlockSpecs.getImageFrom('assets/blockicons/Repeat', 'svg'),
                BlockSpecs.cShape, 'n', 4, BlockSpecs.cShapeH, 0, 24, BlockSpecs.repeatS],

            'forward': ['forward', BlockSpecs.getImageFrom('assets/blockicons/Foward', 'svg'),
                BlockSpecs.blueCmd, 'n', 1, BlockSpecs.blueCmdH, -20, 20, BlockSpecs.cmdS],
            'back': ['back', BlockSpecs.getImageFrom('assets/blockicons/Back', 'svg'),
                BlockSpecs.blueCmd, 'n', 1, BlockSpecs.blueCmdH, -20, 20, BlockSpecs.cmdS],
            'up': ['up', BlockSpecs.getImageFrom('assets/blockicons/Up', 'svg'),
                BlockSpecs.blueCmd, 'n', 1, BlockSpecs.blueCmdH, -15, 15, BlockSpecs.cmdS],
            'down': ['down', BlockSpecs.getImageFrom('assets/blockicons/Down', 'svg'),
                BlockSpecs.blueCmd, 'n', 1, BlockSpecs.blueCmdH, -15, 15, BlockSpecs.cmdS],
            'right': ['right', BlockSpecs.getImageFrom('assets/blockicons/Right', 'svg'),
                BlockSpecs.blueCmd, 'n', 1, BlockSpecs.blueCmdH, -12, 12, BlockSpecs.cmdS],
            'left': ['left', BlockSpecs.getImageFrom('assets/blockicons/Left', 'svg'),
                BlockSpecs.blueCmd, 'n', 1, BlockSpecs.blueCmdH, -12, 12, BlockSpecs.cmdS],
            'home': ['home', BlockSpecs.getImageFrom('assets/blockicons/Home', 'svg'),
                BlockSpecs.blueCmd, null, null, BlockSpecs.blueCmdH, null, null, BlockSpecs.cmdS],
            'hop': ['hop', BlockSpecs.getImageFrom('assets/blockicons/Hop', 'svg'),
                BlockSpecs.blueCmd, 'n', 2, BlockSpecs.blueCmdH, -15, 15, BlockSpecs.cmdS],


            'wait': ['wait', BlockSpecs.getImageFrom('assets/blockicons/Wait', 'svg'),
                BlockSpecs.orangeCmd, 'n', 10, BlockSpecs.orangeCmdH, 0, 50, BlockSpecs.cmdS],
            'setspeed': ['setspeed', speeds, BlockSpecs.orangeCmd, 'd', 1,
                BlockSpecs.orangeCmdH, null, null, BlockSpecs.cmdS],
            'stopmine': ['stopmine', BlockSpecs.getImageFrom('assets/blockicons/Stop', 'svg'),
                BlockSpecs.orangeCmd, null, null, BlockSpecs.orangeCmdH, null, null, BlockSpecs.cmdS],

            'say': ['say', BlockSpecs.getImageFrom('assets/blockicons/Say', 'svg'),
                BlockSpecs.pinkCmd, 't',
                Localization.localize('SAY_BLOCK_DEFAULT_ARGUMENT'), BlockSpecs.pinkCmdH, null, null, BlockSpecs.cmdS],
            'show': ['show', BlockSpecs.getImageFrom('assets/blockicons/Appear', 'svg'),
                BlockSpecs.pinkCmd, null, null, BlockSpecs.pinkCmdH, null, null, BlockSpecs.cmdS],
            'hide': ['hide', BlockSpecs.getImageFrom('assets/blockicons/Disappear', 'svg'),
                BlockSpecs.pinkCmd, null, null, BlockSpecs.pinkCmdH, null, null, BlockSpecs.cmdS],
            'grow': ['grow', BlockSpecs.getImageFrom('assets/blockicons/Grow', 'svg'),
                BlockSpecs.pinkCmd, 'n', 2, BlockSpecs.pinkCmdH, -10, 10, BlockSpecs.cmdS],
            'shrink': ['shrink', BlockSpecs.getImageFrom('assets/blockicons/Shrink', 'svg'),
                BlockSpecs.pinkCmd, 'n', 2, BlockSpecs.pinkCmdH, -10, 10, BlockSpecs.cmdS],
            'same': ['same', BlockSpecs.getImageFrom('assets/blockicons/Reset', 'svg'),
                BlockSpecs.pinkCmd, null, null, BlockSpecs.pinkCmdH, null, null, BlockSpecs.cmdS],

            'playsnd': ['playsnd', BlockSpecs.getImageFrom('assets/blockicons/Speaker', 'svg'),
                BlockSpecs.limeCmd, 's', 'pop.mp3', BlockSpecs.limeCmdH, null, null, BlockSpecs.cmdS],
            'playusersnd': ['playusersnd', BlockSpecs.getImageFrom('assets/blockicons/Microphone', 'svg'),
                BlockSpecs.limeCmd, 'r', '1', BlockSpecs.limeCmdH, null, null, BlockSpecs.cmdS],
            'endstack': ['endstack', null, BlockSpecs.redEnd, null, null,
                BlockSpecs.redEndH, null, null, BlockSpecs.endS],
            'forever': ['forever', BlockSpecs.getImageFrom('assets/blockicons/Forever', 'svg'),
                BlockSpecs.redEnd, null, null, BlockSpecs.redEndH, null, null, BlockSpecs.endS],
            'gotopage': ['gotopage', null,
                BlockSpecs.redEndLong, 'p', '2', BlockSpecs.redEndLongH, null, null, BlockSpecs.endLongS],
            'caretstart': ['caretstart', null,
                BlockSpecs.getImageFrom('assets/blocks/caretstart', 'svg'), null, null, null, null, null],
            'caretend': ['caretend', null,
                BlockSpecs.getImageFrom('assets/blocks/caretend', 'svg'), null, null, null, null, null],
            'caretrepeat': ['caretrepeat', null,
                BlockSpecs.getImageFrom('assets/blocks/caretrepeat'), null, null, null, null, null],
            'caretcmd': ['caretcmd', null,
                BlockSpecs.getImageFrom('assets/blocks/caretcmd', 'svg'), null, null, null, null, null]

        };
    }

    static blockDesc (b, spr) {
        var str = b.getArgValue() ? b.getArgValue().toString() : (b.blocktype == 'playsnd') ? 'SOUND' : '';

        return {
            'onflag': Localization.localize('BLOCK_DESC_GREEN_FLAG'),
            'onclick': Localization.localize('BLOCK_DESC_ON_TAP', {
                CHARACTER_NAME: spr.name
            }),
            'ontouch': Localization.localize('BLOCK_DESC_ON_BUMP', {
                CHARACTER_NAME: spr.name ? spr.name : ''
            }),
            'onmessage': Localization.localize('BLOCK_DESC_ON_MESSAGE', {
                COLOR: Localization.localize('BLOCK_DESC_MESSAGE_COLOR_ORANGE')
            }),
            'repeat': Localization.localize('BLOCK_DESC_REPEAT'),
            'forward': Localization.localize('BLOCK_DESC_MOVE_RIGHT'),
            'back': Localization.localize('BLOCK_DESC_MOVE_LEFT'),
            'up': Localization.localize('BLOCK_DESC_MOVE_UP'),
            'down': Localization.localize('BLOCK_DESC_MOVE_DOWN'),
            'home': Localization.localize('BLOCK_DESC_GO_HOME'),
            'left': Localization.localize('BLOCK_DESC_TURN_LEFT'),
            'right': Localization.localize('BLOCK_DESC_TURN_RIGHT'),
            'hop': Localization.localize('BLOCK_DESC_HOP'),
            'wait': Localization.localize('BLOCK_DESC_WAIT'),
            'setspeed': Localization.localize('BLOCK_DESC_SET_SPEED'),
            'stopmine': Localization.localize('BLOCK_DESC_STOP', {
                CHARACTER_NAME: spr.name ? spr.name : spr.str
            }),
            'say': Localization.localize('BLOCK_DESC_SAY'),
            'show': Localization.localize('BLOCK_DESC_SHOW'),
            'hide': Localization.localize('BLOCK_DESC_HIDE'),
            'grow': Localization.localize('BLOCK_DESC_GROW'),
            'shrink': Localization.localize('BLOCK_DESC_SHRINK'),
            'same': Localization.localize('BLOCK_DESC_RESET_SIZE'),
            'playsnd': Localization.localize('BLOCK_DESC_PLAY_SOUND', {
                SOUND_NAME: Localization.localize('BLOCK_DESC_PLAY_SOUND_POP')
            }),
            'playusersnd': Localization.localize('BLOCK_DESC_PLAY_RECORDED_SOUND'),
            'endstack': Localization.localize('BLOCK_DESC_END'),
            'stopall': Localization.localize('BLOCK_DESC_STOP', {
                CHARACTER_NAME: spr.name ? spr.name : ''
            }),
            'forever': Localization.localize('BLOCK_DESC_REPEAT_FOREVER'),
            'gotopage': Localization.localize('BLOCK_DESC_GO_TO_PAGE', {
                PAGE: str
            }),
            'message': Localization.localize('BLOCK_DESC_SEND_MESSAGE', {
                COLOR: Localization.localize('BLOCK_DESC_MESSAGE_COLOR_ORANGE')
            })
        };
    }
}
