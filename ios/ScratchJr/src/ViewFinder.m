#import "ScratchJr.h"
#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface ViewFinder (InternalUtilityMethods)
- (AVCaptureDevice *) cameraWithPosition:(AVCaptureDevicePosition)position;
- (AVCaptureDevice *) frontFacingCamera;
- (AVCaptureDevice *) backFacingCamera;
@end

@implementation ViewFinder

- (id) init {
    self = [super init];
    return self;
}


- (BOOL) setupSession {
    [self setupNotifications];
    [self setTorchAndFlash];
    return [self sessionSetup];
}

- (void) closeSession{
    NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];
    [notificationCenter removeObserver:[self deviceConnectedObserver]];
    [notificationCenter removeObserver:[self deviceDisconnectedObserver]];
	[notificationCenter removeObserver:self name:UIDeviceOrientationDidChangeNotification object:nil];
	[[UIDevice currentDevice] endGeneratingDeviceOrientationNotifications];
}

- (void) setupNotifications  {
    __block id weakSelf = self;
    void (^deviceConnectedBlock)(NSNotification *) = ^(NSNotification *notification) {
        AVCaptureDevice *device = [notification object];
        
        BOOL sessionHasDeviceWithMatchingMediaType = NO;
        NSString *deviceMediaType = nil;
        if ([device hasMediaType:AVMediaTypeAudio]) deviceMediaType = AVMediaTypeAudio;
        else if ([device hasMediaType:AVMediaTypeVideo]) deviceMediaType = AVMediaTypeVideo;
        
        if (deviceMediaType != nil) {
            for (AVCaptureDeviceInput *input in [self.session inputs]) {
                if ([[input device] hasMediaType:deviceMediaType]) {
                    sessionHasDeviceWithMatchingMediaType = YES;
                    break;
                }
            }
            
            if (!sessionHasDeviceWithMatchingMediaType) {
                NSError	*error;
                AVCaptureDeviceInput *input = [AVCaptureDeviceInput deviceInputWithDevice:device error:&error];
                if ([self.session canAddInput:input]) [self.session addInput:input];
            }
        }
        
        if ([self.delegate respondsToSelector:@selector(viewFinderDeviceConfigurationChanged:)]) [self.delegate viewFinderDeviceConfigurationChanged:self];
    };
    void (^deviceDisconnectedBlock)(NSNotification *) = ^(NSNotification *notification) {
        AVCaptureDevice *device = [notification object];
        
        if ([device hasMediaType:AVMediaTypeVideo]) {
            [self.session removeInput:[weakSelf videoInput]];
            [weakSelf setVideoInput:nil];
        }
        
        if ([self.delegate respondsToSelector:@selector(viewFinderDeviceConfigurationChanged:)]) [self.delegate viewFinderDeviceConfigurationChanged:self];
    };
    
    NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];
    [self setDeviceConnectedObserver:[notificationCenter addObserverForName:AVCaptureDeviceWasConnectedNotification object:nil queue:nil usingBlock:deviceConnectedBlock]];
    [self setDeviceDisconnectedObserver:[notificationCenter addObserverForName:AVCaptureDeviceWasDisconnectedNotification object:nil queue:nil usingBlock:deviceDisconnectedBlock]];
    [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
    [notificationCenter addObserver:self selector:@selector(deviceOrientationDidChange) name:UIDeviceOrientationDidChangeNotification object:nil];
    self.orientation =  (AVCaptureVideoOrientation)[UIApplication sharedApplication].statusBarOrientation;
}

-(void) setTorchAndFlash {
    // Set torch and flash mode to auto
    if ([[self backFacingCamera] hasFlash]) {
        if ([[self backFacingCamera] lockForConfiguration:nil]) {
            if ([[self backFacingCamera] isFlashModeSupported:AVCaptureFlashModeAuto]) [[self backFacingCamera] setFlashMode:AVCaptureFlashModeAuto];
            [[self backFacingCamera] unlockForConfiguration];
        }
    }
    if ([[self backFacingCamera] hasTorch]) {
        if ([[self backFacingCamera] lockForConfiguration:nil]) {
            if ([[self backFacingCamera] isTorchModeSupported:AVCaptureTorchModeAuto])[[self backFacingCamera] setTorchMode:AVCaptureTorchModeAuto];
            [[self backFacingCamera] unlockForConfiguration];
        }
    }
}


