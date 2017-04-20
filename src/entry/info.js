import {gn} from '../utils/lib';
import iOS from '../iPad/iOS';

export function infoMain () {
    gn('use-in-school').ontouchend = moveToHome;
    gn('use-at-home').ontouchend = moveToHome;
    gn('ask-me-later').ontouchend = moveToHome;
    gn('dont-ask-again').ontouchend = moveToHome;
}

function moveToHome (e) {
    var eventLabel = "";

    switch (e.target.id) {
        case 'use-in-school':
            eventLabel = 'in_school';
            iOS.stopAskingUsage();
            break;
        case 'use-at-home':
            eventLabel = 'at_home';
            iOS.stopAskingUsage();
            break;
        case 'ask-me-later':
            eventLabel = 'ask_later';
            break;
        case 'dont-ask-again':
            eventLabel = 'dont_ask';
            iOS.stopAskingUsage();
            break;
    }

    // UNCOMMENT TO BEGIN ANALYTICS USE
    // iOS.analyticsEvent('lobby', 'scratchjr_usage', eventLabel);

    window.location.href = 'index.html';
}
