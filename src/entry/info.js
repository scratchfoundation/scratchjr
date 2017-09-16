import {gn} from '../utils/lib';
import iOS from '../iPad/iOS';
import Cookie from '../utils/Cookie';
import Localization from '../utils/Localization';

export function infoMain () {
    setLocalizationTexts();

    gn('use-in-school').ontouchend = moveToHome;
    gn('use-at-home').ontouchend = moveToHome;
    gn('use-other').ontouchend = moveToHome;

    gn('dont-ask-again').ontouchend = moveToHome;
}

function moveToHome (e) {
    var usageText = "";

    switch (e.target.id) {
        case 'use-in-school':
            usageText = 'school';
            break;
        case 'use-at-home':
            usageText = 'home';
            break;
        case 'use-other':
            usageText = 'other';
            break;
        case 'dont-ask-again':
        case 'dont-ask-text':
            usageText = 'dont_ask';
            break;
    }

    // Store key in NSUserDefaults to never show info.html again
    iOS.stopAskingUsage();

    // Send one-time analytics event about usage
    iOS.analyticsEvent('lobby', 'scratchjr_usage', usageText);

    // Set Cookie for future analytics events to use
    setUsageCookie(usageText);

    // Go to index.html
    window.location.href = 'index.html';
}

function setLocalizationTexts() {
    // Localization Text; Uncomment when dictionaries have keys
    /*
    gn('school-text').textContent = Localization.localize('USAGE_SCHOOL');
    gn('home-text').textContent = Localization.localize('USAGE_HOME');
    gn('other-text').textContent = Localization.localize('USAGE_OTHER');
    gn('dont-ask-text').textContent = Localization.localize('USAGE_DONT_ASK');
    */

    gn('school-text').textContent = "School";
    gn('home-text').textContent = "Home";
    gn('other-text').textContent = "Other";
    gn('dont-ask-text').textContent = "Don't Ask Again";
}

function setUsageCookie(usageText) {
    Cookie.set('usage', usageText);
}
