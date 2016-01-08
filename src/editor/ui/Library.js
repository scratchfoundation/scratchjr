var Library = function () {};

Library.selectedOne;
Library.currentProject;
Library.activeFocus;
Library.nativeJr = true;
Library.clickThumb;
Library.shaking;
Library.type;
Library.timeoutEvent;
Library.spacing = 64;
Library.fw = 220;
Library.pad;
Library.thumbnailw = 136;
Library.target = undefined;
Library.scrolltop = 0;
Library.frame;
Library.ready = false;

Library.init = function () {
    Library.frame = document.getElementById('libframe');
    Library.frame.style.minHeight = Math.max(getDocumentHeight(), frame.offsetHeight) + 'px';
    var topbar = newHTML('div', 'topbar', Library.frame);
    topbar.setAttribute('id', 'topbar');
    var actions = newHTML('div', 'actions', topbar);
    actions.setAttribute('id', 'libactions');
    var ascontainer = newHTML('div', 'assetname-container', topbar);
    var as = newHTML('div', 'assetname', ascontainer);
    var myname = newHTML('p', undefined, as);
    myname.setAttribute('id', 'assetname');
    myname.textContent = '';
    Library.layoutHeader();
};

Library.createScrollPanel = function () {
    var inner = newHTML('div', 'innerlibrary', Library.frame);
    inner.setAttribute('id', 'asssetsview');
    var div = newHTML('div', 'scrollarea', inner);
    div.setAttribute('id', 'scrollarea');
};

Library.open = function (type) {
    Library.ready = false;
    Library.type = type;
    gn('assetname').textContent = '';
    Library.nativeJr = true;
    Library.target = undefined;
    Library.pad = undefined;
    frame.style.display = 'none';
    Library.frame.className = 'libframe appear';
    Library.frame.focus();
    Library.selectedOne = undefined;
    gn('okbut').ontouchstart = (Library.type == 'costumes') ? Library.closeSpriteSelection : Library.closeBkgSelection;
    Library.clean();
    Library.createScrollPanel();
    Library.addThumbnails(type);
    window.ontouchstart = undefined;
    window.ontouchend = undefined;
    document.ontouchmove = undefined;
    window.onresize = undefined;

    gn('library_paintme').style.opacity = 1;
    gn('library_paintme').ontouchstart = Library.editResource;

    // Set the back button callback
    ScratchJr.onBackButtonCallback.push(function () {
        var e = document.createEvent('TouchEvent');
        e.initTouchEvent();
        Library.cancelPick(e);
    });
};

Library.clean = function () {
    if (gn('scrollarea')) {
        var div = gn('scrollarea').parentNode;
        Library.frame.removeChild(div);
    }
};

Library.close = function (e) {
    e.preventDefault();
    e.stopPropagation();
    ScratchAudio.sndFX('tap.wav');
    ScratchJr.blur();
    Library.frame.className = 'libframe disappear';
    document.body.scrollTop = 0;
    frame.style.display = 'block';
    ScratchJr.editorEvents();
    ScratchJr.onBackButtonCallback.pop();
};

Library.layoutHeader = function () {
    var buttons = newHTML('div', 'bkgbuttons', gn('libactions'));
    var paintme = newHTML('div', 'painticon', buttons);
    paintme.id = 'library_paintme';
    paintme.ontouchstart = Library.editResource;
    var okbut = newHTML('div', 'okicon', buttons);
    okbut.setAttribute('id', 'okbut');
    var cancelbut = newHTML('div', 'cancelicon', buttons);
    cancelbut.ontouchstart = Library.cancelPick;
};

Library.cancelPick = function (e) {
    ScratchJr.onHold = true;
    Library.close(e);
    setTimeout(function () {
        ScratchJr.onHold = false;
    }, 1000);
};

