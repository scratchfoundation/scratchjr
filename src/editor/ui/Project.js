var Project = function () {};

Project.metadata = undefined;
Project.mediaCount = -1;
Project.saving = false;
Project.angle = 0;
Project.interval = undefined;
Project.pageid;
Project.loadIcon = undefined;
Project.whenDone = undefined;
Project.requestsCount = 0;
Project.error = false;
Project.projectbarsize = 66;
Project.mediaCountBase = 1;

Project.clear = function () {
    ScratchJr.stage.clear();
    UI.clear();
};

Project.load = function () {
    Project.mediaCountBase = 1;
    ScratchJr.log('Project load status', ScratchJr.getTime(), 'sec', BlockSpecs.loadCount);
    if (BlockSpecs.loadCount > 0) {
        setTimeout(function () {
            Project.delayLoad();
        }, 32);
    } else {
        Project.startLoad();
    }
};

Project.delayLoad = function () {
    if (BlockSpecs.loadCount < 1) {
        Project.startLoad();
    } else {
        setTimeout(function () {
            Project.delayLoad();
        }, 32);
    }
};

Project.startLoad = function () {
    ScratchJr.log('all UI assets recieved - procced to call server', ScratchJr.getTime(), 'sec');
    Project.setProgress(20);
    UI.layout();
    IO.getObject(ScratchJr.currentProject, Project.dataRecieved);
};

Project.dataRecieved = function (str) {
    ScratchJr.log('got project metadata', ScratchJr.getTime(), 'sec');
    var data = JSON.parse(str)[0];
    Project.metadata = IO.parseProjectData(data);
    Project.mediaCount = -1;
    if (Project.metadata.json) {
        Project.loadData(Project.metadata.json, doneProjectLoad);
    } else {
        Project.mediaCount = 0;
        new Page(getIdFor('page'));
        Palette.selectCategory(1);
        // On Android 4.2, this comes up blank the first time, so try again in 100ms.
        setTimeout(function () {
            Palette.selectCategory(1);
        }, 100);
        Project.loadwait(doneProjectLoad);
    }
    function doneProjectLoad () {
        // Clear gift flag
        if ('id' in Project.metadata) {
            Project.metadata.isgift = '0';
            IO.setProjectIsGift(Project.metadata);
        }
        Palette.selectCategory(1);
        // On Android 4.2, this comes up blank the first time, so try again in 100ms.
        setTimeout(function () {
            Palette.selectCategory(1);
        }, 100);
        Paint.layout();
        Project.setProgress(100);
        Project.liftCurtain();
        ScratchJr.stage.currentPage.update();
        ScratchJr.changed = false;
        ScratchJr.storyStarted = false;
        UI.needsScroll();
        ScratchJr.log('all thumbnails updated', ScratchJr.getTime(), 'sec');
        if (isAndroid) {
            AndroidInterface.notifyEditorDoneLoading();
        }
    }
};


Project.init = function () {
    ScratchJr.log('Project init', ScratchJr.getTime(), 'sec');
    var bd = newHTML('div', 'modal-backdrop fade', frame.parentNode);
    bd.setAttribute('id', 'backdrop');
    setProps(gn('backdrop').style, {
        display: 'none'
    });
    var modalOuter = newHTML('div', 'modal-outer', frame.parentNode);
    var modalMiddle = newHTML('div', 'modal-middle', modalOuter);
    var modal = newHTML('div', 'modal hide fade', modalMiddle);
    modal.setAttribute('id', 'modaldialog');
    setProps(gn('modaldialog').style, {});
    var body = newHTML('div', 'modal-body', modal);
    body.setAttribute('id', 'modalbody');
    setProps(body.style, {
        zoom: scaleMultiplier
    });
    if (Project.loadIcon.complete) {
        Project.addFeedback();
    } else {
        Project.loadIcon.onload = function () {
            Project.addFeedback();
        };
    }
    Project.drawBlind();
};

Project.addFeedback = function () {
    var body = gn('modalbody');
    newHTML('div', 'loadscreenfill', body);
    newHTML('div', 'topfill', body);
    var cover = newHTML('div', 'loadscreencover', body);
    cover.setAttribute('id', 'progressbar');
    var topcover = newHTML('div', 'topcover', body);
    topcover.setAttribute('id', 'topcover');
    var cover2 = newHTML('div', 'progressbar2', body);
    cover2.setAttribute('id', 'progressbar2');
    var li = newHTML('div', 'loadicon', body);
    li.appendChild(Project.loadIcon);
};

