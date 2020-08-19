import ScratchAudio from '../utils/ScratchAudio';
import {gn, getUrlVars, isAndroid, isiOS} from '../utils/lib';
import OS from '../tablet/OS';
import UI from '../editor/ui/UI';
import Localization from '../utils/Localization';
import InitialOptions from '../utils/InitialOptions';

/*
When this code starts up, there are several scenarios:
* the app was already running: "AlreadyRunning"
* the app was not already running, but has been opened before: "NewSession"
* the app has never been opened before: "FirstTimeEver"

*/

let alreadyStartedQuestions = false;

export function indexMain () {
    gn('gettings').ontouchend = indexGettingstarted;
    gn('startcode').ontouchend = indexGohome;
    ScratchAudio.init();
    var urlvars = getUrlVars();
    if (urlvars.back && InitialOptions.allQuestionsAnswered()) {
        indexLoadStart();
    } else {
        indexNewSession();
    }

    if (window.Settings.edition == 'PBS') {
        gn('topbar-moreapps').textContent = Localization.localize('PBS_MORE_APPS');
        gn('startButton').textContent = Localization.localize('PBS_START');
        gn('gettings').textContent = Localization.localize('PBS_HOW_TO');

        gn('startButton').ontouchend = indexGohome;
        gn('pbschars').ontouchend = indexGohome;

        gn('topbar-moreapps').ontouchstart = indexMoreApps;
        gn('topbar-settings').ontouchstart = indexGoSettings;
        gn('topbar-info').ontouchstart = indexInfo;
    } else {
        gn('gear').ontouchstart = indexGoSettings;
    }

    setTimeout(function () {
        gn('rays').className = 'rays spinme';
    }, 250);
}

function startQuestionsIfNotAlreadyStarted () {
    if (!alreadyStartedQuestions) {
        alreadyStartedQuestions = true;
        indexAskRemainingQuestions();
    }
    window.removeEventListener('touchend', startQuestionsIfNotAlreadyStarted, false);
}

function indexNewSession () {
    showSplash();
    OS.askpermission(); // ask for sound recording
    setTimeout(function () {
        OS.hidesplash(addTouchListener);
    }, 500);
    // may be necessary to wait for a touch in some environments
    function addTouchListener () {
        window.addEventListener('touchend', startQuestionsIfNotAlreadyStarted, false);
    }
    setTimeout(startQuestionsIfNotAlreadyStarted, 2000);
}

function showSplash () {
    gn('authors').className = 'credits show';
    gn('authorsText').className = 'creditsText show';
    if (window.Settings.edition == 'PBS') {
        gn('pbschars').className = 'characters hide';
        gn('startcode').className = 'catlogo show';
        gn('topbar').className = 'topbar hide';
        gn('startButton').className = 'startButton hide';
    } else {
        gn('purpleguy').className = 'purple show';
        gn('blueguy').className = 'blue show';
        gn('redguy').className = 'red show';
    }
}

function indexHideSplash () {
    gn('authors').className = 'credits hide';
    gn('authorsText').className = 'creditsText hide';

    if (window.Settings.edition == 'PBS') {
        gn('pbschars').className = 'characters show';
        gn('topbar').className = 'topbar show';
        gn('startButton').className = 'startButton show';
    } else {
        gn('purpleguy').className = 'purple hide';
        gn('blueguy').className = 'blue hide';
        gn('redguy').className = 'red hide';
        gn('gear').className = 'gear show';
    }
}

function indexLoadStart () {
    indexHideSplash();
    showLogo();
    gn('gettings').className = 'gettings show';
    gn('startcode').className = 'startcode show';
    document.ontouchmove = function (e) {
        e.preventDefault();
    };
    if (isAndroid) {
        AndroidInterface.notifySplashDone();
    }
}

function indexAskRemainingQuestions () {
    var nextQuestionKey = InitialOptions.nextUnansweredQuestion();
    if (nextQuestionKey) {
        indexShowQuestion(nextQuestionKey);
    } else { // done with questions
        indexLoadStart();
    }
}

function hideLogo () {
    gn('catface').className = 'catface hide';
    gn('jrlogo').className = 'jrlogo hide';
}

function showLogo () {
    gn('catface').className = 'catface show';
    gn('jrlogo').className = 'jrlogo show';
}

function indexAskPlace () {
    gn('authors').className = 'credits show';
    gn('authorsText').className = 'creditsText hide';
    gn('purpleguy').className = 'purple hide';
    gn('blueguy').className = 'blue hide';
    gn('redguy').className = 'red hide';

    gn('usageQuestion').textContent = Localization.localize('USAGE_QUESTION');
    gn('useSchoolText').textContent = Localization.localize('USAGE_SCHOOL');
    gn('useHomeText').textContent = Localization.localize('USAGE_HOME');
    gn('useOtherText').textContent = Localization.localize('USAGE_OTHER');
    gn('usageNoanswerText').textContent = Localization.localize('USAGE_NONE');

    gn('usageQuestion').className = 'usageQuestion show';
    gn('usageSchool').className = 'usageSchool show';
    gn('usageHome').className = 'usageHome show';
    gn('usageOther').className = 'usageOther show';
    gn('usageNoanswer').className = 'usageNoanswer show';
    gn('usageSchool').ontouchend = indexSetPlace;
    gn('usageHome').ontouchend = indexSetPlace;
    gn('usageOther').ontouchend = indexSetPlace;
    gn('usageNoanswer').ontouchend = indexSetPlace;
}

