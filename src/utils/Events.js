/*
the caller should define the window event and call startDrag with the appropiate values
*/

Events = function () {};

Events.dragged = false;
Events.dragthumbnail = undefined;
Events.dragmousex = 0;
Events.dragmousey = 0;
Events.timeoutEvent = undefined;
Events.initialPt;
Events.dragcanvas = undefined;
Events.dragDiv = undefined;
Events.fcnstart = undefined;
Events.fcnend = undefined;
Events.updatefcn = undefined;
Events.fcnclick = undefined;
Events.mouseDownTime = 0;
Events.scaleStartsAt = 1;
Events.delta = 10;
Events.pinchcenter = {
    x: 0,
    y: 0,
    distance: 0
};
Events.lastZoomScale = 1;

// Instead of popping the dragging block, etc to the outer-most frame,
// which causes delays while the content is reflowed, we create a
// small drag div that is a parent of frame that the dragging block
// can be a child of. This improves dragging performance.
Events.init = function () {
    var dragDiv = document.createElement('div');
    dragDiv.id = 'dragDiv';
    dragDiv.style.position = 'absolute';
    dragDiv.style.width = '0px'; // size doesn't matter since children float
    dragDiv.style.height = '0px';
    dragDiv.style.zIndex = 7001; // slightly higher than ScratchJr.dragginLayer
    var frameDiv = gn('frame');
    frameDiv.appendChild(dragDiv);
    Events.dragDiv = dragDiv;
};
Events.startDrag = function (e, c, atstart, atend, atdrag, atclick, athold) {
    Events.dragged = false;
    var pt = Events.getTargetPoint(e);
    Events.dragmousex = pt.x;
    Events.dragmousey = pt.y;
    Events.initialPt = pt;
    Events.mouseDownTime = (new Date() - 0);
    Events.dragthumbnail = c;
    Events.fcnstart = atstart;
    Events.fcnend = atend;
    Events.fcnclick = atclick;

    if (athold) {
        Events.holdit(c, athold);
    }
    Events.updatefcn = atdrag;
    if (isTablet) { // startDrag event setting
        Events.delta = 10 * scaleMultiplier;
        window.ontouchmove = function (evt) {
            Events.mouseMove(evt);
        };
        window.ontouchend = function (evt) {
            Events.mouseUp(evt);
        };
        window.ontouchleave = function (evt) {
            Events.mouseUp(evt);
        };
        window.ontouchcancel = function (evt) {
            Events.mouseUp(evt);
        };
    } else {
        Events.delta = 7;
        window.onmousemove = function (evt) {
            Events.mouseMove(evt);
        };
        window.onmouseup = function (evt) {
            Events.mouseUp(evt);
        };
    }
};

Events.holdit = function (c, fcn) {
    var repeat = function () {
        Events.clearEvents();
        fcn(Events.dragthumbnail);
        Events.clearDragAndDrop();
    };
    Events.timeoutEvent = setTimeout(repeat, 500);
};

Events.clearDragAndDrop = function () {
    Events.timeoutEvent = undefined;
    Events.dragcanvas = undefined;
    Events.dragged = false;
    Events.dragthumbnail = undefined;
    Events.fcnstart = undefined;
    Events.fcnend = undefined;
    Events.updatefcn = undefined;
    Events.fcnclick = undefined;
};

Events.mouseMove = function (e) {
    // be forgiving about the click
    var pt = Events.getTargetPoint(e);
    if (!Events.dragged && (Events.distance(Events.dragmousex - pt.x, Events.dragmousey - pt.y) < Events.delta)) {
        return;
    }
    if (Events.timeoutEvent) {
        clearTimeout(Events.timeoutEvent);
    }
    Events.timeoutEvent = undefined;
    if (!Events.dragged) {
        Events.fcnstart(e);
    }
    Events.dragged = true;
    if (Events.updatefcn) {
        Events.updatefcn(e, Events.dragcanvas);
    }
    Events.dragmousex = pt.x;
    Events.dragmousey = pt.y;
};

Events.distance = function (dx, dy) {
    return Math.round(Math.sqrt((dx * dx) + (dy * dy)));
};

Events.mouseUp = function (e) {
    if (Events.timeoutEvent) {
        clearTimeout(Events.timeoutEvent);
    }
    Events.timeoutEvent = undefined;
    Events.clearEvents();
    if (!Events.dragged) {
        Events.itIsAClick(e);
    } else {
        Events.performMouseUpAction(e);
    }
    Events.clearDragAndDrop();
};

Events.cancelAll = function () {
    if (Events.timeoutEvent) {
        clearTimeout(Events.timeoutEvent);
    }
    Events.timeoutEvent = undefined;
    Events.clearEvents();
};

Events.clearEvents = function () {
    if (isTablet) { // clearEvents
        window.ontouchmove = undefined;
        window.ontouchend = undefined;
    } else {
        window.onmousemove = function (e) {
            e.preventDefault();
        };
        window.onmouseup = undefined;
    }
};

Events.performMouseUpAction = function (e) {
    if (Events.fcnend) {
        Events.fcnend(e, Events.dragcanvas);
    }
};

Events.itIsAClick = function (e) {
    if (Events.fcnclick) {
        Events.fcnclick(e, Events.dragthumbnail);
    }
};

Events.moveThumbnail = function (el, dx, dy) {
    if (!el) {
        return;
    }
    el.top += dy;
    el.left += dx;
    el.style.top = el.top + 'px';
    el.style.left = el.left + 'px';
};

Events.move3D = function (el, dx, dy) {
    if (!el) {
        return;
    }
    var mtx = new WebKitCSSMatrix(window.getComputedStyle(el).webkitTransform);
    el.top = dy + mtx.m42;
    el.left = dx + mtx.m41;
    el.style.webkitTransform = 'translate3d(' + el.left + 'px,' + el.top + 'px, 0)';
};


/*
.m41 – corresponds to the ‘x’ value of a WebKitCSSMatrix
.m42 – corresponds to the ‘y’ value of a WebKitCSSMatrix
*/

Events.getTargetPoint = function (e) {
    if (isTablet) {
        if (e.touches && (e.touches.length > 0)) {
            return {
                x: e.touches[0].pageX,
                y: e.touches[0].pageY
            };
        } else if (e.changedTouches) {
            return {
                x: e.changedTouches[0].pageX,
                y: e.changedTouches[0].pageY
            };
        }
    }
    return {
        x: e.clientX,
        y: e.clientY
    };
};

Events.updatePinchCenter = function (e) {
    if (e.touches.length != 2) {
        return;
    }
    var x1 = e.touches[0].clientX,
        y1 = e.touches[0].clientY;
    var x2 = e.touches[1].clientX,
        y2 = e.touches[1].clientY;
    var cx = x1 + (x2 - x1) / 2,
        cy = y1 + (y2 - y1) / 2;
    var d = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    Events.pinchcenter = {
        x: cx,
        y: cy,
        distance: d
    };
};

Events.zoomScale = function (e) {
    if (e.touches.length !== 2) {
        return Events.lastZoomScale;
    }
    var x1 = e.touches[0].clientX,
        y1 = e.touches[0].clientY;
    var x2 = e.touches[1].clientX,
        y2 = e.touches[1].clientY;
    var d = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    Events.lastZoomScale = d / Events.pinchcenter.distance;
    return Events.lastZoomScale;
};
