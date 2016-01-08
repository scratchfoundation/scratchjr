///////////////////////////////
// Stage grid
//////////////////////////////

var Grid = function () {};

Grid.width = 482;
Grid.height = 362;
Grid.size = 24;

Grid.hidden = true;

Grid.init = function (div) {
    var w = div.offsetWidth;
    var h = div.offsetHeight;
    var grid = newDiv(div, 0, 0, Grid.width, Grid.height, {
        position: 'absolute',
        zIndex: ScratchJr.layerTop
    });
    Grid.setScaleAndPosition(grid, scaleMultiplier, 47, 75, Grid.width, Grid.height);
    grid.setAttribute('id', 'livegrid');
    Grid.drawLines(grid, Grid.width, Grid.height);
    Grid.createNumbering(w, h);
    Grid.createCursor();
    Grid.createYcursor();
    Grid.createXcursor();
};

Grid.setScaleAndPosition = function (grid, scale, x, y, w, h) {
    setProps(grid.style, {
        webkitTransform: 'translate(' + (-w / 2) + 'px, ' + (-h / 2) + 'px) ' +
            'scale(' + scale + ') ' +
            'translate(' + (w / 2 + x) + 'px, ' + (h / 2 + y) + 'px)'
    });
};

Grid.drawLines = function (grid, w, h) {
    var cnv = newCanvas(grid, 0, 0, w, h, {
        position: 'absolute'
    });
    cnv.style.opacity = 0.5;
    var ctx = cnv.getContext('2d');
    ctx.strokeStyle = '#B3B3B3';
    ctx.lineWidth = 1;
    var dx = Grid.size;
    // vertical
    for (var i = 0; i < 480 / Grid.size; i++) {
        ctx.moveTo(dx, 0);
        ctx.lineTo(dx, 360);
        ctx.stroke();
        dx += Grid.size;
    }
    var dy = Grid.size;
    // horizontal
    for (i = 0; i < 360 / Grid.size; i++) {
        ctx.moveTo(0, dy);
        ctx.lineTo(480, dy);
        ctx.stroke();
        dy += Grid.size;
    }
    if (isTablet) {
        cnv.ontouchstart = function (evt) {
            ScratchJr.stage.mouseDown(evt);
        };
    } else {
        cnv.onmousedown = function (evt) {
            ScratchJr.stage.mouseDown(evt);
        };
    }
};

Grid.createNumbering = function (w, h) {
    var row = newDiv(gn('stageframe'), 0, 0, w - 46 - 30, 24, {
        position: 'absolute',
        zIndex: ScratchJr.layerTop
    });
    row.setAttribute('id', 'rownum');
    Grid.setScaleAndPosition(row, scaleMultiplier, 46 - 24, 75 + Grid.height, w - 46 - 30, 24);
    var offset = Grid.size;
    var dx = offset;
    for (var i = 0; i < 480 / offset; i++) {
        var num = newDiv(row, dx, 0, Grid.size, Grid.size, {
            position: 'absolute',
            zIndex: 10
        });
        var p = newP(num, Localization.localize('GRID_NUMBER', {
            N: (i + 1)
        }), {});
        p.setAttribute('class', 'stylelabel');
        dx += offset;
    }
    var column = newDiv(gn('stageframe'), 0, 0, 24, h + 24, {
        position: 'absolute',
        zIndex: ScratchJr.layerTop
    });
    column.setAttribute('id', 'colnum');
    Grid.setScaleAndPosition(column, scaleMultiplier, 46 - 24, 74 + 1, 24, h + 24);
    var dy = 360 - offset;
    for (var j = 0; j < 360 / offset; j++) {
        var numj = newDiv(column, 0, dy, Grid.size, Grid.size, {
            position: 'absolute',
            zIndex: 10
        });
        var py = newP(numj, Localization.localize('GRID_NUMBER', {
            N: j + 1
        }), {});
        py.setAttribute('class', 'stylelabel');
        dy -= offset;
    }
};

Grid.createYcursor = function () {
    var num = newDiv(gn('colnum'), 0, 0, Grid.size, Grid.size, {
        position: 'absolute',
        zIndex: 20
    });
    num.setAttribute('class', 'circle');
    num.style.background = '#6a99c1';
    num.setAttribute('id', 'ycursor');
    var p = newP(num, 15, {});
    p.setAttribute('class', 'circlenum');
};

Grid.createXcursor = function () {
    var num = newDiv(gn('rownum'), Grid.size, 0, Grid.size, Grid.size, {
        position: 'absolute',
        zIndex: 20
    });
    num.setAttribute('class', 'circle');
    num.style.background = '#6a99c1';
    num.setAttribute('id', 'xcursor');
    var p = newP(num, 1, {});
    p.setAttribute('class', 'circlenum');
};

