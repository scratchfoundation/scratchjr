#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import <MessageUI/MessageUI.h>
#import <JavaScriptCore/JavaScriptCore.h>

@interface Database : NSObject

+ (NSString *)open:(NSString *)body;
+ (NSString *)close:(NSString *)str;
+ (void)initTables;
+ (void)runMigrations;
+ (NSArray *)findDataIn:(NSString *)stmtstr with:(NSArray *)values;

// Exports
+ (NSString *)stmt:(NSString *)json;
+ (NSString *)query:(NSString *)json;
@end

@interface CameraMask : UIView

-(id)initWithFrame:(CGRect)frame withScale:(float)scale mask:(NSData *)imageData;

@end

@interface CameraView : UIView

@property float xcoor;
@property float ycoor;
@property float scale;
@property NSString *usingCamera;

- (void)switchOrientation:(int)orientation;
- (id)initWithFrame:(CGRect)frame withScale:(float)scale;
- (void)setCameraTo:(NSString *)dir;
- (NSString *)getImageBase64:(NSData *)imgdata;

@end

@protocol ViewFinderDelegate;

@interface ViewFinder : NSObject {
}

@property AVCaptureSession *session;
@property id <ViewFinderDelegate> delegate;
@property AVCaptureVideoOrientation orientation;
@property AVCaptureDeviceInput *videoInput;
@property id deviceConnectedObserver;
@property id deviceDisconnectedObserver;
@property AVCaptureStillImageOutput *stillImageOutput;


- (BOOL)setupSession;
+ (NSString *)cameraHasPermission;
- (void)closeSession;
- (NSUInteger)cameraCount;
- (BOOL)setCamera:(NSString *)mode;
- (AVCaptureConnection *)connectionWithMediaType:(NSString *)mediaType fromConnections:(NSArray *)connections;
- (void)captureStillImage;
- (void)autoFocusAtPoint:(CGPoint)point;
- (void)continuousFocusAtPoint:(CGPoint)point;

@end

// These delegate methods can be called on any arbitrary thread. If the delegate does something with the UI when called, make sure to send it to the main thread.
@protocol ViewFinderDelegate <NSObject>
@optional
- (void)viewFinderStillImageCaptured:(ViewFinder *)viewFinder;
- (void)viewFinderDeviceConfigurationChanged:(ViewFinder *)viewFinder;
- (void)deviceOrientationDidChange;

@end

@interface RecordSound : NSObject
+ (NSString *)getPermission;
+ (void)setPermission;
+ (void)killRecording;
// Exports
+ (NSString *)startRecord;
+ (NSString *)stopRecording;
+ (double)getVolume;
+ (NSString *)startPlay;
+ (NSString *)stopPlay;
+ (NSString *)recordclose:(NSString *)keep;
@end

@protocol JSExports <JSExport>
/* Functions exported to JavaScript */
- (NSString *)hideSplash:(NSString *)body;
- (void) askForPermission;
- (NSString *)database_stmt:(NSString *) json;
- (NSString *)database_query:(NSString *) json;
- (NSString *)io_getmd5:(NSString *) str;
- (NSString *)io_getsettings;
- (void)io_cleanassets:(NSString *)fileType;
- (NSString *)io_setfile:(NSString *)filename :(NSString *)base64ContentStr;
- (NSString *)io_getfile:(NSString *)filename;
- (NSString *)io_setmedia:(NSString *)base64ContentStr :(NSString *)extension;
- (NSString *)io_setmedianame:(NSString *)contents :(NSString *)key :(NSString *)ext;
- (NSString *)io_getmedia:(NSString *)filename;
- (NSString *)io_getmediadata:(NSString *)filename :(int)offset :(int)length;
- (NSString *)io_getmedialen:(NSString *)file :(NSString *)key;
- (NSString *)io_getmediadone:(NSString *)filename;
- (NSString *)io_remove:(NSString *)filename;
- (NSString *)io_registersound:(NSString *)dir :(NSString *)name;
- (NSString *)io_playsound:(NSString *)name;
- (NSString *)io_stopsound:(NSString *)name;

