import Cookie from './Cookie';

let currentUsage;

export default class AppUsage {
    static get currentUsage () {
        return currentUsage;
    }
    
    static initUsage () {
        var usageCookie = Cookie.get('usage');
        if (usageCookie === null || usageCookie === 'noanswer') {
            currentUsage =   '';
        } else {
            currentUsage = '_' + usageCookie;
        }

    }
    
    static askForUsage () {
        var usageCookie = Cookie.get('usage');
        return usageCookie === null;
    }
    
    static setUsage (kind) {
        if (kind === '') {
            Cookie.set('usage', 'noanswer');
        } else {
            Cookie.set('usage', kind);
        }
        currentUsage = kind === 'noanswer' ? '' : '_' + kind;
    }
}
