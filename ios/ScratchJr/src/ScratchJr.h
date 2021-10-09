#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import <MessageUI/MessageUI.h>
#import <JavaScriptCore/JavaScriptCore.h>
#import <WebKit/WebKit.h>

@interface Database : NSObject

+ (NSString *)open:(NSString *)body;
+ (NSString *)close:(NSString *)str;
+ (void)initTables;
+ (void)runMigrations;
+ (NSArray *)findDataIn:(NSString *)stmtstr with:(NSArray *)values;

// Exports
+ (NSString *)stmt:(NSString *)json;
+ (NSString *)query:(NSString *)json;
+ (NSString *)insert:(NSString *)table with:(NSDictionary *)data;
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
@interface ViewController : UIViewController <MFMailComposeViewControllerDelegate, WKNavigationDelegate>
+ (WKWebView *)webview;
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

@interface JsBridge: NSObject <WKScriptMessageHandler>

@property(weak, nonatomic) ViewController *controller;

@end

@interface JsRequest : NSObject

@property(nonatomic, readwrite) NSString* callId;
@property(nonatomic, readwrite) NSString* method;
@property(nonatomic, readwrite) NSArray* params;

- (instancetype) initWithDictionary: (NSDictionary *)dictionary;

- (void) callback: (NSString *) res;

@end

@interface IO : NSObject

+ (void)init:(ViewController*)vc;
+ (NSString *)getpath;
+ (NSString *)removeFile:(NSString *)str;
+ (NSURL *)getDocumentPath:(NSString *)name;
+ (NSURL *)getTmpPath:(NSString *)name;
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
+ (NSString *)createZipForProject: (NSString *)projectData :(NSDictionary *)metadata :(NSString *)name;
+ (NSString *)sendSjrUsingShareDialog:(NSString *)fileName
                                     :(NSString *)emailSubject
                                     :(NSString *)emailBody
                                     :(int)shareType;
+ (void) receiveProject: (NSURL *) url;
+ (NSString *)registerSound:(NSString *)dir :(NSString *)name;
+ (NSString *)playSound:(NSString *)name;
+ (NSString *)stopSound:(NSString *)name;
@end

@interface ScratchJr : NSObject

@property (class, nonatomic, assign) NSInteger assetLibraryVersion;

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

// Imports
+ (void) receiveProject:(NSURL *) url;

+ (void) registerLibraryAssets: (NSArray<NSString *> *)assets;
+ (BOOL) libraryHasAsset: (NSString *)md5;
@end
