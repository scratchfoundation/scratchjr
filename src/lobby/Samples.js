//////////////////////////////////////////////////
// Samples Screen
//////////////////////////////////////////////////

var Samples = function () {};
Samples.frame;
Samples.db;
Samples.urlvars;
Samples.version;
// Should ScratchJr projects be saved when the sample project is changed?
// Enabled for the PBS version; disabled for the ScratchJr version
Samples.storyStarters = Settings.useStoryStarters;

Samples.projectdata = new Object();
Samples.database = 'iOSprojects';

Samples.init = function () {
    Samples.version = Lobby.version;
    Samples.time = (new Date()) - 0;
    Samples.urlvars = getUrlVars();
    Samples.frame = gn('htmlcontents');
    gn('tabicon').ontouchstart = Samples.playHowTo;
    var div = newHTML('div', 'samples off', Samples.frame);
    div.setAttribute('id', 'samples');
    Samples.display('samples');
};

////////////////////////////
// Show Me How
////////////////////////////

Samples.playHowTo = function (e) {
    e.preventDefault();
    e.stopPropagation();
    ScratchAudio.sndFX('tap.wav');
    window.location.href = 'gettingstarted.html?place=help';
};

////////////////////////////
// Learn Samples
////////////////////////////

Samples.display = function (key) {
    var files = MediaLib[key];
    var div = gn(key);
    for (var i = 0; i < files.length; i++) {
        Samples.addLink(div, i, files[i]);
        Samples.requestFromServer(i, files[i], displayThumb);
    }
    function displayThumb (pos, str) {
        var mt = gn('sample-' + pos);
        var data = IO.parseProjectData(JSON.parse(str)[0]);
        var name = mt.childNodes[1];

        // Localize sample project names
        var sampleName = data.name;
        sampleName = Localization.localize('SAMPLE_' + sampleName);

        name.textContent = sampleName;
        var cnv = mt.childNodes[0].childNodes[1];
        Samples.insertThumbnail(cnv, data.thumbnail);
        mt.onclick = function (evt) {
            Samples.loadMe(evt, mt);
        };
    }
    setTimeout(Samples.show, 10);
};

Samples.show = function () {
    Lobby.busy = false;
    Samples.frame.parentNode.scrollTop = 0;
    gn('samples').className = 'samples on';
};

Samples.loadMe = function (e, mt) {
    e.preventDefault();
    e.stopPropagation();
    ScratchAudio.sndFX('tap.wav');
    iOS.analyticsEvent('samples', 'sample_opened', mt.textContent);
    var md5 = mt.md5;
    window.location.href = 'editor.html?pmd5=' + md5 + '&mode=' + ((Samples.storyStarters) ? 'storyStarter' : 'look');
};

Samples.insertThumbnail = function (img, data) {
    var md5 = data.md5;
    if (md5) {
        img.style.backgroundImage = 'url(\'' + md5 + '\')';
    }
};

Samples.addLink = function (parent, pos, md5) {
    var tb = newHTML('div', 'samplethumb', parent);
    tb.setAttribute('id', 'sample-' + pos);
    tb.md5 = md5;
    tb.type = 'samplethumb';
    var mt = newHTML('div', 'thumb pos' + pos, tb);
    newHTML('div', 'woodframe', mt);
    newHTML('div', 'sampleicon', mt);
    var name = newHTML('p', undefined, tb);
    name.textContent = 'Sample ' + pos;
};

Samples.requestFromServer = function (pos, url, whenDone) {
    var xmlrequest = new XMLHttpRequest();
    xmlrequest.addEventListener('error', transferFailed, false);
    xmlrequest.onreadystatechange = function () {
        if (xmlrequest.readyState == 4) {
            whenDone(pos, xmlrequest.responseText);
        }
    };
    xmlrequest.open('GET', url, true);
    xmlrequest.send(null);
    function transferFailed (e) {
        e.preventDefault();
        e.stopPropagation();
        // Failed loading
    }
};