Library.addThumbnails = function () {
    var div = gn('scrollarea');
    Library.addEmptyThumb(div, (Library.type == 'costumes') ? (118 * scaleMultiplier) : (120 * scaleMultiplier),
        (Library.type == 'costumes') ? (90 * scaleMultiplier) : (90 * scaleMultiplier));
    var key = (Library.type == 'costumes') ? 'usershapes' : 'userbkgs';
    // Student' assets
    var json = {};
    json.cond = 'ext = ? AND version = ?';
    json.items = ((Library.type == 'costumes') ?
        ['md5', 'altmd5', 'name', 'scale', 'width', 'height'] : ['altmd5', 'md5', 'width', 'height']);
    json.values = ['svg', ScratchJr.version];
    json.order = 'ctime desc';
    IO.query(key, json, Library.displayAssets);
};

Library.skipUserAssets = function () {
    var div = gn('scrollarea');
    Library.addEmptyThumb(div, (Library.type == 'costumes') ? (118 * scaleMultiplier) : (120 * scaleMultiplier),
        (Library.type == 'costumes') ? (90 * scaleMultiplier) : (90 * scaleMultiplier));
    Library.addHR(div);
    Library.displayLibAssets((Library.type == 'costumes') ? MediaLib.sprites : MediaLib.backgrounds);
};

Library.getpadding = function (div) {
    var w = Math.min(getDocumentWidth(), Library.frame.offsetWidth);
    var dw = div.childNodes[1].offsetLeft - div.childNodes[0].offsetLeft;
    var qty = Math.floor(w / dw);
    Library.thumbnailw = dw + 10;
    var pad = Math.floor((w - (qty * dw)) / 2);
    if (pad < 10) {
        return Math.floor((w - ((qty - 1) * dw)) / 2);
    }
    return pad;
};

Library.displayAssets = function (str) {
    Library.nativeJr = true;
    var div = gn('scrollarea');
    var data = JSON.parse(str);
    if (data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            Library.addAssetThumbChoose(div, data[i], 120 * scaleMultiplier, 90 * scaleMultiplier,
                Library.selectAsset);
        }
    }
    Library.addHR(div);
    Library.nativeJr = false;
    data = (Library.type == 'costumes') ? MediaLib.sprites : MediaLib.backgrounds;
    Library.displayLibAssets(data);
};

Library.displayLibAssets = function (data) {
    var div = gn('scrollarea');
    if (data.length < 1) {
        return;
    }
    var order = data[0].order;
    var key = order ? order.split(',')[1] : '';
    for (var i = 0; i < data.length; i++) {
        order = data[i].order;
        var key2 = order ? order.split(',')[1] : '';
        if (key2 != key) {
            Library.addHR(div);
            key = key2;
        }
        if ('separator' in data[i]) {
            Library.addHR(div);
        } else {
            Library.addLocalThumbChoose(div, data[i], 120 * scaleMultiplier, 90 * scaleMultiplier, Library.selectAsset);
        }
    }
    Library.ready = true;
};

Library.addAssetThumbChoose = function (parent, aa, w, h, fcn) {
    var data = Library.parseAssetData(aa);
    var tb = document.createElement('div');
    parent.appendChild(tb);
    tb.byme = Library.nativeJr ? 1 : 0;
    var md5 = data.md5;
    tb.setAttribute('class', 'assetbox off');
    tb.setAttribute('id', md5);
    tb.scale = (!data.scale) ? 0.5 : data.scale;
    tb.fieldname = data.name;
    tb.w = Number(data.width);
    tb.h = Number(data.height);
    var scale = Math.min(w / tb.w, h / tb.h);
    var img = newHTML('img', undefined, tb);
    img.style.left = (9 * scaleMultiplier) + 'px';
    img.style.top = (7 * scaleMultiplier) + 'px';
    img.style.position = 'relative';
    img.style.height = (data.height * scale) + 'px';
    if (data.altmd5) {
        IO.getAsset(data.altmd5, drawMe);
    }
    function drawMe (dataurl) {
        img.src = dataurl;
    }
    tb.ontouchstart = function (evt) {
        fcn(evt, tb);
    };
    return tb;
};

