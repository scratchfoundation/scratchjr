export default class Vector {
    static sum (a, b) {
        var res = {};
        res.x = a.x + b.x;
        res.y = a.y + b.y;
        return res;
    }

    static diff (a, b) {
        var res = {};
        res.x = a.x - b.x;
        res.y = a.y - b.y;
        return res;
    }

    static equal (a, b) {
        return Vector.len(Vector.diff(a, b)) == 0;
    }

    static floor (a) {
        var res = {};
        res.x = Math.floor(a.x);
        res.y = Math.floor(a.y);
        return res;
    }

    static neg (a) {
        var res = {};
        res.x = -a.x;
        res.y = -a.y;
        return res;
    }

    static len (a) {
        return Math.sqrt(a.x * a.x + a.y * a.y);
    }

    static norm (a) {
        var len = Vector.len(a);
        var res = {};
        if (len == 0) {
            len = 0.001;
        }
        res.x = a.x / len;
        res.y = a.y / len;
        return res;
    }

    static perp (a) {
        var res = {};
        res.x = -a.y;
        res.y = a.x;
        return res;
    }

    static scale (a, s) {
        var res = {};
        res.x = a.x * s;
        res.y = a.y * s;
        return res;
    }

    static dot (a, b) {
        return a.x * b.x + a.y * b.y;
    }

    static mid (a, b) {
        var res = {};
        res.x = ((a.x + b.x) / 2);
        res.y = ((a.y + b.y) / 2);
        return res;
    }

    static lineIntersect (v1, v2, v3, v4) {
        var seg1 = Vector.diff(v2, v1);
        var seg2 = Vector.diff(v4, v3);
        var seg3 = Vector.diff(v1, v3);
        var denom = seg2.y * seg1.x - seg2.x * seg1.y;
        var numera = seg2.x * seg3.y - seg2.y * seg3.x;
        var numerb = seg1.x * seg3.y - seg1.y * seg3.x;
        if (denom == 0) {
            return null;
        }
        var mua = numera / denom;
        var mub = numerb / denom;
        /* Is the intersection along the  segments */
        if (mua < 0 || mua > 1 || mub < 0 || mub > 1) {
            return null;
        }
        var px = v1.x + mua * seg1.x;
        var py = v1.y + mua * seg1.y;
        return {
            x: px,
            y: py
        };
    }
}
