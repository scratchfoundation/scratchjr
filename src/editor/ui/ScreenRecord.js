import ScratchJr from '../ScratchJr';
import iOS from '../../iPad/iOS';
import UI from './UI'
import {frame, gn, newHTML, isTablet, isAndroid} from '../../utils/lib';

let error = false;
let dialogOpen = false;
let timeLimit = null;
let isRecording = false;

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

		var modal = newHTML('div', 'screenrecord fade', frame);
        modal.setAttribute('id', 'screenrecorddialog');

        var toolbar = newHTML('div', 'screentoolbar', modal);

        var controls = newHTML('div', 'recordcontrols', toolbar);
        controls.setAttribute('id', 'recordcontrols')

        // Buttons
        var lib = [['startrecord', ScreenRecord.startRecording], ['stoprecord', ScreenRecord.stopRecording]];

        for (var j = 0; j < lib.length; j++) {
            ScreenRecord.newToggleClicky(controls, 'id_', lib[j][0], lib[j][1]);
        }

        setInterval(function () {
            isRecording = ScreenRecord.isRecording;
            console.log(isRecording);
        }, 1000);

        ScreenRecord.killRecorder();
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

        ScratchJr.stopStrips();
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
	//      Button Actions      |
	//---------------------------

	// Press on start
    static startRecording () {
        // ScreenRecord.killRecorder();
        // ScreenRecord.appear();

        if (error) {
            ScreenRecord.killRecorder();
            return;
        }

    	var micEnabled = false; // mic disabled by default
        iOS.startscreenrecord(micEnabled, function () {
            // await sleep(3000); // waits 3 sec for recording to start

        	if (true) {
        		// Update UI and state
				gn('id_startrecord').childNodes[0].setAttribute('class', 'startrecord on');
        		gn('id_startrecord').ontouchstart = ScreenRecord.stopRecording;

        		// If timeLimit is defined, set a timeout function to stop to record
        		if (timeLimit) {
            		setTimeout(ScreenRecord.stopRecording, timeLimit);
            	}

        	} else {
                ScreenRecord.killRecorder();
        		console.log("iOS returned no match for startRecord");
        	}
        });
    }


    // Press on stop
    static stopRecording () {
    	gn('id_startrecord').ontouchstart = ScreenRecord.startRecording;
    	
        if (error) {
            ScreenRecord.killRecorder();
            return;
        }

        // UI Changes
        // Play Sounds?
        ScreenRecord.flashStopButton(); // Stop Button 
        gn('id_startrecord').childNodes[0].setAttribute('class', 'startrecord off'); // Start Button
        
        // Stop Recording
        if (true) {
            iOS.stopscreenrecord(false, function () {
            	UI.toggleRecording(); // TODO: maybe wait a little bit before toggling?
            });
        }
    }


    //---------------------------
	//       Error Control      |
	//---------------------------

	// Forcibly stop recording with no dialog
	static killRecorder() {
		iOS.stopscreenrecord(true, function (e) {
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