- (BOOL) sessionSetup {
     BOOL success = NO;
    // Init the device inputs
    AVCaptureDeviceInput *newVideoInput = [[AVCaptureDeviceInput alloc] initWithDevice:[self frontFacingCamera] error:nil];
	
    // Setup the still image file output
    AVCaptureStillImageOutput *newStillImageOutput = [[AVCaptureStillImageOutput alloc] init];
    NSDictionary *outputSettings = [[NSDictionary alloc] initWithObjectsAndKeys:
                                    AVVideoCodecJPEG, AVVideoCodecKey,
                                    nil];
    [newStillImageOutput setOutputSettings:outputSettings];
    
    // Create session (use default AVCaptureSessionPresetHigh)
    AVCaptureSession *newCaptureSession = [[AVCaptureSession alloc] init];
    // Add inputs and output to the capture session
    if ([newCaptureSession canAddInput:newVideoInput]) [newCaptureSession addInput:newVideoInput];
    if ([newCaptureSession canAddOutput:newStillImageOutput]) [newCaptureSession addOutput:newStillImageOutput];
    [self setStillImageOutput:newStillImageOutput];
    [self setVideoInput:newVideoInput];
    [self setSession:newCaptureSession];
    success = YES;
    return success;
}


- (BOOL) setCamera:(NSString *)mode{
    BOOL success = NO;
    if ([self cameraCount] < 1) return success;
    NSError *error;
    AVCaptureDeviceInput *newVideoInput;
    AVCaptureDevicePosition position = [[self.videoInput device] position];
   
    int modeOption = ([mode isEqualToString:@"front"]) ? AVCaptureDevicePositionFront : AVCaptureDevicePositionBack;
    if (modeOption == position) return YES;
    if (modeOption == AVCaptureDevicePositionFront)
        newVideoInput = [[AVCaptureDeviceInput alloc] initWithDevice:[self frontFacingCamera] error:&error];
    if (modeOption == AVCaptureDevicePositionBack)
        newVideoInput = [[AVCaptureDeviceInput alloc] initWithDevice:[self backFacingCamera] error:&error];
    if (newVideoInput != nil) {
            [[self session] beginConfiguration];
            [[self session] removeInput:[self videoInput]];
            if ([[self session] canAddInput:newVideoInput]) {
                [[self session] addInput:newVideoInput];
                [self setVideoInput:newVideoInput];
            } else {
                [[self session] addInput:[self videoInput]];
            }
            [[self session] commitConfiguration];
            success = YES;
        }
    else if (error) NSLog(@"error %@", error);
    return success;
}

+ (NSString*) cameraHasPermission {
    AVAuthorizationStatus authStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
    if(authStatus == AVAuthorizationStatusAuthorized) {
        return @"YES";
    } else if(authStatus == AVAuthorizationStatusDenied){
        return @"NO";
    } else if(authStatus == AVAuthorizationStatusRestricted){
        return @"NO";
    } else if(authStatus == AVAuthorizationStatusNotDetermined){
        // Not determined!  I don't think this should ever happen since we request permission already
        [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
            if(granted){
                NSLog(@"Granted access to camera");
            } else {
                NSLog(@"Not granted access to camera");
            }
        }];
        return @"NO";
    }
    return @"NO";
}

- (NSUInteger) cameraCount{ return [[AVCaptureDevice devicesWithMediaType:AVMediaTypeVideo] count];}

