window.Localization = function () {};

// Configuration
Localization.defaultLocale = Settings.defaultLocale;
Localization.defaultLocaleShort = Settings.defaultLocaleShort;
Localization.supportedLocales = Settings.supportedLocales;
Localization.root = '';

// Take the browser's reported locale from navigator.language
// Normalize this value and find a match in Localization.supportedLocales
// If we support a similar language but not the specific one, it's returned.
// E.g., if we support 'en-US' but not 'en-GB', the user gets 'en-US'
// The match in supported locales (or the default locale) is returned.
Localization.determineLocaleFromBrowser = function () {
    var localizationLanguage = window.navigator.userLanguage || window.navigator.language || 'en-us';

    var localizationLanguageParts = localizationLanguage.split('-');
    // Capitalize last part of localization for includes
    localizationLanguageParts[localizationLanguageParts.length - 1] = (
        localizationLanguageParts[localizationLanguageParts.length - 1].toUpperCase()
    );

    var desiredLocale = localizationLanguageParts.join('-');
    if (desiredLocale in Object.keys(Localization.supportedLocales)) {
        return desiredLocale;
    }

    // We're not supporting this locale yet - do we support an ancestor?
    for (var localeKey in Localization.supportedLocales) {
        var supportedLocale = Localization.supportedLocales[localeKey];
        var parts = supportedLocale.split('-');
        if (parts[0] == localizationLanguageParts[0]) {
            return supportedLocale; // Top-level is the same
        }
    }

    return Localization.defaultLocale;
};

// Include locale support files and load the messages
// Call this when the app is initialized
Localization.includeLocales = function () {
    var localizationCookie = Cookie.get('localization');
    if (localizationCookie === null) {
        Localization.currentLocale = Localization.determineLocaleFromBrowser();
    } else {
        Localization.currentLocale = localizationCookie;
    }
    // Intl locale-data
    document.write('<script src="' + Localization.root +
        'jssource/external/Intl/locale-data/jsonp/' + Localization.currentLocale + '.js"><\/script>');

    // MessageFormat locale-data
    var topLevel = Localization.currentLocale.split('-')[0];
    document.write('<script src="' + Localization.root +
        'jssource/external/intl-messageformat/locale-data/' + topLevel + '.js"><\/script>');

    // Always load default locale
    document.write('<script src="' + Localization.root +
        'jssource/external/Intl/locale-data/jsonp/' + Localization.defaultLocale + '.js"><\/script>');
    document.write('<script src="' + Localization.root +
        'jssource/external/intl-messageformat/locale-data/' + Localization.defaultLocaleShort + '.js"><\/script>');

    // Get messages synchronously
    var xhr = new XMLHttpRequest();
    xhr.open('GET', Localization.root + 'localizations/' + Localization.currentLocale + '.json', false);
    xhr.send(null);
    Localization.localizationMessages = JSON.parse(xhr.responseText);

    xhr = new XMLHttpRequest();
    xhr.open('GET', Localization.root + 'localizations/' + Localization.defaultLocale + '.json', false);
    xhr.send(null);
    Localization.defaultLocalizationMessages = JSON.parse(xhr.responseText);
};

// Translate a particular message given the message key and info
Localization.localize = function (key, formatting) {
    var message;
    if (key in Localization.localizationMessages) {
        message = new IntlMessageFormat(Localization.localizationMessages[key], Localization.currentLocale);
        return message.format(formatting);
    } else if (key in Localization.defaultLocalizationMessages) {
        message = new IntlMessageFormat(Localization.defaultLocalizationMessages[key], Localization.defaultLocale);
        return message.format(formatting);
    }
    return 'String missing: ' + key;
};

// For sample projects, some fields (sprite names, text on stage, and text in say blocks)
// may have a special prefix to indicate that it should be replaced with a localized value.
// E.g., we might have some text on the stage that says "Touch me" in English. This gets translated.
Localization.sampleKeyPrefix = 'key_';
Localization.isSampleLocalizedKey = function (str) {
    return str.slice(0, Localization.sampleKeyPrefix.length) == Localization.sampleKeyPrefix;
};
