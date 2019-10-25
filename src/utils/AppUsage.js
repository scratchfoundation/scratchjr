import Cookie from './Cookie';

let currentUsage;

export default class AppUsage {
    static get currentUsage () {
        return currentUsage;
    }

    /**
     * Initialize currentUsage for attaching to Analytics events from
     * the usage cookie if it is set. currentUsage is blank if the cookie is
     * not set.
     */
    static initUsage () {
        const usageCookie = Cookie.get('usage');
        currentUsage =  (usageCookie) ? usageCookie : '';
    }

    /**
     * Check whether the App should ask for the usage data (first time launched)
     * @return {boolean} True if the usage cookie has never been set
     */
    static askForUsage () {
        var usageCookie = Cookie.get('usage');
        return usageCookie === null;
    }

    /**
     * Set the usage cookie for tracking Analytics Events
     * @param {string} kind answer from user to the usage survey (home, school, other, noanswer)
     */
    static setUsage (kind) {
        currentUsage = (kind === '') ? 'noanswer' : kind;
        Cookie.set('usage', currentUsage);
    }
}
