///////////////////////////
// Loading and saving
//////////////////////////

Paint.initBkg = function (ow, oh) {
    Paint.nativeJr = true;
    Paint.workspaceWidth = ow;
    Paint.workspaceHeight = oh;
    Paint.setUpCanvasArea();
    var dh = Paint.root.parentNode.parentNode.offsetHeight / (Paint.workspaceHeight + 10);
    var dw = Paint.root.parentNode.parentNode.offsetWidth / (Paint.workspaceWidth + 10);
    Paint.setZoomTo(Math.min(dw, dh));
    document.forms.spriteform.style.visibility = 'hidden';
    if (Paint.currentMd5) {
        Paint.loadBackground(Paint.currentMd5);
    } else {
        var attr = {
            'id': 'staticbkg',
            'opacity': 1,
            'fixed': 'yes',
            fill: ScratchJr.stagecolor
        };
        var cmds = [['M', 0, 0], ['L', 480, 0], ['L', 480, 360], ['L', 0, 360], ['L', 0, 0]];
        attr.d = SVG2Canvas.arrayToString(cmds);
        SVGTools.addChild(gn('layer1'), 'path', attr);
        Ghost.drawOffscreen();
        PaintUndo.record(true);
    }
};

Paint.loadBackground = function (md5) {
    if (md5.indexOf('samples/') >= 0) {
        // Load sample asset
        Paint.loadChar(md5);
    } else if (!MediaLib.keys[md5]) {
        // Load user asset
        iOS.getmedia(md5, nextStep);
    } else {
        // Load library asset
        Paint.getBkg(MediaLib.path + md5);
    }
    function nextStep (base64) {
        var str = atob(base64);
        IO.getImagesInSVG(str, function () {
            Paint.loadBkg(str);
        });
    }
};

Paint.getBkg = function (url) {
    var xmlrequest = new XMLHttpRequest();
    xmlrequest.onreadystatechange = function () {
        if (xmlrequest.readyState == 4) {
            Paint.createBkgFromXML(xmlrequest.responseText);
        }
    };
    xmlrequest.open('GET', url, true);
    xmlrequest.send(null);
};

Paint.loadBkg = function (str) {
    Paint.createBkgFromXML(str);
};

Paint.createBkgFromXML = function (str) {
    Paint.nativeJr = str.indexOf('Scratch Jr') > -1;
    str = str.replace(/>\s*</g, '><');
    var xmlDoc = new DOMParser().parseFromString(str, 'text/xml');
    var extxml = document.importNode(xmlDoc.documentElement, true);
    var flat = Paint.skipUnwantedElements(extxml, []);
    for (var i = 0; i < flat.length; i++) {
        gn('layer1').appendChild(flat[i]);
        if (flat[i].getAttribute('id') == 'fixed') {
            flat[i].setAttribute('fixed', 'yes');
        }
        flat[i].setAttribute('file', 'yes');
    }
    Paint.doAbsolute(gn('layer1'));
    if (!Paint.nativeJr) {
        Paint.reassingIds(gn('layer1'));
    } // make sure there are unique mask names
    //	gn("layer1").childNodes[0].setAttribute('id', "staticbkg");
    var dh = Paint.root.parentNode.parentNode.offsetHeight / (Paint.workspaceHeight + 10);
    var dw = Paint.root.parentNode.parentNode.offsetWidth / (Paint.workspaceWidth + 10);
    Paint.setZoomTo(Math.min(dw, dh));
    PaintUndo.record(true);
    if (!Paint.nativeJr) {
        Paint.selectButton('paintbucket');
    }
};

Paint.initSprite = function (ow, oh) {
    Paint.nativeJr = true;
    document.forms.spriteform.style.visibility = 'visible';
    document.forms.spriteform.name.value = gn(Paint.currentName) ? gn(Paint.currentName).owner.name : Paint.currentName;
    if (ow) {
        Paint.workspaceWidth = ow;
    }
    if (oh) {
        Paint.workspaceHeight = oh;
    }
    if (Paint.currentMd5) {
        Paint.loadCharacter(Paint.currentMd5);
    } else {
        Paint.setUpCanvasArea();
        setCanvasSize(
            Ghost.maskCanvas,
            Math.round(Number(Paint.root.getAttribute('width')) * Paint.currentZoom),
            Math.round(Number(Paint.root.getAttribute('height')) * Paint.currentZoom)
        );
        var dh = Paint.root.parentNode.parentNode.offsetHeight / (Paint.workspaceHeight + 10);
        var dw = Paint.root.parentNode.parentNode.offsetWidth / (Paint.workspaceWidth + 10);
        Paint.setZoomTo(Math.min(dw, dh));
        PaintUndo.record(true);
    }
};

