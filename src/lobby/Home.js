//////////////////////////////////////////////////
// Home Screen
//////////////////////////////////////////////////

var Home = function () {};
Home.frame;
Home.time;
Home.scrollvalue;

Home.init = function () {
    Home.version = Lobby.version;
    Home.time = (new Date()) - 0;
    Home.frame = gn('htmlcontents');
    var inner = newHTML('div', 'inner', Home.frame);
    var div = newHTML('div', 'scrollarea', inner);
    div.setAttribute('id', 'scrollarea');
    Home.frame.ontouchstart = Home.handleTouchStart;
    Home.frame.ontouchend = Home.handleTouchEnd;
    Home.displayYourProjects();
};

////////////////////////////
// Home Screen
////////////////////////////

Home.emptyProjectThumbnail = function (parent) {
    var tb = newHTML('div', 'projectthumb', parent);
    newHTML('div', 'aproject empty', tb);
    tb.id = 'newproject';
};

//////////////////////////
// Events
//////////////////////////

Home.handleTouchStart = function (e) {
    Home.dragging = false;
    Home.holding = false;
    // if ((t.nodeName == "INPUT") || (t.nodeName == "FORM")) return;
    var mytarget = Home.getMouseTarget(e);
    if ((mytarget != Home.actionTarget) && Home.actionTarget && (Home.actionTarget.childElementCount > 2)) {
        Home.actionTarget.childNodes[Home.actionTarget.childElementCount - 1].style.visibility = 'hidden';
    }
    Home.actionTarget = mytarget;
    Home.initialPt = Events.getTargetPoint(e);
    if (Home.actionTarget) {
        holdit(Home.actionTarget);
    }
    function holdit () {
        Home.frame.ontouchmove = Home.handleMove;
        var repeat = function () {
            if (Home.actionTarget && (Home.actionTarget.childElementCount > 2)) {
                Home.actionTarget.childNodes[Home.actionTarget.childElementCount - 1].style.visibility = 'visible';

                Home.holding = true;
            }
        };
        Home.timeoutEvent = setTimeout(repeat, 500);
    }
    Home.scrolltop = document.body.scrollTop;
};

Home.handleMove = function (e) {
    var pt = Events.getTargetPoint(e);
    var delta = Vector.diff(pt, Home.initialPt);
    if (!Home.dragging && (Vector.len(delta) > 20)) {
        Home.dragging = true;
    }
    if (!Home.dragging) {
        return;
    }
    if (Home.timeoutEvent) {
        clearTimeout(Home.timeoutEvent);
    }
    Home.timeoutEvent = undefined;
};

Home.getMouseTarget = function (e) {
    var t = e.target;
    if (t == frame) {
        return null;
    }
    if (t.parentNode && !t.parentNode.tagName) {
        return null;
    }
    while (t.parentNode && (t.parentNode != frame) && (t.parentNode.getAttribute('class') != 'scrollarea')) {
        t = t.parentNode;
    }
    return (!t.parentNode || (t.parentNode == frame)) ? null : t;
};

Home.handleTouchEnd = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.touches && (e.touches.length > 1)) {
        return;
    }
    if (isTablet) {
        Home.frame.ontouchmove = undefined;
    } else {
        Home.frame.onmousemove = undefined;
    }
    if (Home.timeoutEvent) {
        clearTimeout(Home.timeoutEvent);
    }
    Home.timeoutEvent = undefined;
    if (Home.dragging) {
        return;
    }
    Home.performAction(e);
};

Home.performAction = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!Home.actionTarget) {
        return;
    }
    if (Home.holding) {
        return;
    }
    var md5 = Home.actionTarget.id;
    switch (Home.getAction(e)) {
    case 'project':
        ScratchAudio.sndFX('keydown.wav');
        if (md5 && (md5 == 'newproject')) {
            Home.createNewProject();
        } else if (md5) {
            iOS.setfile('homescroll.sjr', gn('wrapc').scrollTop, function () {
                doNext(md5);
            });
        }
        break;
    case 'delete':
        ScratchAudio.sndFX('cut.wav');
        Project.thumbnailUnique(Home.actionTarget.thumb, Home.actionTarget.id, function (isUnique) {
            if (isUnique) {
                iOS.remove(Home.actionTarget.thumb, iOS.trace);
            }
        });
        iOS.setfield(iOS.database, Home.actionTarget.id, 'deleted', 'YES', Home.removeProjThumb);
        break;
    default:
        if (Home.actionTarget && (Home.actionTarget.childElementCount > 2)) {
            Home.actionTarget.childNodes[Home.actionTarget.childElementCount - 1].style.visibility = 'hidden';
        }
        break;
    }
    function doNext () {
        iOS.analyticsEvent('lobby', 'existing_project_edited');
        window.location.href = 'editor.html?pmd5=' + md5 + '&mode=edit';
    }
};

