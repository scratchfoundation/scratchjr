import {gn} from '../utils/lib';
import iOS from '../iPad/iOS';
import Cookie from '../utils/Cookie';

export function infoMain () {
    gn('use-in-school').ontouchend = moveToHome;
    gn('use-at-home').ontouchend = moveToHome;
    gn('use-other').ontouchend = moveToHome;
    gn('ask-me-later').ontouchend = moveToHome;
    gn('dont-ask-again').ontouchend = moveToHome;
}

function moveToHome (e) {
    var usage = "";

    switch (e.target.id) {
        case 'use-in-school':
            usage = 'school';
            iOS.stopAskingUsage();
            break;
        case 'use-at-home':
            usage = 'home';
            iOS.stopAskingUsage();
            break;
        case 'use-other':
            usage = 'other';
            iOS.stopAskingUsage();
            break;
        case 'ask-me-later':
            usage = 'ask_later';
            break;
        case 'dont-ask-again':
            usage = 'dont_ask';
            iOS.stopAskingUsage();
            break;
    }

    // Send one-time analytics event about usage
    iOS.analyticsEvent('lobby', 'scratchjr_usage', usage);

    // Set Cookie for future analytics events to use
    setUsageCookie(usage);

    // Go to index.html
    window.location.href = 'index.html';
}

function setUsageCookie(usage) {
    Cookie.set('usage', usage);
}