Paint.loadCharacter = function (md5) {
    if (md5.indexOf('samples/') >= 0) {
        // Load sample asset
        Paint.loadChar(md5);
    } else if (!MediaLib.keys[md5]) {
        // Load user asset
        iOS.getmedia(md5, nextStep);
    } else {
        // Load library asset
        Paint.loadChar(MediaLib.path + md5);
    }
    function nextStep (base64) {
        var str = atob(base64);
        IO.getImagesInSVG(str, function () {
            Paint.loadSprite(str);
        });
    }
};

Paint.loadSprite = function (svg) {
    Paint.createCharFromXML(svg, Paint.currentName);
};

Paint.loadChar = function (url) {
    var xmlrequest = new XMLHttpRequest();
    xmlrequest.onreadystatechange = function () {
        if (xmlrequest.readyState == 4) {
            Paint.createCharFromXML(xmlrequest.responseText, Paint.currentName);
        }
    };
    xmlrequest.open('GET', url, true);
    xmlrequest.send(null);
};

Paint.adjustShapePosition = function (dx, dy) {
    xform.setTranslate(dx, dy);
    Transform.translateTo(gn('layer1'), xform);
};

///////////////////////////////////
// Saving
/////////////////////////////////

Paint.savePageImage = function (fcn) {
    var worthsaving = (gn('layer1').childElementCount > 0);
    if (!worthsaving) {
        Paint.close();
    } else {
        Paint.saving = true;
        if (fcn) {
            Alert.open(Paint.frame, gn('donecheck'), Localization.localize('ALERT_SAVING'), '#28A5DA');
            Alert.balloon.style.zIndex = 12000;
        }
        Paint.svgdata = SVGTools.saveBackground(gn('layer1'), Paint.workspaceWidth, Paint.workspaceHeight);
        IO.setMedia(Paint.svgdata, 'svg', function (str) {
            Paint.changeBackground(str, fcn);
        });
    }
};

Paint.changeBackground = function (md5, fcn) {
    Paint.saveMD5 = md5;
    var type = 'userbkgs';
    var mobj = {};
    mobj.cond = 'md5 = ? AND version = ?';
    mobj.items = ['*'];
    mobj.values = [Paint.saveMD5, ScratchJr.version];
    IO.query(type, mobj, function (str) {
        Paint.checkDuplicateBkg(str, fcn);
    });
};

Paint.checkDuplicateBkg = function (str, fcn) {
    var list = JSON.parse(str);
    if (list.length > 0) {
        if (fcn) {
            fcn('duplicate');
        }
    } else {
        Paint.addToBkgLib(fcn);
    }
};

/////////////////////////////////////
// userbkgs:  stores backgrounds
/////////////////////////////////////
/*
    [version] =>
    [md5] =>
    [altmd5] =>  //for PNG option
    [ext] => png / svg
   	[width] =>
   	[height] =>
*/

Paint.addToBkgLib = function (fcn) {
    var dataurl = IO.getThumbnail(Paint.svgdata, 480, 360, 120, 90);
    var pngBase64 = dataurl.split(',')[1];
    iOS.setmedia(pngBase64, 'png', setBkgRecord);
    function setBkgRecord (pngmd5) {
        var json = {};
        var keylist = ['md5', 'altmd5', 'version', 'width', 'height', 'ext'];
        var values = '?,?,?,?,?,?';
        json.values = [Paint.saveMD5, pngmd5, ScratchJr.version, '480', '360', 'svg'];
        json.stmt = 'insert into userbkgs (' + keylist.toString() + ') values (' + values + ')';
        iOS.stmt(json, fcn);
    }
};

