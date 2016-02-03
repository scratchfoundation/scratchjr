export default class Cookie {
    // Thanks to http://www.quirksmode.org/js/cookies.html
    static set (key, value) {
        var year = new Date();
        year.setTime(year.getTime() + (365 * 24 * 60 * 60 * 1000));
        var expires = '; expires=' + year.toGMTString();
        document.cookie = key + '=' + value + expires + '; path=/';
    }

    static get (key) {
        key += '=';
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(key) == 0) {
                return c.substring(key.length, c.length);
            }
        }
        return null;
    }
}