function indexSetPlace (e) {
    var usageText = '';

    switch (e.target.parentElement.id) {
    case 'usageSchool':
        usageText = 'school';
        break;
    case 'usageHome':
        usageText = 'home';
        break;
    case 'usageOther':
        usageText = 'other';
        break;
    case 'usageNoanswer':
    default:
        usageText = 'noanswer';
        break;
    }
    // Send one-time analytics event about usage
    OS.analyticsEvent('lobby', 'scratchjr_usage', usageText);
    InitialOptions.setValue('place', usageText);
    // we use 'place_preference' for this particular Firebase pref
    OS.setAnalyticsPref('place_preference', usageText);
    ScratchAudio.sndFX('tap.wav');
    indexHidePlaceQuestion();
    indexAskRemainingQuestions();
}

function indexHidePlaceQuestion () {
    gn('catface').className = 'catface show';
    gn('jrlogo').className = 'jrlogo show';
    gn('usageQuestion').className = 'usageQuestion hide';
    gn('usageSchool').className = 'usageSchool hide';
    gn('usageHome').className = 'usageHome hide';
    gn('usageOther').className = 'usageOther hide';
    gn('usageNoanswer').className = 'usageNoanswer hide';
}

function optionTouched (elem) {
    var key = elem.target.getAttribute('data-key');
    var value = elem.target.getAttribute('data-value');
    // sometimes a touch is registered by a child of the relevant parent
    if (!key && !value) {
        var parent = elem.target.parentNode;
        key = parent.getAttribute('data-key');
        value = parent.getAttribute('data-value');
    }
    // if we still don't have a key and value, something is wrong -- just go
    // to lobby
    if (!key && !value) {
        indexLoadStart();
        return;
    }
    // elem.target.style.backgroundColor = 'purple';
    // if everything is good, register the selection and advance to next screen
    indexSelectOption(key, value);
}

// show the question for a given settings option key
function indexShowQuestion (key) {
    indexHideSplash();
    hideLogo();
    var optionType = InitialOptions.optionTypeForKey(key);
    if (optionType === 'place') {
        indexAskPlace();
    } else { // custom question
        var options = InitialOptions.optionsForKey(key);
        // if we could not find any options, choose 'n/a'
        if (!options || !options.length) {
            indexSelectOption(key, 'n/a');
            return;
        }
        // if there's only one option, don't bother asking, just choose it!
        if (options.length === 1) {
            indexSelectOption(key, options[0]);
            return;
        }
        // if we got here, there is more than one option...
        var instructionText = InitialOptions.instructionForKey(key);
        var instructionElem = document.getElementById('optionsInstruction');
        instructionElem.appendChild(document.createTextNode(instructionText));
        gn('optionsInstruction').className = 'optionsInstruction show';

        var optionsListElem = document.getElementById('optionsList');
        var optionNum = 0;
        options.forEach(function (option) {
            var optionElem = document.createElement('div');
            optionElem.setAttribute('data-key', key);
            optionElem.setAttribute('data-value', option);
            optionElem.setAttribute('id', 'option-' + key + '-' + optionNum);
            optionElem.ontouchend = optionTouched;
            optionsListElem.appendChild(optionElem);

            switch (optionType) {
            case 'image':
                var imgElem = document.createElement('img');
                imgElem.setAttribute('src', 'svglibrary/' + option);
                imgElem.setAttribute('style', 'max-width: 150px; max-height: 90px');
                optionElem.appendChild(imgElem);
                break;
            case 'text':
            default:
                optionElem.appendChild(document.createTextNode(option));
                break;
            }
            optionNum = optionNum + 1;
        });
        gn('optionsList').className = 'optionsList show';
    }
}

// store user selection, and show next question
function indexSelectOption (key, val) {
    InitialOptions.setValue(key, val);
    OS.setAnalyticsPref(key, val);
    ScratchAudio.sndFX('tap.wav');

    // clear out old options instruction
    var instructionElem = document.getElementById('optionsInstruction');
    instructionElem.innerHTML = '';
    gn('optionsInstruction').className = 'optionsInstruction hide';
    // clear out old options content
    var optionsListElem = document.getElementById('optionsList');
    optionsListElem.innerHTML = '';
    gn('optionsList').className = 'optionsList hide';

    // show next question, or advance to start screen
    indexAskRemainingQuestions();
}

function indexGohome () {
    OS.setfile('homescroll.sjr', 0, function () {
        doNext();
    });
    function doNext () {
        window.location.href = 'home.html';
    }
}

function indexGoSettings () {
    // Switch to the settings selection page
    // Triggered by tapping the gear icon in the top right
    ScratchAudio.sndFX('tap.wav');
    window.location.href = 'home.html?place=gear';
}

function indexGettingstarted () {
    ScratchAudio.sndFX('tap.wav');
    window.location.href = 'gettingstarted.html?place=home';
}

// For PBS KIDS edition only
function indexInfo () {
    ScratchAudio.sndFX('tap.wav');
    window.location.href = 'home.html?place=book';
}

function indexMoreApps () {
    ScratchAudio.sndFX('tap.wav');

    UI.parentalGate(null, function () {
        if (isiOS) {
            window.location.href = 'https://itunes.apple.com/us/developer/pbs-kids/id324323339?mt=8';
        } else {
            window.location.href = 'http://to.pbs.org/ScJr_GPlay';
        }
    });
}