Paint.changePage = function () {
    ScratchJr.stage.currentPage.setBackground(Paint.saveMD5, ScratchJr.stage.currentPage.updateBkg);
    Paint.close();
};

Paint.saveSprite = function (fcn) {
    var cname = document.forms.spriteform.name.value;
    var worthsaving = (gn('layer1').childElementCount > 0) && (PaintUndo.index > 0);
    if (worthsaving) {
        Paint.saving = true;
        if (fcn) {
            Alert.open(Paint.frame, gn('donecheck'), 'Saving...', '#28A5DA');
            Alert.balloon.style.zIndex = 12000;
        }
        Paint.svgdata = SVGTools.saveShape(gn('layer1'), Paint.workspaceWidth, Paint.workspaceHeight);
        IO.setMedia(Paint.svgdata, 'svg', function (str) {
            Paint.addOrModifySprite(str, fcn);
        });
    } else {
        var type = Paint.getLoadType(Paint.spriteId, cname);
        if ((cname != Paint.currentName) && (type == 'modify')) {
            ScratchJr.stage.currentPage.modifySpriteName(cname, Paint.spriteId);
        } else if (Paint.currentMd5 && (type == 'add')) {
            ScratchJr.stage.currentPage.addSprite(Paint.costumeScale, Paint.currentMd5, cname);
        }
        Paint.close();
    }
};

Paint.addOrModifySprite = function (str, fcn) {
    Paint.saveMD5 = str;
    var mobj = {};
    mobj.cond = 'md5 = ? AND version = ?';
    mobj.items = ['*'];
    mobj.values = [Paint.saveMD5, ScratchJr.version];
    IO.query('usershapes', mobj, function (str) {
        Paint.checkDuplicate(str, fcn);
    });
};

Paint.checkDuplicate = function (str, fcn) {
    var list = JSON.parse(str);
    if (list.length > 0) {
        if (fcn) {
            fcn('duplicate');
        }
    } else {
        Paint.addToLib(fcn);
    }
};

/////////////////////////////////////
// usershapes:  stores costumes
/////////////////////////////////////
/* current data
    [md5] =>
    [altmd5] =>  // for PNG  -- not used
    [version] =>
		[scale] =>
    [ext] => png / svg
   	[width] =>
   	[height] =>
    [name] =>

*/

Paint.addToLib = function (fcn) {
    var scale = '0.5'; // always saves with 1/2 the size
    var cname = document.forms.spriteform.name.value;
    cname = ((unescape(cname)).replace(/[0-9]/g, '')).replace(/\s*/g, '');
    var box = SVGTools.getBox(gn('layer1')).rounded();
    box = box.expandBy(20);
    var w = box.width.toString();
    var h = box.height.toString();
    var dataurl = IO.getThumbnail(Paint.svgdata, w, h, 120, 90);
    var pngBase64 = dataurl.split(',')[1];
    iOS.setmedia(pngBase64, 'png', setCostumeRecord);
    function setCostumeRecord (pngmd5) {
        var json = {};
        var keylist = ['scale', 'md5', 'altmd5', 'version', 'width', 'height', 'ext', 'name'];
        var values = '?,?,?,?,?,?,?,?';
        json.values = [scale, Paint.saveMD5, pngmd5, ScratchJr.version, w, h, 'svg', cname];
        json.stmt = 'insert into usershapes (' + keylist.toString() + ') values (' + values + ')';
        iOS.stmt(json, fcn);
    }
};

Paint.changePageSprite = function () {
    Paint.close();
    var cname = document.forms.spriteform.name.value;
    var type = Paint.getLoadType(Paint.spriteId, cname);
    switch (type) {
    case 'modify':
        ScratchJr.stage.currentPage.modifySprite(Paint.saveMD5, cname, Paint.spriteId);
        break;
    case 'add':
        ScratchJr.stage.currentPage.addSprite(Paint.costumeScale, Paint.saveMD5, cname);
        break;
    default:
        ScratchJr.stage.currentPage.update();
        break;
    }
};

Paint.getLoadType = function (sid, cid) {
    if (!cid) {
        return 'none';
    }
    if (sid && cid) {
        return 'modify';
    }
    return 'add';
};

