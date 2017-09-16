import ScratchJr from '../ScratchJr';
import iOS from '../../iPad/iOS';
import UI from './UI'
import {frame, gn, newHTML, isTablet, isAndroid} from '../../utils/lib';

let error = false;
let dialogOpen = false;
let timeLimit = null;

export default class ScreenRecord {

	//---------------------------
	//    Getters & Setters     |
	//---------------------------

	static get isRecording() {
		return iOS.isscreenrecording();
	}

	static get dialogOpen() {
		return dialogOpen;
	}


	//---------------------------
	//      Initialization      |
	//---------------------------

    static init() {
		// Screen Recording only for mobile devices
		if (!isTablet) {
            return;
		}

        // iOS bridge init (for screen recording callbacks from iOS -> JS)
        ScreenRecord.setupWebViewJavascriptBridge(function(bridge) {
            // Callback for when iOS completes startup for recording
        	bridge.registerHandler('Recording Started', function(data, responseCallback) {
                ScreenRecord.finishStartRecording();
        	});

            // Callback for when iOS completes stopping of recording
            bridge.registerHandler('Recording Stopped', function(data, responseCallback) {
                ScreenRecord.finishStopRecording();
            });
        });


        // UI Initialization

        // Topbar icon
		var modal = newHTML('div', 'screenrecord fade', frame);
        modal.setAttribute('id', 'screenrecorddialog');

        var toolbar = newHTML('div', 'screentoolbar', modal);

        var controls = newHTML('div', 'recordcontrols', toolbar);
        controls.setAttribute('id', 'recordcontrols')

        // Start/Stop Buttons
        var lib = [['startrecord', ScreenRecord.startRecording], ['stoprecord', ScreenRecord.stopRecording]];

        for (var j = 0; j < lib.length; j++) {
            ScreenRecord.newToggleClicky(controls, 'id_', lib[j][0], lib[j][1]);
        }
    }

    // Setup Bridge for iOS to call JS (https://github.com/marcuswestin/WebViewJavascriptBridge)
	static setupWebViewJavascriptBridge(callback) {
		if (window.WebViewJavascriptBridge) { return callback(WebViewJavascriptBridge); }
		if (window.WVJBCallbacks) { return window.WVJBCallbacks.push(callback); }
		window.WVJBCallbacks = [callback];
		var WVJBIframe = document.createElement('iframe');
		WVJBIframe.style.display = 'none';
		WVJBIframe.src = 'wvjbscheme://__BRIDGE_LOADED__';
		document.documentElement.appendChild(WVJBIframe);
		setTimeout(function() { document.documentElement.removeChild(WVJBIframe) }, 0);
	}


	// Register toggle buttons and handlers
    static newToggleClicky (p, prefix, key, fcn) {
        var button = newHTML('div', 'screencontrolwrap', p);
        newHTML('div', key + ' off', button);
        button.setAttribute('type', 'toggleclicky');
        button.setAttribute('id', prefix + key);

        if (fcn) {
            if (isTablet) {
                button.ontouchstart = function (evt) {
                    fcn(evt);
                };
            }
        }

        return button;
    }


	//----------------------------
	//     Button UI Methods     |
	//----------------------------

    static flashStopButton() {
    	gn('id_stoprecord').childNodes[0].setAttribute('class', 'stoprecord on');

        setTimeout( function () {
    		gn('id_stoprecord').childNodes[0].setAttribute('class', 'stoprecord off');
    	}, 150);
    }


    //---------------------------
	//     Show / Hide Menu     |
	//---------------------------

    static appear () {
        // Update UI and state
        if (ScratchJr.inFullscreen) {
            gn('screenrecorddialog').setAttribute('class', 'screenrecord fade in presentationmode');
        } else {
            gn('screenrecorddialog').setAttribute('class', 'screenrecord fade in');
        }

        dialogOpen = true;

        // Android; TODO: modify if necessary
        ScratchJr.onBackButtonCallback.push(ScreenRecord.disappear);
    }

    static disappear () {
        // Update UI and state
        gn('screenrecorddialog').setAttribute('class', 'screenrecord fade');
        dialogOpen = false;

        // Android; TODO: modify if necessary
        ScratchJr.onBackButtonCallback.pop();
    }


    //---------------------------
    //      Record Actions      |
    //---------------------------

    // Press on start
    static startRecording () {
        if (error) {
            ScreenRecord.killRecorder();
            return;
        }

		var micEnabled = false; // mic disabled by default
        iOS.startscreenrecord(micEnabled);
    }

    // Called by iOS bridge after recording has started
    static finishStartRecording() {
        // Update UI and state
        gn('id_startrecord').childNodes[0].setAttribute('class', 'startrecord on');
        gn('id_startrecord').ontouchstart = ScreenRecord.stopRecording;

        var newRecordClass = 'recordToggle on_recording';
        if(ScratchJr.inFullscreen) {
            newRecordClass += ' presentationmode';
        }

        gn('record').setAttribute('class', newRecordClass);

        // If timeLimit is defined, set a timeout function to stop to record
        if (timeLimit) {
            setTimeout(ScreenRecord.stopRecording, timeLimit);
        }

        // Send Analytics Event
        iOS.analyticsEvent('editor', 'project_recorded');
    }

    // Press on stop
    static stopRecording () {
        if (error) {
            ScreenRecord.killRecorder();
            return;
        }

        // UI Changes
        // Play Sounds?
        ScreenRecord.flashStopButton(); // Stop Button

        // Stop Recording
        var withForce = false;
        iOS.stopscreenrecord(withForce);
    }

    // Called by iOS bridge after recording has stopped
    static finishStopRecording() {
		// Update UI and state
		gn('id_startrecord').childNodes[0].setAttribute('class', 'startrecord off'); // Start Button
		gn('id_startrecord').ontouchstart = ScreenRecord.startRecording;
        UI.toggleRecording();
    }


    //---------------------------
    //       Error Control      |
    //---------------------------

	// Forcibly stop recording with no dialog
	static killRecorder() {
	    var withForce = true;
        iOS.stopscreenrecord(withForce, function (e) {
            ScreenRecord.disappear();
        });
	}

    static tearDownRecorder () {
        // Refresh context
        error = false;
        ScreenRecord.disappear();
    }

    // Called when the app is put into the background (borrowed from Record.js)
    static recordError () {
        error = true;
        ScreenRecord.killRecorder();
    }
}