- (NSString *)recordsound_recordstart;
- (NSString *)recordsound_recordstop;
- (NSString *)recordsound_volume;
- (NSString *)recordsound_startplay;
- (NSString *)recordsound_stopplay;
- (NSString *)recordsound_recordclose:(NSString *)keep;

- (NSString *)scratchjr_cameracheck;
- (bool) scratchjr_has_multiple_cameras;
- (NSString *)scratchjr_startfeed:(NSString *)str;
- (NSString *)scratchjr_stopfeed;
- (NSString *)scratchjr_choosecamera:(NSString *)body;
- (NSString *)scratchjr_captureimage:(NSString *)onCameraCaptureComplete;
- (NSString *)sendSjrUsingShareDialog:(NSString *)fileName
                                     :(NSString *)emailSubject
                                     :(NSString *)emailBody
                                     :(int)shareType
                                     :(NSString *)b64data;
- (NSString *) deviceName;
- (NSString *) analyticsEvent:(NSString *)category :(NSString *)action :(NSString *)label;
- (void) setAnalyticsPlacePref:(NSString *)place;
@end

@interface ViewController : UIViewController <JSExports,UIWebViewDelegate,MFMailComposeViewControllerDelegate>
@property (nonatomic, readwrite, strong) JSContext *js;
+ (UIWebView *)webview;
+ (UIImageView *)splashScreen;
- (void)receiveProject:(NSString *)project;
- (void)registerDefaultsFromSettingsBundle;
- (void)reload;
@end

@interface ViewController (ViewFinderDelegate) <ViewFinderDelegate>
- (void)showShareEmail:(NSURL *)projectURL
              withName:(NSString *)name
           withSubject:(NSString *)subject
              withBody:(NSString *)body;
- (void)showShareAirdrop:(NSURL *)projectURL;
@end


@interface IO : NSObject

+ (void)init:(ViewController*)vc;
+ (NSString *)getpath;
+ (NSString *)removeFile:(NSString *)str;
+ (NSURL *)getDocumentPath:(NSString *)name;
+ (NSString *)encodeBase64:(NSData *)theData;

// Exports
+ (NSString *)getMD5:(NSString *)str;
+ (NSString *)getsettings;
+ (void) cleanassets:(NSString *)fileType;
+ (NSString *)setfile:(NSString *)filename :(NSString *)base64ContentStr;
+ (NSString *)getfile:(NSString *)filename;
+ (NSString *)setmedia:(NSString *)base64ContentStr :(NSString *)extension;
+ (NSString *)setmedianame:(NSString *)contents :(NSString *)key :(NSString *)ext;
+ (NSString *)getmedia:(NSString *)filename;
+ (NSString *)getmediadata:(NSString *)filename :(int)offset :(int)length;
+ (NSString *)getmedialen:(NSString *)file :(NSString *)key;
+ (NSString *)getmediadone:(NSString *)filename;
+ (NSString *)remove:(NSString *)filename;
+ (NSString *)sendSjrUsingShareDialog:(NSString *)fileName
                                     :(NSString *)emailSubject
                                     :(NSString *)emailBody
                                     :(int)shareType
                                     :(NSString *)b64data;
+ (NSString *)registerSound:(NSString *)dir :(NSString *)name;
+ (NSString *)playSound:(NSString *)name;
+ (NSString *)stopSound:(NSString *)name;
@end

@interface ScratchJr : NSObject

+ (void)sendBase64Image:(NSData *)imagedata;
+ (void)reportImageError;
+ (void)cameraInit;
+ (void)cameraClose;
+ (NSString *)hideSplash :(NSString *)body;

// Exports
+ (NSString *)cameracheck;
+ (NSString *)startfeed:(NSString *)str;
+ (NSString *)stopfeed;
+ (NSString *)choosecamera:(NSString *)body;
+ (NSString *)captureimage:(NSString *)onCameraCaptureComplete;
@end