Home.createNewProject = function () {
    iOS.analyticsEvent('lobby', 'project_created');
    var obj = {};
    // XXX: for localization, the new project name should likely be refactored
    obj.name = Home.getNextName(Localization.localize('NEW_PROJECT_PREFIX'));
    obj.version = Home.version;
    obj.mtime = (new Date()).getTime().toString();
    IO.createProject(obj, Home.gotoEditor);
};

Home.gotoEditor = function (md5) {
    iOS.setfile('homescroll.sjr', gn('wrapc').scrollTop, function () {
        doNext(md5);
    });
    function doNext (md5) {
        window.location.href = 'editor.html?pmd5=' + md5 + '&mode=edit';
    }
};

// Project names are given by reading the DOM elements of existing projects...
Home.getNextName = function (name) {
    var pn = [];
    var div = gn('scrollarea');
    for (var i = 0; i < div.childElementCount; i++) {
        if (div.childNodes[i].id == 'newproject') {
            continue;
        }
        pn.push(div.childNodes[i].childNodes[1].childNodes[0].textContent);
    }
    var n = 1;
    while (pn.indexOf(name + ' ' + n) > -1) {
        n++;
    }
    return name + ' ' + n;
};

Home.removeProjThumb = function () {
    if (Home.actionTarget && Home.actionTarget.parentNode) {
        Home.actionTarget.parentNode.removeChild(Home.actionTarget);
    }
    Home.actionTarget = undefined;
};

Home.getAction = function (e) {
    if (!Home.actionTarget) {
        return 'none';
    }
    var shown = (Home.actionTarget.childElementCount > 2) ?
        Home.actionTarget.childNodes[Home.actionTarget.childElementCount - 1].style.visibility == 'visible' :
        false;
    if (e && shown) {
        var t;
        if (window.event) {
            t = window.event.srcElement;
        } else {
            t = e.target;
        }
        if (t.getAttribute('class') == 'closex') {
            return 'delete';
        }
    }
    return 'project';
};

//////////////////////////
// Gather projects
//////////////////////////

Home.displayYourProjects = function () {
    iOS.getfile('homescroll.sjr', gotScrollsState);
    function gotScrollsState (str) {
        var num = Number(atob(str));
        Home.scrollvalue = (num.toString() == 'NaN') ? 0 : num;
        var json = {};
        json.cond = 'deleted = ? AND version = ? AND gallery IS NULL';
        json.items = ['name', 'thumbnail', 'id', 'isgift'];
        json.values = ['NO', Home.version];
        json.order = 'ctime desc';
        IO.query(iOS.database, json, Home.displayProjects);
    }
};

Home.displayProjects = function (str) {
    var data = JSON.parse(str);
    var div = gn('scrollarea');
    while (div.childElementCount > 0) {
        div.removeChild(div.childNodes[0]);
    }
    Home.emptyProjectThumbnail(div);
    for (var i = 0; i < data.length; i++) {
        Home.addProjectLink(div, data[i]);
    }
    setTimeout(function () {
        Lobby.busy = false;
    }, 1000);
    if (gn('wrapc')) {
        gn('wrapc').scrollTop = Home.scrollvalue;
    }
};

Home.addProjectLink = function (parent, aa) {
    var data = IO.parseProjectData(aa);
    var id = data.id;
    var th = data.thumbnail;
    if (!th) {
        return;
    }
    var thumb = (typeof th === 'string') ? JSON.parse(th) : th;
    var pc = thumb.pagecount ? thumb.pagecount : 1;
    var tb = newHTML('div', 'projectthumb', parent);
    tb.setAttribute('id', id);
    tb.type = 'projectthumb';
    tb.thumb = thumb.md5;
    var mt = newHTML('div', 'aproject p' + pc, tb);
    Home.insertThumbnail(mt, 192, 144, thumb);
    var label = newHTML('div', 'projecttitle', tb);
    var txt = newHTML('h4', undefined, label);
    txt.textContent = data.name;

    var bow = newHTML('div', 'share', tb);
    var ribbonHorizontal = newHTML('div', 'ribbonHorizontal', tb);
    var ribbonVertical = newHTML('div', 'ribbonVertical', tb);

    if (data.isgift != '0') {
        // If it's a gift, show the bow and ribbon
        bow.style.visibility = 'visible';
        ribbonHorizontal.style.visibility = 'visible';
        ribbonVertical.style.visibility = 'visible';
    }

    newHTML('div', 'closex', tb);
};

Home.insertThumbnail = function (p, w, h, data) {
    var md5 = data.md5;
    var img = newHTML('img', undefined, p);
    if (md5) {
        IO.getAsset(md5, drawMe);
    }
    function drawMe (url) {
        img.src = url;
    }
};

Events = function () {};

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
