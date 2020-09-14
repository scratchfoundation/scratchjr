import Cookie from './Cookie';

let settingsSection = null; // reference to settings.json's "initialOptions" section
let currentVals = {}; // locally cached copy of the same key-value settings in cookie
// tracks keys for options that have been set during the current session
// (useful for questions we want to ask every time the app starts up)
let answeredThisSession = {};

export default class InitialOptions {

    // ****************************************
    // functions only used from within InitialOptions
    // ****************************************

    /**
     * Checks if a cookie is set for a given question
     * @param {string} key indicates which options question to use
     */
    static hasCookieSet (key) {
        var usageCookie = Cookie.get(key);
        return usageCookie !== null;
    }

    /**
     * Checks if a given question has been answered. If the question needs to be
     * asked every time the app starts, check that it has been asked this session.
     * @param {object} question options question object from settings
     */
    static isAnswered (question) {
        if (!question) return false;
        if (InitialOptions.hasCookieSet(question.key)) {
            // if the cookie is set, check if the question needs to be asked
            // every time (and hasn't been asked yet)
            if (question.everyTime && !answeredThisSession[question.key]) {
                return false;
            }
            return true;
        }
        return false;
    }

    /**
     * Initialize currentVals for attaching to Analytics events from
     * the usage cookie if it is set. currentVals is blank if the cookie is
     * not set.
     * @param {string} key indicates which options question to use
     */
    static initKeyFromCookie (key) {
        const usageCookie = Cookie.get(key);
        currentVals[key] = (usageCookie) ? usageCookie : '';
    }

    /**
     * Get value for a given question and a given field for that question
     * @param {string} questionKey indicates which options question to use
     * @param {string} fieldKey indicates which field of that question to use
     */
    static valForKeyAndField (questionKey, fieldKey) {
        if (!settingsSection || !settingsSection.length) return null;
        var question = settingsSection.find(function (question) {
            return (question.key === questionKey);
        });
        if (!question || !question[fieldKey]) return null;
        return question[fieldKey];
    }

    // ****************************************
    // functions called from outside InitialOptions
    // ****************************************

    /**
     * Process settings object from settings.json, and initialize values
     * using cookie values
     * @param {object} settingsSectionParam JSON-derived object with entire
     * initialOptions section from settings
     */
    static initWithSettings (settingsSectionParam) {
        settingsSection = settingsSectionParam;
        if (!settingsSection) return;
        settingsSection.forEach(function (question) {
            // question is like {key: OPTION_NAME, options: [...]}
            InitialOptions.initKeyFromCookie(question.key);
        });
    }

    /**
     * Get instruction for given question
     * @param {string} key indicates which options question to use
     */
    static instructionForKey (key) {
        return InitialOptions.valForKeyAndField(key, 'instruction');
    }

    /**
     * Get question type for given question
     * @param {string} key indicates which options question to use
     */
    static optionTypeForKey (key) {
        var type = InitialOptions.valForKeyAndField(key, 'type');
        if (!type) {
            type = 'text'; // default
        }
        return type;
    }

    /**
     * Get array of posible value choices for given question.
     * If question depends on a previous response, use that response to
     * determine which value choices to show.
     * @param {string} key indicates which options question to use
     */
    static optionsForKey (key) {
        if (!settingsSection || !settingsSection.length) return null;
        var question = settingsSection.find(function (question) {
            return (question.key === key);
        });
        if (!question || !question.values) return null;
        var valuesKey = 'default';
        if (question.dependsOn) {
            var prevSelection = currentVals[question.dependsOn];
            if (question.values[prevSelection]) valuesKey = prevSelection;
        }
        if (!question.values[valuesKey] || !question.values[valuesKey].length) return null;
        return question.values[valuesKey];
    }

    /**
     * Checks if all of the questions have options set. If any question doesn't
     * have a cookie value set, or if it needs to be asked every time the app
     * starts and hasn't yet, return false.
     */
    static allQuestionsAnswered () {
        if (!settingsSection || !settingsSection.length) return true;
        settingsSection.forEach(function (question) {
            if (!InitialOptions.isAnswered(question)) {
                return false;
            }
        });
        return true;
    }

    /**
     * Gets next question that needs to be asked
     */
    static nextUnansweredQuestion () {
        if (!settingsSection || !settingsSection.length) return null;
        var nextUnansweredQuestion = settingsSection.find(function (question) {
            return !InitialOptions.isAnswered(question);
        });
        if (nextUnansweredQuestion) return nextUnansweredQuestion.key;
        return null;
    }

    /**
     * Returns the object of current values
     */
    static getCurrentVals () {
        return currentVals;
    }

    /**
     * Set an options value in both cookie, and local object.
     * @param {string} key indicates which options question this value is for
     * @param {string} value option chosen by user
     */
    static setValue (key, value) {
        currentVals[key] = value;
        Cookie.set(key, currentVals[key]);
        answeredThisSession[key] = true;
    }
}
