import Cookie from './Cookie';
import Intl from 'intl';
import IO from '../iPad/IO';

if (!window.Intl) {
    window.Intl = Intl;
}

require('intl/locale-data/jsonp/ca.js');
require('intl/locale-data/jsonp/de.js');
require('intl/locale-data/jsonp/en.js');
require('intl/locale-data/jsonp/es.js');
require('intl/locale-data/jsonp/fr.js');
require('intl/locale-data/jsonp/it.js');
require('intl/locale-data/jsonp/nl.js');
require('intl/locale-data/jsonp/ja.js');
require('intl/locale-data/jsonp/pt.js');
require('intl/locale-data/jsonp/sv.js');
require('intl/locale-data/jsonp/th.js');
require('intl/locale-data/jsonp/zh.js');

require('expose-loader?IntlMessageFormat!intl-messageformat');
require('intl-messageformat/dist/locale-data/ca');
require('intl-messageformat/dist/locale-data/de');
require('intl-messageformat/dist/locale-data/en');
require('intl-messageformat/dist/locale-data/es');
require('intl-messageformat/dist/locale-data/fr');
require('intl-messageformat/dist/locale-data/it');
require('intl-messageformat/dist/locale-data/nl');
require('intl-messageformat/dist/locale-data/ja');
require('intl-messageformat/dist/locale-data/pt');
require('intl-messageformat/dist/locale-data/sv');
require('intl-messageformat/dist/locale-data/th');
require('intl-messageformat/dist/locale-data/zh');

let currentLocale;
let localizationMessages = {};

// Configuration
const sampleKeyPrefix = 'key_';

export default class Localization {
    static get currentLocale () {
        return currentLocale;
    }

    // Take the browser's reported locale from navigator.language
    // Normalize this value and find a match in supportedLocales
    // If we support a similar language but not the specific one, it's returned.
    // E.g., if we support 'en-US' but not 'en-GB', the user gets 'en-US'
    // The match in supported locales (or the default locale) is returned.
    static determineLocaleFromBrowser () {
        let defaultLocale = window.Settings.defaultLocale;
        let supportedLocales = window.Settings.supportedLocales;

        var localizationLanguage = window.navigator.userLanguage || window.navigator.language || 'en-us';

        var localizationLanguageParts = localizationLanguage.split('-');
        // Capitalize last part of localization for includes
        localizationLanguageParts[localizationLanguageParts.length - 1] = (
            localizationLanguageParts[localizationLanguageParts.length - 1].toUpperCase()
        );

        var desiredLocale = localizationLanguageParts.join('-');
        if (desiredLocale in Object.keys(supportedLocales)) {
            return desiredLocale;
        }

        // We're not supporting this locale yet - do we support an ancestor?
        for (var localeKey in supportedLocales) {
            var supportedLocale = supportedLocales[localeKey];
            var parts = supportedLocale.split('-');
            if (parts[0] == localizationLanguageParts[0]) {
                return supportedLocale; // Top-level is the same
            }
        }

        return defaultLocale;
    }

    // Include locale support files and load the messages
    // Call this when the app is initialized
    static includeLocales (localizationRoot, whenDone) {
        var localizationCookie = Cookie.get('localization');

        if (localizationCookie === null) {
            currentLocale = this.determineLocaleFromBrowser();
        } else {
            currentLocale = localizationCookie;
        }
        var topLevel = currentLocale.split('-')[0];
        if (topLevel === 'zh') {
            // need to handle locale in addition to language code for Chinese,
            // ensure it's lower case to match filename
            topLevel = currentLocale.toLowerCase();
        }

        // Get messages
        IO.requestFromServer(localizationRoot + 'localizations/' + topLevel + '.json', (result) => {
            localizationMessages = JSON.parse(result);
            whenDone();
        });
    }

    // Translate a particular message given the message key and info
    static localize (key, formatting) {
        var message;
        if (key in localizationMessages) {
            message = new window.IntlMessageFormat(localizationMessages[key], currentLocale);
            return message.format(formatting);
        }
        return 'String missing: ' + key;
    }

    // For sample projects, some fields (sprite names, text on stage, and text in say blocks)
    // may have a special prefix to indicate that it should be replaced with a localized value.
    // E.g., we might have some text on the stage that says "Touch me" in English. This gets translated.
    static isSampleLocalizedKey (str) {
        return str.slice(0, sampleKeyPrefix.length) == sampleKeyPrefix;
    }
}
