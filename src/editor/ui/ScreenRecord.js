import ScratchJr from '../ScratchJr';
import iOS from '../../iPad/iOS';
import UI from './UI'
import {frame, gn, newHTML, isTablet, isAndroid} from '../../utils/lib';

let isRecording = false;
let error = false;
let dialogOpen = false;
let timeLimit = null;

export default class ScreenRecord {

	//---------------------------
	//    Getters & Setters     |
	//---------------------------

	static get isRecording() {
		return isRecording;
	}

	static get dialogOpen() {
		return dialogOpen;
	}

	// static set isRecording(newRecording) {
	// 	isRecording = newRecording;
	// }


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
        // setTimeout(function () {
        //     gn('screenrecorddialog').setAttribute('class', 'screenrecord fade');
        // }, 0);
		
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
        if (error) {
            ScreenRecord.killRecorder();
            return;
        }

        if (isRecording) {
            return;
        } else {
        	var micEnabled = true;
            iOS.startscreenrecord(micEnabled, function (e, cancelSound, result) {
            	console.log("RESULT INSIDE: " + result);

            	if (result) {
            		// Update UI and state
            		isRecording = true;
					gn('id_startrecord').childNodes[0].setAttribute('class', 'startrecord on');
            		gn('id_startrecord').ontouchstart = ScreenRecord.stopRecording;


            		// If timeLimit is defined, set a timeout function to stop to record
            		if (timeLimit) {
	            		timeLimit = setTimeout(function () {
	                		if (isRecording) {
	                 			ScreenRecord.stopRecording();
	                		}
	            		}, timeLimit);
	            	}

            	} else {
            		console.log("iOS returned no match for startRecord");
            	}
            });
        }
    }


    // Press on stop
    static stopRecording () {
    	gn('id_startrecord').ontouchstart = ScreenRecord.startRecording;
    	
        if (error) {
            Record.killRecorder();
            return;
        }

        // UI Changes
        // Play Sounds?
        ScreenRecord.flashStopButton(); // Stop Button 
        gn('id_startrecord').childNodes[0].setAttribute('class', 'startrecord off'); // Start Button
        
        // Stop Recording
        if (isRecording) {
            iOS.stopscreenrecord(false, function (e) {
            	isRecording = false;
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
        isRecording = false;
        ScreenRecord.disappear();
    }

    // Called when the app is put into the background (borrowed from Record.js)
    static recordError () {
        error = true;
        ScreenRecord.killRecorder();
    }
}