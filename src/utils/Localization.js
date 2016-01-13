import Cookie from './Cookie';
import IntlMessageFormat from 'intl-messageformat';

let currentLocale;
let root = '';
let localizationMessages = {};
let defaultLocalizationMessages = {};

// Configuration
const defaultLocale = window.Settings.defaultLocale;
const defaultLocaleShort = window.Settings.defaultLocaleShort;
const supportedLocales = window.Settings.supportedLocales;
const sampleKeyPrefix = 'key_';

export default class Localization {
    // Take the browser's reported locale from navigator.language
    // Normalize this value and find a match in supportedLocales
    // If we support a similar language but not the specific one, it's returned.
    // E.g., if we support 'en-US' but not 'en-GB', the user gets 'en-US'
    // The match in supported locales (or the default locale) is returned.
    static determineLocaleFromBrowser () {
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
    static includeLocales () {
        var localizationCookie = Cookie.get('localization');
        if (localizationCookie === null) {
            currentLocale = this.determineLocaleFromBrowser();
        } else {
            currentLocale = localizationCookie;
        }
        var topLevel = currentLocale.split('-')[0];

        // Intl locale-data
        document.write('<script src="' + root +
            'jssource/external/Intl/locale-data/jsonp/' + topLevel + '.js"><\/script>');
        // Always load default locale
        document.write('<script src="' + root +
            'jssource/external/Intl/locale-data/jsonp/' + defaultLocale + '.js"><\/script>');
        document.write('<script src="' + root +
            'jssource/external/intl-messageformat/locale-data/' + defaultLocaleShort + '.js"><\/script>');

        // Get messages synchronously
        var xhr = new XMLHttpRequest();
        xhr.open('GET', root + 'localizations/' + topLevel + '.json', false);
        xhr.send(null);
        localizationMessages = JSON.parse(xhr.responseText);

        xhr = new XMLHttpRequest();
        xhr.open('GET', this.root + 'localizations/' + this.defaultLocale + '.json', false);
        xhr.send(null);
        defaultLocalizationMessages = JSON.parse(xhr.responseText);
    }

    // Translate a particular message given the message key and info
    static localize (key, formatting) {
        var message;
        if (key in localizationMessages) {
            message = new IntlMessageFormat(localizationMessages[key], currentLocale);
            return message.format(formatting);
        } else if (key in defaultLocalizationMessages) {
            message = new IntlMessageFormat(defaultLocalizationMessages[key], defaultLocale);
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