- (void) captureStillImage { // needs to have a call back to do it's stuff
    AVCaptureConnection *stillImageConnection = [self connectionWithMediaType:AVMediaTypeVideo fromConnections:[[self stillImageOutput] connections]];
    if (!stillImageConnection) {
        [ScratchJr reportImageError];
        return;
    }
    if ([stillImageConnection isVideoOrientationSupported])
        [stillImageConnection setVideoOrientation:self.orientation];
    [[self stillImageOutput] captureStillImageAsynchronouslyFromConnection:stillImageConnection
        completionHandler:^(CMSampleBufferRef imageDataSampleBuffer, NSError *error) {
            if (imageDataSampleBuffer != NULL) {
                NSData *imageData = [AVCaptureStillImageOutput jpegStillImageNSDataRepresentation:imageDataSampleBuffer];
                [ScratchJr sendBase64Image:imageData];
                }
            else {
                NSLog(@" imaged reportImageError");
                [ScratchJr reportImageError];
            }

    }];
}

#pragma mark Camera Properties
// Perform an auto focus at the specified point. The focus mode will automatically change to locked once the auto focus is complete.
- (void) autoFocusAtPoint:(CGPoint)point{
    AVCaptureDevice *device = [[self videoInput] device];
    if ([device isFocusPointOfInterestSupported] && [device isFocusModeSupported:AVCaptureFocusModeAutoFocus]) {
        NSError *error;
        if ([device lockForConfiguration:&error]) {
            [device setFocusPointOfInterest:point];
            [device setFocusMode:AVCaptureFocusModeAutoFocus];
            [device unlockForConfiguration];
        }
        else NSLog(@" autoFocusAtPoint  error");
    }
}

// Switch to continuous auto focus mode at the specified point
- (void) continuousFocusAtPoint:(CGPoint)point {
    AVCaptureDevice *device = [[self videoInput] device];
	
    if ([device isFocusPointOfInterestSupported] && [device isFocusModeSupported:AVCaptureFocusModeContinuousAutoFocus]) {
		NSError *error;
		if ([device lockForConfiguration:&error]) {
			[device setFocusPointOfInterest:point];
			[device setFocusMode:AVCaptureFocusModeContinuousAutoFocus];
			[device unlockForConfiguration];
		}
        else NSLog(@" continuousFocusAtPoint  error");
	}
}

- (AVCaptureConnection *)connectionWithMediaType:(NSString *)mediaType fromConnections:(NSArray *)connections{
	for ( AVCaptureConnection *connection in connections ) {
		for ( AVCaptureInputPort *port in [connection inputPorts] ) {
			if ( [[port mediaType] isEqual:mediaType] ) {
				return connection;
			}
		}
	}
	return nil;
}

@end

@implementation ViewFinder (InternalUtilityMethods)

- (void)deviceOrientationDidChange{
 //   NSLog(@"deviceOrientationDidChange");
	UIDeviceOrientation deviceOrientation = [[UIDevice currentDevice] orientation];    
	if (deviceOrientation == UIDeviceOrientationPortrait) return;
	else if (deviceOrientation == UIDeviceOrientationPortraitUpsideDown) return;	
    if (deviceOrientation == UIDeviceOrientationLandscapeLeft)
		self.orientation = AVCaptureVideoOrientationLandscapeRight;
	else if (deviceOrientation == UIDeviceOrientationLandscapeRight)
		self.orientation = AVCaptureVideoOrientationLandscapeLeft;
}

// Find a camera with the specificed AVCaptureDevicePosition, returning nil if one is not found
- (AVCaptureDevice *) cameraWithPosition:(AVCaptureDevicePosition) position {
    NSArray *devices = [AVCaptureDevice devicesWithMediaType:AVMediaTypeVideo];
    for (AVCaptureDevice *device in devices) {
        if ([device position] == position) {
            return device;
        }
    }
    return nil;
}


// Find a front facing camera, returning nil if one is not found
- (AVCaptureDevice *) frontFacingCamera{return [self cameraWithPosition:AVCaptureDevicePositionFront];}

// Find a back facing camera, returning nil if one is not found
- (AVCaptureDevice *) backFacingCamera{return [self cameraWithPosition:AVCaptureDevicePositionBack];}


@end