Library.addLocalThumbChoose = function (parent, data, w, h, fcn) {
    var tb = newHTML('div', 'assetbox off', parent);
    var md5 = data.md5;
    tb.byme = Library.nativeJr ? 1 : 0;
    tb.setAttribute('id', md5);
    tb.scale = (!data.scale) ? 0.5 : data.scale;
    tb.fieldname = data.name;
    tb.w = Number(data.width);
    tb.h = Number(data.height);

    var img = newHTML('img', undefined, tb);
    var scale = Math.min(w / tb.w, h / tb.h);
    img.style.height = tb.h * scale + 'px';
    img.style.width = tb.w * scale + 'px';

    img.style.left = Math.floor(((w - (scale * tb.w)) / 2) + (9 * scaleMultiplier)) + 'px';
    img.style.top = Math.floor(((h - (scale * tb.h)) / 2) + (9 * scaleMultiplier)) + 'px';
    img.style.position = 'relative';

    // Cached downsized-thumbnails are in pnglibrary
    var pngPath = MediaLib.path.replace('svg', 'png');
    img.src = pngPath + IO.getFilename(md5) + '.png';

    tb.ontouchstart = function (evt) {
        fcn(evt, tb);
    };
    return tb;
};

Library.userAssetThumbnail = function (img, cnv, sizew, sizeh) {
    var scale = Math.min(sizew / img.width, sizeh / img.height);
    var currentCtx = cnv.getContext('2d');
    var iw = Math.floor(scale * img.width);
    var ih = Math.floor(scale * img.height);
    var ix = Math.floor((sizew - (scale * img.width)) / 2);
    var iy = Math.floor((sizeh - (scale * img.height)) / 2);
    currentCtx.drawImage(img, 0, 0, img.width, img.height, ix, iy, iw, ih);
};

Library.addEmptyThumb = function (parent, w, h) {
    var tb = document.createElement('div');
    tb.setAttribute('class', 'assetbox off');
    tb.setAttribute('id', 'none');
    tb.fieldname = ((Library.type == 'costumes') ?
        Localization.localize('LIBRARY_CHARACTER') : Localization.localize('LIBRARY_BACKGROUND'));
    tb.byme = 1;
    var cnv = newCanvas(tb, 9 * scaleMultiplier, 7 * scaleMultiplier, w, h, {
        position: 'relative'
    });
    var ctx = cnv.getContext('2d');
    ctx.fillStyle = ScratchJr.stagecolor;
    ctx.fillRect(0, 0, w, h);
    parent.appendChild(tb);
    tb.ontouchstart = function (evt) {
        Library.selectAsset(evt, tb);
    };
};

Library.addHR = function (div) {
    var hr = document.createElement('hr');
    div.appendChild(hr);
    hr.setAttribute('class', 'bigdivide');
};

///////////////////////////
//selection


Library.selectAsset = function (e, tb) {
    tb.pt = JSON.stringify(Events.getTargetPoint(e));
    if (Library.shaking && (e.target.className == 'deleteasset')) {
        Library.removeFromAssetList();
        return;
    } else if (Library.shaking) {
        Library.stopShaking();
    }
    if (tb.byme && (tb.id != 'none')) {
        holdit(tb);
    }
    tb.ontouchend = function (evt) {
        clickMe(evt, tb);
    };
    window.onmouseup = function (evt) {
        clickMe(evt, tb);
    };
    window.onmousemove = function (evt) {
        clearEvents(evt, tb);
    };
    function holdit () {
        var repeat = function () {
            tb.ontouchend = undefined;
            window.onmouseup = undefined;
            window.onmousemove = undefined;
            Library.timeoutEvent = undefined;
            Library.stopShaking();
            Library.shaking = tb;
            Library.clearAllSelections();
            Library.startShaking(tb);
        };
        Library.timeoutEvent = setTimeout(repeat, 500);
    }
    function clearEvents (e, tb) {
        var pt = Events.getTargetPoint(e);
        var pt2 = JSON.parse(tb.pt);
        if (Library.distance(pt, pt2) < 30) {
            return;
        }
        e.preventDefault();
        if (Library.timeoutEvent) {
            clearTimeout(Library.timeoutEvent);
        }
        if (Library.clickThumb) {
            Library.unSelect(Library.clickThumb);
        }
        Library.timeoutEvent = undefined;
        tb.ontouchend = undefined;
        window.onmouseup = function () {
            window.onmousemove = undefined;
            window.onmouseup = undefined;
        };
    }
    function clickMe (e, tb) {
        if (Library.timeoutEvent) {
            clearTimeout(Library.timeoutEvent);
        }
        Library.selectThisAsset(e, tb);
        Library.timeoutEvent = undefined;
        tb.ontouchend = undefined;
        tb.onmouseup = undefined;
        window.onmousemove = undefined;
        window.onmouseup = undefined;
    }
};

