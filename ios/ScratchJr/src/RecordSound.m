#import "ScratchJr.h"
#import <AVFoundation/AVFoundation.h>

@implementation RecordSound : NSObject

NSString *soundname = nil;
AVAudioRecorder *recorder;
AVAudioPlayer *audioPlayer;
bool isPlaying = FALSE;
bool recordingKilled = FALSE;

// for sound volume

NSTimer *levelTimer;
double lowPassResults;
NSString *canRecord;

+ (NSString *)recordclose:(NSString *)keep  {
    recordingKilled = FALSE;
    return [RecordSound sessionFinish:keep];
}

+ (void) setPermission {
    [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {canRecord =  granted  ? @"YES":  @"NO";}];
}

+ (NSString *)getPermission { return (!canRecord) ? @"YES" : canRecord;}

+ (double) getVolume{
    if (recordingKilled) {
        recordingKilled = FALSE;
        return 0;
    }
    
    [recorder updateMeters];
    const double ALPHA = 0.05;
	double peakPowerForChannel = pow(10, (0.05 * [recorder peakPowerForChannel:0]));
	lowPassResults = ALPHA * peakPowerForChannel + (1.0 - ALPHA) * lowPassResults;
    return lowPassResults;
}

// Triggers on app to background
// Indicates to getVolume to tell JavaScript to throw out the record dialog
+ (void) killRecording {
    recordingKilled = TRUE;
}

// Init audio with record capability
+ (NSString*)startRecord{
    recordingKilled = FALSE;
    recorder = nil;
    if ([canRecord isEqualToString:@"NO"]) return @"-1";
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];

    if (soundname != nil) [IO removeFile:soundname];

    NSString *now=[NSString stringWithFormat:@"%f",[[NSDate date] timeIntervalSince1970]];
    soundname = [NSString stringWithFormat:@"SND%@.wav", [IO getMD5:now]];  // name is the md5 of the time
    NSURL *url = [IO getDocumentPath:soundname];

    NSError *err;
    NSDictionary *settings = [NSDictionary dictionaryWithObjectsAndKeys:
                              [NSNumber numberWithInt: kAudioFormatLinearPCM], AVFormatIDKey,
                              [NSNumber numberWithFloat: 16000.0], AVSampleRateKey,
                              [NSNumber numberWithInt: 1], AVNumberOfChannelsKey,
                              [NSNumber numberWithInt: 8], AVLinearPCMBitDepthKey,
                              nil];
    recorder = [[ AVAudioRecorder alloc] initWithURL:url settings:settings error:&err];
    if (err) {
        NSLog (@"bad recording %@", err);
        recorder = nil;
        return @"-1";
    }
    [recorder prepareToRecord];
    recorder.meteringEnabled = YES;
    [recorder record];
    return soundname;
}

+(NSString*) stopRecording{
    if (recorder == nil) return @"-1";
    [recorder stop];
    recorder = nil;
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];
    recordingKilled = FALSE;
    return @"1";
}

+ (NSString*)startPlay{
    if (soundname == nil) return  @"-1";
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];

    NSURL *url = [IO getDocumentPath:soundname];
	NSError *error;
	audioPlayer = [[AVAudioPlayer alloc] initWithContentsOfURL:url error:&error];
	audioPlayer.numberOfLoops = 0;	
	if (audioPlayer == nil) return @"-1";
    if (error) return @"-1";
	else {
        isPlaying = TRUE;
        audioPlayer.delegate = [RecordSound self];
        [audioPlayer play];
        return [NSString stringWithFormat: @"%f", audioPlayer.duration];
    }
}

+ (NSString*)stopPlay{
    if (soundname == nil) return @"-1";;
    if (audioPlayer == nil) return @"-1";
    [audioPlayer stop];
    isPlaying = FALSE;
    audioPlayer = nil;
    return @"1";
}

+ (NSString*)sessionFinish:(NSString*)keep{
    if ([keep isEqualToString:@"NO"] &&  (soundname != nil)) [IO removeFile:soundname];
    soundname = nil;
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];
    return keep ? @"1" :  @"-1";
}

@end