Grid.createCursor = function () {
    var gc = newDiv(gn('livegrid'), 0, 0, Grid.size + 2, Grid.size + 2, {
        position: 'absolute',
        zIndex: ScratchJr.layerAboveBottom
    });
    gc.setAttribute('id', 'circlenum');
    var cnv = newCanvas(gc, 0, 0, Grid.size + 2, Grid.size + 2, {
        position: 'absolute'
    });
    if (isTablet) {
        cnv.ontouchstart = function (evt) {
            Grid.mouseDownOnCursor(evt);
        };
    } else {
        cnv.onmousedown = function (evt) {
            Grid.mouseDownOnCursor(evt);
        };
    }
    var ctx = cnv.getContext('2d');
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#28A5DA';
    ctx.strokeStyle = '#656e73';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, Grid.size - 6, Grid.size - 6);
    ctx.fillRect(3, 3, Grid.size - 6, Grid.size - 6);
    if (isTablet) {
        gc.ontouchstart = Grid.mouseDownOnCursor;
    } else {
        gc.onmousedown = Grid.mouseDownOnCursor;
    }
};

Grid.mouseDownOnCursor = function (e) {
    e.preventDefault();
    e.stopPropagation();
    var pt = ScratchJr.stage.getStagePt(e);
    var spr = ScratchJr.getSprite();
    ScratchJr.stage.initialPoint = {
        x: pt.x,
        y: pt.y
    };
    Events.dragthumbnail = spr.div;
    Events.clearEvents();
    if (!ScratchJr.inFullscreen && spr) {
        Events.holdit(spr.div, ScratchJr.stage.startShaking);
    }
    ScratchJr.stage.setEvents();
};

Grid.updateCursor = function () {
    if (Grid.hidden) {
        return;
    }
    if (ScratchJr.inFullscreen) {
        return;
    }
    if (!ScratchJr.stage.currentPage) {
        return;
    }
    if (!ScratchJr.getSprite()) {
        gn('circlenum').style.visibility = 'hidden';
        gn('xcursor').style.visibility = 'hidden';
        gn('ycursor').style.visibility = 'hidden';
        return;
    }
    var spr = gn(ScratchJr.stage.currentPage.currentSpriteName);
    if (!spr) {
        return;
    }
    var obj = spr.owner;
    var c = gn('circlenum');
    if (!c) {
        return;
    }
    var dx = obj.xcoor + Grid.size / 2;
    var dy = obj.ycoor - Grid.size / 2;
    gn('xcursor').style.visibility = 'visible';
    gn('ycursor').style.visibility = 'visible';
    gn('circlenum').style.visibility = 'visible';
    Grid.setCursorsValues(dx, dy);
};

Grid.setCursorsValues = function (dx, dy) {
    var c = gn('circlenum');
    var numX = Math.round(dx / Grid.size);
    var numY = Math.round(dy / Grid.size);
    if (c.offsetLeft != (numX * 24)) {
        var xc = gn('xcursor');
        var xstate = ((numX < 1) || (numX > 20)) ? 'hidden' : 'visible';
        setProps(xc.style, {
            position: 'absolute',
            left: (numX * 24) + 'px',
            visibility: xstate
        });
        xc.childNodes[0].textContent = Localization.localize('GRID_NUMBER', {
            N: numX
        });
    }
    if (c.offsetTop != (numY * 24)) {
        var yc = gn('ycursor');
        var ystate = ((numY < 0) || (numY > 14)) ? 'hidden' : 'visible';
        setProps(yc.style, {
            position: 'absolute',
            top: (numY * 24) + 'px',
            visibility: ystate
        });
        yc.childNodes[0].textContent = Localization.localize('GRID_NUMBER', {
            N: 15 - numY
        });
    }
    setProps(c.style, {
        position: 'absolute',
        top: (numY * 24) + 'px',
        left: ((numX - 1) * 24) + 'px'
    });
};

Grid.hide = function (b) {
    Grid.hidden = b;
    var mystate = Grid.hidden ? 'hidden' : 'visible';
    gn('livegrid').style.visibility = mystate;
    gn('rownum').style.visibility = mystate;
    gn('colnum').style.visibility = mystate;
    if (ScratchJr.stage.currentPage) {
        mystate = !ScratchJr.getSprite() ? 'hidden' : mystate;
    }
    gn('circlenum').style.visibility = mystate;
    gn('xcursor').style.visibility = mystate;
    gn('ycursor').style.visibility = mystate;
};