Project.setProgress = function (perc) {
    if (!gn('progressbar')) {
        return;
    }
    var h = Project.projectbarsize - Math.round(Project.projectbarsize * perc / 100);
    ScratchJr.log('setProgress', perc, h, Project.mediaCount, Project.mediaCountBase);
    gn('progressbar').style.height = h + 'px';
    if (h == 0) {
        gn('progressbar2').style.height = '0px';
        gn('topcover').style.background = '#F9A737';
    }

};

Project.drawBlind = function () {
    gn('backdrop').setAttribute('class', 'modal-backdrop fade in');
    setProps(gn('backdrop').style, {
        display: 'block'
    });
    setProps(gn('modaldialog').style, {
        display: 'block'
    });
    gn('modaldialog').setAttribute('class', 'modal fade in');
};

Project.loadwait = function (whenDone) {
    if (Project.interval != null) {
        window.clearInterval(Project.interval);
    }
    Project.mediaCountBase = Project.mediaCount;
    if (Project.mediaCount <= 0) {
        Project.getStarted(whenDone);
    } else {
        Project.interval = window.setInterval(function () {
            Project.loadTask(whenDone);
        }, 32);
    }
};

Project.loadTask = function (whenDone) {
    if (Project.mediaCount <= 0) {
        Project.getStarted(whenDone);
    } else {
        Project.setProgress(Project.getMediaLoadRatio(70));
    }
};

Project.getMediaLoadRatio = function (f) {
    if (Project.mediaCount > Project.mediaCountBase) {
        Project.mediaCountBase = Project.mediaCount;
    }
    return 20 + f - (Project.mediaCount / Project.mediaCountBase) * f;
};

Project.getStarted = function (whenDone) {
    Project.setProgress(90);
    if (Project.interval) {
        window.clearInterval(Project.interval);
    }
    Project.interval = null;
    ScratchJr.log('Project images retrieved from server', ScratchJr.getTime(), 'sec');
    Project.setLoadPage(Project.pageid, whenDone);
    ScratchJr.log('load done', ScratchJr.getTime(), 'sec', '-- media missing = ', Project.mediaCount);
    ScratchJr.stage.resetPages();
    ScratchJr.runtime.beginTimer();
};

Project.liftCurtain = function () {
    gn('backdrop').setAttribute('class', 'modal-backdrop fade');
    setProps(gn('backdrop').style, {
        display: 'none'
    });
    gn('modaldialog').setAttribute('class', 'modal fade');
    setProps(gn('modaldialog').style, {
        display: 'none'
    });
};

Project.setLoadPage = function (pageid, whenDone) {
    ScratchJr.log('setLoadPage', ScratchJr.getTime(), 'sec');
    var pages = ScratchJr.stage.getPagesID();
    if (pages.indexOf(pageid) < 0) {
        ScratchJr.stage.currentPage = ScratchJr.stage.pages[0];
    } else {
        ScratchJr.stage.currentPage = ScratchJr.stage.getPage(pageid);
    }
    ScratchJr.stage.currentPage.div.style.visibility = 'visible';
    var list = ScratchJr.stage.pages;
    for (var i = 0; i < list.length; i++) {
        if (ScratchJr.stage.currentPage == list[i]) {
            ScratchJr.stage.currentPage.setPageSprites('visible');
        } else {
            list[i].setPageSprites('hidden');
        }
    }
    if (whenDone) {
        whenDone();
    }
};

Project.loadData = function (data, fcn) {
    try {
        data = (typeof data === 'string') ? JSON.parse(data) : data;
        Project.mediaCount = 0;
        Project.loadme(data, fcn);
        Project.error = false;
    } catch (e) {
        console.log(e); //eslint-disable-line no-console
        var errorMessage = 'Error -- project data corrupted.';

        if (window.reloadDebug) {
            document.write(e.message + '\n' + Project.metadata['json']);
            return;
        }

        Alert.open(frame, gn('flip'), errorMessage, '#ff0000');
        if (Project.interval) {
            window.clearInterval(Project.interval);
        }
        Project.interval = null;
        Palette.selectCategory(1);
        // On Android 4.2, this comes up blank the first time, so try again in 100ms.
        setTimeout(function () {
            Palette.selectCategory(1);
        }, 100);
        Project.liftCurtain();
        Project.error = true;
    }
};

Project.loadme = function (data, fcn) {
    Project.recreate(data);
    Project.loadwait(fcn);
};

Project.getLoadType = function (bkgid, sid, cid) {
    if (bkgid != null) {
        return 'bkg';
    }
    if (!cid) {
        return 'none';
    }
    if (sid && cid) {
        return 'modify';
    }
    return 'add';
};

//////////////////////////////////////////////////
// load project data
//////////////////////////////////////////////////