Library.startShaking = function (b) {
    b.className = b.className + ' shakeme';
    newHTML('div', 'deleteasset', b);
    Library.shaking = b;
};

Library.stopShaking = function () {
    if (!Library.shaking) {
        return;
    }
    var b = Library.shaking;
    b.setAttribute('class', 'assetbox off');
    var ic = b.childNodes[b.childElementCount - 1];
    if (ic.getAttribute('class') == 'deleteasset') {
        b.removeChild(ic);
    }
    Library.shaking = undefined;
};

Library.removeFromAssetList = function () {
    ScratchAudio.sndFX('cut.wav');
    var b = Library.shaking;
    b.parentNode.removeChild(b);
    var key = (Library.type == 'costumes') ? 'usershapes' : 'userbkgs';
    var json = {};
    json.cond = 'md5 = ?';
    json.items = ['*'];
    json.values = [b.id];
    IO.query(key, json, Library.removeAssetFromLib);
    Library.clickThumb = undefined;
    Library.selectedOne = undefined;
    return true;
};

// Determine if an asset thumbnail is unique
// md5: thumbnail md5 to determine uniqueness
// type: "costumes" or "backgrounds"
// callback: called with true if unique, false if duplicate exists
Library.assetThumbnailUnique = function (md5, type, callback) {
    var key = (type == 'costumes') ? 'usershapes' : 'userbkgs';
    var json = {};
    json.cond = 'ext = ? AND altmd5 = ?';
    json.items = ['md5', 'altmd5'];
    json.values = ['svg', md5];
    json.order = 'ctime desc';
    IO.query(key, json, function (results) {
        results = JSON.parse(results);
        callback(results.length <= 1);
    });
};

Library.removeAssetFromLib = function (str) {
    var key = (Library.type == 'costumes') ? 'usershapes' : 'userbkgs';
    var aa = JSON.parse(str)[0];
    var data = Library.parseAssetData(aa);

    if (data.altmd5) {
        // Removes the thumbnail for the asset.
        // First ensure that there aren't other characters/bgs using the same thumb
        // (this is possible if we receive a duplicate project, for example)
        Library.assetThumbnailUnique(data.altmd5, Library.type, function (isUnique) {
            if (isUnique) {
                iOS.remove(data.altmd5, iOS.trace);
            }
        });
    }

    IO.deleteobject(key, data.id, iOS.trace);
};

Library.parseAssetData = function (data) {
    var res = new Object();
    for (var key in data) {
        res[key.toLowerCase()] = data[key];
    }
    return res;
};

Library.selectThisAsset = function (e, tb) {
    if (tb.id == Library.selectedOne) {
        if (Library.type == 'costumes') {
            Library.closeSpriteSelection(e);
        } else {
            Library.closeBkgSelection(e);
        }
    } else {
        Library.clearAllSelections();

        // Disable paint editor for PNG sprites
        var thumbID = tb.id;
        var thumbType = thumbID.substr(thumbID.length - 3);
        if (thumbType == 'png') {
            gn('library_paintme').style.opacity = 0;
            gn('library_paintme').ontouchstart = null;
        } else {
            gn('library_paintme').style.opacity = 1;
            gn('library_paintme').ontouchstart = Library.editResource;
        }

        tb.className = 'assetbox on';
        Library.selectedOne = tb.id;
        Library.clickThumb = tb;
        if (tb.fieldname) {
            gn('assetname').textContent = tb.fieldname;
        }
    }
};