///////////////////////////
// XML import processs
///////////////////////////

Paint.skipUnwantedElements = function (p, res) {
    for (var i = 0; i < p.childNodes.length; i++) {
        var elem = p.childNodes[i];
        if (elem.nodeName == 'metadata') {
            continue;
        }
        if (elem.nodeName == 'defs') {
            continue;
        }
        if (elem.nodeName == 'sodipodi:namedview') {
            continue;
        }
        if (elem.nodeName == '#comment') {
            continue;
        }
        if ((elem.nodeName == 'g') && (elem.id == 'layer1')) {
            Paint.skipUnwantedElements(elem, res);
            if (elem.removeAttribute('id')) {
                elem.removeAttribute('id');
            }
        } else {
            res.push(elem);
        }
    }
    return res;
};

Paint.reassingIds = function (p) {
    for (var i = 0; i < p.childNodes.length; i++) {
        var elem = p.childNodes[i];
        if (elem.parentNode.getAttribute('fixed') == 'yes') {
            elem.setAttribute('fixed', 'yes');
        }
        var id = elem.getAttribute('id');
        if (!id) {
            elem.setAttribute('id', getIdFor(elem.nodeName));
        }
        if (elem.nodeName == 'g') {
            Paint.reassingIds(elem);
        }
    }
};

Paint.createCharFromXML = function (str) {
    Paint.nativeJr = str.indexOf('Scratch Jr') > -1;
    var dx = (Paint.workspaceWidth < 432) ? Math.floor((432 - Paint.workspaceWidth) / 2) : 0;
    var dy = (Paint.workspaceHeight < 384) ? Math.floor((384 - Paint.workspaceHeight) / 2) : 0;
    if (Paint.workspaceWidth < 432) {
        Paint.workspaceWidth = 432;
    }
    if (Paint.workspaceHeight < 384) {
        Paint.workspaceHeight = 384;
    }
    Paint.setUpCanvasArea();
    str = str.replace(/>\s*</g, '><');
    var xmlDoc = new DOMParser().parseFromString(str, 'text/xml');
    var extxml = document.importNode(xmlDoc.documentElement, true);
    var flat = Paint.skipUnwantedElements(extxml, []);
    for (var i = 0; i < flat.length; i++) {
        gn('layer1').appendChild(flat[i]);
    }
    Paint.doAbsolute(gn('layer1'));
    Paint.adjustShapePosition(dx, dy);
    if (!Paint.nativeJr) {
        Paint.reassingIds(gn('layer1'));
    } // make sure there are unique mask names
    Paint.scaleToFit();
    Paint.minZoom = Paint.currentZoom < 1 ? Paint.currentZoom / 2 : 1;
    var maxpix = 2290 * 2289; // Magic iOS max canvas size
    var ratio = maxpix / (Paint.workspaceWidth * Paint.workspaceHeight);
    var zoom = Math.floor(Math.sqrt(ratio));
    if (zoom < Paint.maxZoom) {
        Paint.maxZoom = zoom;
    }
    PaintUndo.record(true);
    if (!Paint.nativeJr) {
        Paint.selectButton('paintbucket');
    }
};

Paint.doAbsolute = function (div) {
    for (var i = 0; i < div.childElementCount; i++) {
        var elem = div.childNodes[i];
        if (elem.tagName == 'path') {
            SVG2Canvas.setAbsolutePath(elem);
        }
        if (elem.tagName == 'g') {
            Paint.doAbsolute(div.childNodes[i]);
        }
    }
};

Paint.getComponents = function (p, res) {
    for (var i = 0; i < p.childNodes.length; i++) {
        var elem = p.childNodes[i];
        if (elem.nodeName == 'metadata') {
            continue;
        }
        if (elem.nodeName == 'defs') {
            continue;
        }
        if (elem.nodeName == 'sodipodi:namedview') {
            continue;
        }
        if (elem.nodeName == '#comment') {
            continue;
        }
        if (elem.nodeName == 'g') {
            Paint.getComponents(elem, res);
            if (elem.getAttribute('id')) {
                elem.removeAttribute('id');
            }
        } else {
            res.push(elem);
        }
    }
    return res;
};