Project.recreate = function (data) {
    ScratchJr.log('Project data structures start loading', ScratchJr.getTime(), 'sec');
    Project.mediaCount = 0;
    ScratchJr.stage.pages = [];
    var pages = data.pages;
    Project.pageid = data.currentPage;
    for (var i = 0; i < pages.length; i++) {
        Project.recreatePage(pages[i], data[pages[i]]);
    }
    Project.mediaCountBase = Project.mediaCount;
};

Project.recreatePage = function (name, data, fcn) {
    var page = new Page(name, data, fcn);
    page.div.style.visibility = 'hidden';
};

Project.substractCount = function () {
    Project.mediaCount--;
    if ((gn('backdrop').className != 'modal-backdrop fade in') || (Project.mediaCountBase == 0)) {
        return;
    }
    Project.setProgress(Project.getMediaLoadRatio(70));
};

Project.recreateObject = function (page, name, data, callBack, active) {
    var list = data.scripts;
    //delete data.scripts;
    var spr;
    data.page = page;
    if (data.type == 'sprite') {
        Project.mediaCount++;
        var fcn = function (spr) {
            spr.setPos(data.xcoor, data.ycoor);
            Project.mediaCount--;
            if (gn('backdrop').className == 'modal-backdrop fade in') {
                Project.setProgress(Project.getMediaLoadRatio(70));
            }
            ScratchJr.log(spr.name, ScratchJr.getTime(), 'sec');
            if (callBack) {
                callBack(spr);
            }
        };
        if (!data.defaultScale) {
            data.defaultScale = 0.5;
        }
        spr = new Sprite(data, fcn);
        // load scripts
        var sc = gn(name + '_scripts').owner;
        for (var j = 0; j < list.length; j++) {
            sc.recreateStrip(list[j]);
        }
        if (active) {
            sc.activate();
        } else {
            sc.deactivate();
        }
    } else {
        spr = new Sprite(data, callBack);
    }
    spr.div.style.opacity = spr.shown ? 1 : 0;
    return spr;
};

//////////////////////////////////////////////////
// Save project data
//////////////////////////////////////////////////

Project.prepareToSave = function (id, whenDone) {
    if (Project.saving) {
        Alert.open(frame, gn('flip'), 'Waiting', '#28A5DA');
        Project.waitUntilSaved(id, whenDone);
    } else {
        Alert.open(frame, gn('flip'), 'Saving', '#28A5DA');
        Project.save(id, whenDone);
    }
};

Project.waitUntilSaved = function (id, fcn) {
    if (Project.saving) {
        setTimeout(function () {
            Project.waitUntilSaved(id, fcn);
        }, 500);
    } else {
        Project.save(id, fcn);
    }
};

// Determine if thumbnailMD5 is unique to projectID
// callback(true/false)
Project.thumbnailUnique = function (thumbnailMD5, projectID, callback) {
    var json = {};
    json.cond = 'deleted = ? AND id != ? AND gallery IS NULL';
    json.items = ['name', 'thumbnail', 'id'];
    json.values = ['NO', projectID];
    IO.query(iOS.database, json, function (result) {
        var pdata = JSON.parse(result);
        var isUnique = true;
        for (var p = 0; p < pdata.length; p++) {
            var thispdata = IO.parseProjectData(pdata[p]);
            var th = thispdata.thumbnail;
            if (th) {
                var thumb = (typeof th == 'string') ? JSON.parse(th) : th;
                if (thumb && thumb.md5) {
                    if (thumb.md5 == thumbnailMD5) {
                        isUnique = false;
                    }
                }
            }
        }
        callback(isUnique);
    });
};

Project.save = function (id, whenDone) {
    Project.saving = true;
    var th = Project.metadata.thumbnail;
    if (th && ScratchJr.editmode != 'storyStarter') { // Don't try to delete the thumbnail in a sample project
        var thumb = (typeof th === 'string') ? JSON.parse(th) : th;
        if (thumb.md5.indexOf('samples/') < 0) { // In case we've exited story-starter mode
            Project.thumbnailUnique(thumb.md5, id, function (isUnique) {
                if (isUnique) {
                    iOS.remove(thumb.md5, iOS.trace); // remove thumb;
                }
            });
        }
    }
    Project.metadata.id = id;
    Project.metadata.json = Project.getProject(ScratchJr.stage.pages[0].id);
    Project.getThumbnailPNG(ScratchJr.stage.pages[0], 192, 144, getMD5);
    function getMD5 (dataurl) {
        var pngBase64 = dataurl.split(',')[1];
        iOS.getmd5(pngBase64, function (str) {
            savePNG(str, pngBase64);
        });
    }

    function savePNG (md5, pngBase64) {
        var filename = ScratchJr.currentProject + '_' + md5;
        iOS.setmedianame(pngBase64, filename, 'png', doNext);
    }

    function doNext (md5) {
        Project.metadata.thumbnail = {
            'pagecount': ScratchJr.stage.pages.length,
            'md5': md5
        };
        Project.metadata.mtime = (new Date()).getTime().toString();
        IO.saveProject(Project.metadata, saveDone);
    }

    function saveDone () {
        Project.saving = false;
        if (whenDone) {
            whenDone();
        }
    }
};