Library.clearAllSelections = function () {
    var div = gn('scrollarea');
    for (var i = 0; i < div.childElementCount; i++) {
        if (div.childNodes[i].nodeName == 'DIV') {
            div.childNodes[i].className = 'assetbox off';
        }
    }
};

Library.unSelect = function (tb) {
    gn('assetname').textContent = '';
    tb.className = 'assetbox off';
    Library.selectedOne = undefined;
    if (Library.clickThumb) {
        if (tb.byme && (Library.clickThumb.childElementCount > 1)) {
            Library.clickThumb.childNodes[Library.clickThumb.childElementCount - 1].style.visibility = 'hidden';
        }
        Library.clickThumb = undefined;
    }
};

Library.resizeScroll = function () {
    var w = Math.min(getDocumentWidth(), frame.offsetWidth);
    var h = Math.max(getDocumentHeight(), frame.offsetHeight);
    var dx = w - 20 * scaleMultiplier;
    setProps(gn('scrollarea').style, {
        width: dx + 'px',
        height: (h - 120 * scaleMultiplier) + 'px'
    });
};

///////////////////////////////////////////
// Object actions
//////////////////////////////////////////

Library.editResource = function (e) {
    Library.close(e);
    if (Library.type != 'costumes') {
        Library.editBackground(e);
    } else {
        Library.editCostume(e);
    }
};

Library.editBackground = function () {
    var md5 = Library.selectedOne && (Library.selectedOne != 'none') ? Library.selectedOne : undefined;
    Paint.open(true, md5);
};

Library.editCostume = function () {
    var sname = undefined;
    var cname = Library.selectedOne ? Library.clickThumb.fieldname : Localization.localize('LIBRARY_CHARACTER');
    var scale = Library.selectedOne && (Library.selectedOne != 'none') ? Library.clickThumb.scale : 0.5;
    var md5 = Library.selectedOne && (Library.selectedOne != 'none') ? Library.selectedOne : undefined;
    var w = Library.selectedOne && (Library.selectedOne != 'none') ? Math.round(Library.clickThumb.w) : undefined;
    var h = Library.selectedOne && (Library.selectedOne != 'none') ? Math.round(Library.clickThumb.h) : undefined;
    Paint.open(false, md5, sname, cname, scale, w, h);
};

Library.closeSpriteSelection = function (e) {
    e.preventDefault();
    e.stopPropagation();
    var id = Library.selectedOne ? Library.clickThumb.fieldname : Localization.localize('LIBRARY_CHARACTER');
    if (Library.selectedOne && (Library.selectedOne != 'none')) {
        ScratchJr.stage.currentPage.addSprite(Library.clickThumb.scale, Library.selectedOne, id);
    }

    // Prevent reporting user asset names
    if (Library.clickThumb) {
        var analyticsName = Library.clickThumb.fieldname;
        if (!(Library.selectedOne in MediaLib.keys)) {
            analyticsName = 'user_asset';
        }
        iOS.analyticsEvent('editor', 'new_character', analyticsName);
    }
    Library.close(e);
};

Library.closeBkgSelection = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (Library.selectedOne) {
        ScratchJr.stage.currentPage.setBackground(Library.selectedOne, ScratchJr.stage.currentPage.updateBkg);
    }
    Library.close(e);
};

/////////////////////////////////////////
//Key Handeling Top Level prevention
/////////////////////////////////////////

Library.distance = function (pt1, pt2) {
    var dx = pt1.x - pt2.x;
    var dy = pt1.y - pt2.y;
    return Math.round(Math.sqrt((dx * dx) + (dy * dy)));
};
