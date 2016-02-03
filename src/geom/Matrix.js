////////////////////////////////////////
// Basic Matrix
////////////////////////////////////////

export default class Matrix {
    constructor () {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
    }

    identity () {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
    }

    setMatrix (mtx) { // webKitMtrx
        this.a = mtx.a;
        this.b = mtx.b;
        this.c = mtx.c;
        this.d = mtx.d;
        this.e = mtx.e;
        this.f = mtx.f;
    }

    isIdentity () {
        return (this.a == 1 && this.b == 0 && this.c == 0 && this.d == 1 && this.e == 0 && this.f == 0);
    }

    rotate (angle) {
        var cos = Math.cos(angle * Math.PI / 180);
        var sin = Math.sin(angle * Math.PI / 180);
        this.a = cos;
        this.b = sin;
        this.c = -sin;
        this.d = cos;
    }

    scale (scalex, scaley) {
        this.a = scalex;
        this.d = scaley ? scaley : scalex;
    }


    translate (dx, dy) {
        this.e = dx;
        this.f = dy;
    }

    transformPoint (pt) {
        return {
            x: this.a * pt.x + this.c * pt.y + this.e,
            y: this.b * pt.x + this.d * pt.y + this.f
        };
    }

    multiply (m2) {
        var zero = 1e-14;
        var m = new Matrix();
        m.a = this.a * m2.a + this.c * m2.b;
        m.b = this.b * m2.a + this.d * m2.b,
        m.c = this.a * m2.c + this.c * m2.d,
        m.d = this.b * m2.c + this.d * m2.d,
        m.e = this.a * m2.e + this.c * m2.f + this.e,
        m.f = this.b * m2.e + this.d * m2.f + this.f;
        if (Math.abs(m.a) < zero) {
            m.a = 0;
        }
        if (Math.abs(m.b) < zero) {
            m.b = 0;
        }
        if (Math.abs(m.c) < zero) {
            m.c = 0;
        }
        if (Math.abs(m.d) < zero) {
            m.d = 0;
        }
        if (Math.abs(m.e) < zero) {
            m.e = 0;
        }
        if (Math.abs(m.f) < zero) {
            m.f = 0;
        }
        return m;
    }
}