Project.getProject = function (pageid) {
    var obj = {};
    obj.pages = ScratchJr.stage.getPagesID();
    obj.currentPage = pageid;
    for (var i = 0; i < ScratchJr.stage.pages.length; i++) {
        obj[ScratchJr.stage.pages[i].id] = ScratchJr.stage.pages[i].encodePage();
    }
    return obj;
};

Project.getUndo = function () {
    return Project.getProject(ScratchJr.stage.currentPage.id);
};

Project.encodeSprite = function (name) {
    return gn(name).owner.getData();
};

Project.encodeStrip = function (b) {
    var res = [];
    var hasargs = ['playsnd', 'gotopage', 'playusersnd', 'setcolor', 'onmessage', 'message', 'setspeed'];
    var loops = ['repeat'];
    var carets = ['caretcmd', 'caretend', 'caretstart'];
    while (b != null) {
        var bt = b.blocktype;
        // Don't encode carets in a strip
        if (carets.indexOf(bt) > -1) {
            b = b.next;
            continue;
        }
        if (bt == 'caretrepeat') {
            // Convert repeat carets to actual repeats for the encoding
            bt = 'repeat';
        }
        var arg = (b.arg != null) || (hasargs.indexOf(bt) > -1) ? b.getArgValue() : null;
        if (!arg && (arg != 0)) {
            arg = 'null';
        }
        var dx = b.div.left / b.scale;
        var dy = b.div.top / b.scale;
        var data = [bt, arg, dx, dy];
        if (loops.indexOf(bt) > -1) {
            var inside = Project.encodeStrip(b.inside);
            data.push(inside);
        }
        res.push(data);
        b = b.next;
    }
    return res;
};

/////////////////////////////
// Project PNG Thumbnail
/////////////////////////////

Project.getThumbnailPNG = function (page, w, h, fcn) {
    var scale = w / 480;
    var data = {};
    data.pagecount = ScratchJr.stage.pages.length;
    var c = document.createElement('canvas');
    setCanvasSize(c, w, h);
    var ctx = c.getContext('2d');
    var md5 = page.md5;
    ctx.fillStyle = Settings.stageColor;
    ctx.fillRect(0, 0, w, h);
    if (!md5) {
        Project.drawSprites(page, scale, c, w, h, fcn);
    } else {
        var pcnv;
        if (md5.substr(md5.length - 3) == 'png') {
            var bgimg = page.div.firstElementChild.firstElementChild;
            pcnv = Project.drawPNGInCanvas(bgimg, 480, 360);
        } else {
            pcnv = Project.drawSVGinCanvas(page.svg, 480, 360);
        }
        ctx.drawImage(pcnv, 0, 0, 480, 360, 0, 0, w, h);
        Project.drawSprites(page, scale, c, w, h, fcn);
    }
};
Project.drawPNGInCanvas = function (png, w, h) {
    var srccnv = document.createElement('canvas');
    setCanvasSize(srccnv, w, h);
    var ctx = srccnv.getContext('2d');
    ctx.drawImage(png, 0, 0, w, h);
    return srccnv;
};

Project.drawSVGinCanvas = function (extxml, w, h) {
    var srccnv = document.createElement('canvas');
    setCanvasSize(srccnv, w, h);
    var ctx = srccnv.getContext('2d');
    for (var i = 0; i < extxml.childElementCount; i++) {
        SVG2Canvas.drawLayer(extxml.childNodes[i], ctx, SVG2Canvas.drawLayer);
    }
    return srccnv;
};

Project.maskBorders = function (ctx, w, h) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    if (Settings.edition != 'PBS') {
        ctx.drawImage(BlockSpecs.projectThumb, 0, 0, w, h);
    }
    ctx.restore();
};

Project.drawSprites = function (page, scale, c, w, h, fcn) {
    var ctx = c.getContext('2d');
    doNext(1);
    function doNext (n) {
        if (!(n < page.div.childElementCount)) {
            Project.maskBorders(c.getContext('2d'), w, h);
            fcn(c.toDataURL('image/png'));
        } else {
            var spr = page.div.childNodes[n].owner;
            if (!spr || !spr.shown) {
                doNext(n + 1);
            } else {
                drawLoadedImage(page, ctx, spr.outline, spr, scale, n);
            }
        }
    }

    function drawLoadedImage (page, ctx, img, spr, scale, n) {
        page.drawSpriteImage(ctx, img, spr, scale);
        doNext(n + 1);
    }

};
