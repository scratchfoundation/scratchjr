export default class Rectangle {
    constructor (x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }

    hitRect (pt) {
        var x = pt.x;
        var y = pt.y;
        if (x < this.x) {
            return false;
        }
        if (x > this.x + this.width) {
            return false;
        }
        if (y < this.y) {
            return false;
        }
        if (y > this.y + this.height) {
            return false;
        }
        return true;
    }

    intersects (r) {
        var x0 = Math.max(this.x, r.x);
        var x1 = Math.min(this.x + this.width, r.x + r.width);
        if (x0 <= x1) {
            var y0 = Math.max(this.y, r.y);
            var y1 = Math.min(this.y + this.height, r.y + r.height);
            if (y0 <= y1) {
                return true;
            }
        }
        return false;
    }

    overlapElemBy (box2, percent) {
        return this.overlapElem(box2) >= percent;
    }

    overlapElem (box2) {
        var boxi = this.intersection(box2);
        if (boxi.isEmpty()) {
            return 0;
        }
        if (boxi.isEqual(box2)) {
            return 1;
        }
        if (boxi.isEqual(this)) {
            return 1;
        }
        return (boxi.width * boxi.height) / (box2.width * box2.height);
    }

    intersection (box2) {
        var dx = Math.max(this.x, box2.x);
        var dw = Math.min(this.x + this.width, box2.x + box2.width);
        if (dx <= dw) {
            var dy = Math.max(this.y, box2.y);
            var dh = Math.min(this.y + this.height, box2.y + box2.height);
            if (dy > dh) {
                return new Rectangle(0, 0, 0, 0);
            }
            return new Rectangle(dx, dy, dw - dx, dh - dy);
        }
        return new Rectangle(0, 0, 0, 0);
    }

    union (box2) {
        var box = new Rectangle(0, 0, 0, 0);
        box.x = (this.x < box2.x) ? this.x : box2.x;
        box.y = (this.y < box2.y) ? this.y : box2.y;
        this.extentsw = (this.x == 9999999) ? 0 : this.x + this.width;
        this.extentsh = (this.y == 9999999) ? 0 : this.y + this.height;
        box2.extentsw = (box2.x == 9999999) ? 0 : box2.x + box2.width;
        box2.extentsh = (box2.y == 9999999) ? 0 : box2.y + box2.height;
        box.width = (this.extentsw > box2.extentsw) ? this.extentsw : box2.extentsw;
        box.height = (this.extentsh > box2.extentsh) ? this.extentsh : box2.extentsh;
        box.width -= box.x;
        box.height -= box.y;
        if (box.isEmpty()) {
            box = {
                x: 9999999,
                y: 9999999,
                width: 0,
                height: 0
            };
        }
        return box;
    }

    expandBy (sw) {
        this.x -= sw / 2;
        this.y -= sw / 2;
        this.width += sw;
        this.height += sw;
        return this;
    }

    crop (box) {
        if (this.x < box.x) {
            this.x = box.x;
        }
        if (this.y < box.y) {
            this.y = box.y;
        }
        if ((this.width + this.x) > (box.width + box.x)) {
            this.width += ((box.width + box.x) - (this.width + this.x));
        }
        if ((this.height + this.y) > (box.height + box.y)) {
            this.height += ((box.height + box.y) - (this.height + this.y));
        }
    }

    getArea () {
        return this.width * this.height;
    }

    rounded () {
        return new Rectangle(
            Math.floor(this.x),
            Math.floor(this.y),
            Math.round(this.width) + 1,
            Math.round(this.height) + 1
        );
    }

    isEqual (box2) {
        return (this.x == box2.x) && (this.y == box2.y) &&
            (this.width == box2.width) && (this.height == box2.height);
    }

    isEmpty () {
        return (this.x == 0) && (this.y == 0) && (this.width == 0) && (this.height == 0);
    }

    scale (sx, sy) {
        this.x *= sx;
        this.y *= sy;
        this.width *= sx;
        this.height *= sy;
    }
}
