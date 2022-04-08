#import "ScratchJr.h"
#import "AppDelegate.h"

ViewFinder* viewFinder;
CameraView* cameraView;
CameraMask* cameraMask;
NSString *cameraAvailable;

// prepare for opening multiple files
NSMutableArray *zipUrls;
bool appReady = false;

AVCaptureVideoPreviewLayer* captureVideoPreviewLayer;

@implementation ScratchJr : NSObject

static NSInteger _assetLibraryVersion = 0;

+ (NSInteger) assetLibraryVersion {
    return _assetLibraryVersion;
}

+ (void) setAssetLibraryVersion:(NSInteger)newValue {
    _assetLibraryVersion = newValue;
}

NSString *oncomplete;

NSMutableSet *assets;

//////////////////////////
// Init functions
/////////////////////////

+ (NSString *) hideSplash :(NSString *)body{
    UIImageView* splashScreen = [ViewController splashScreen];
    appReady = true;
    dispatch_async(dispatch_get_main_queue(), ^{
        [splashScreen removeFromSuperview];
    });
    // import projects
    if (zipUrls != nil) {
        while (zipUrls.count > 0) {
            NSURL *url = zipUrls[0];
            [zipUrls removeObjectAtIndex:0];
            [ScratchJr importProject:url];
        }
    }
    return @"1";
}

+ (void) receiveProject:(NSURL *)url {
    if (zipUrls == nil) {
        zipUrls = [[NSMutableArray alloc] init];
    }
    if (appReady) {
        [ScratchJr importProject:url];
    } else {
        [zipUrls addObject:url];
    }
}

+ (void) importProject:(NSURL *) url {
    NSLog(@"importing project at %@", url.absoluteString);
    dispatch_async(dispatch_get_main_queue(), ^{
        [IO receiveProject:url];
    });
}

//////////////////////////
// camera open and close
/////////////////////////

+ (void)cameraInit{
    viewFinder = [[ViewFinder alloc] init];
    [viewFinder setDelegate:[ViewController self]];
    cameraAvailable = [NSString stringWithFormat:@"%d", [viewFinder setupSession]];
    NSLog(@"camera init %@", cameraAvailable);
};

+ (void)cameraClose{
    if (viewFinder != nil) [viewFinder closeSession];
}

//////////////////////////
// camera API
/////////////////////////


+ (NSString *)cameracheck{ return cameraAvailable; }


+ (NSString *)startfeed:(NSString *)body{
    NSData* nsdata = [body dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary* data = [NSJSONSerialization JSONObjectWithData:nsdata options:NSJSONReadingMutableLeaves error:nil];
    //   NSLog(@" data %@", data);
    NSURL *url = [NSURL URLWithString:[data valueForKey:@"image"]];
    NSData *imageData = [NSData dataWithContentsOfURL:url];
    
    CGRect r = CGRectMake ([[data valueForKey:@"x"] floatValue],[[data valueForKey:@"y"] floatValue],
                           [[data valueForKey:@"width"] floatValue],  [[data valueForKey:@"height"] floatValue]);
    
    CGRect r2 = CGRectMake ([[data valueForKey:@"mx"] floatValue],[[data valueForKey:@"my"] floatValue],
                            [[data valueForKey:@"mw"] floatValue],  [[data valueForKey:@"mh"] floatValue]);
    
    [self openfeed:r withScale:[[data valueForKey:@"scale"] floatValue] mask:imageData maskrect:r2];
    return @"1";
};

+ (void)openfeed:(CGRect)rect withScale:(float)scale mask:(NSData *)imageData maskrect:(CGRect)rect2{
    UIView* HTML = (UIView*)[ViewController webview];
    captureVideoPreviewLayer = [[AVCaptureVideoPreviewLayer alloc] initWithSession:[viewFinder session]];
    cameraView = [[CameraView alloc] initWithFrame:rect withScale:scale];
    [HTML addSubview:cameraView];
    cameraMask = [[CameraMask alloc]initWithFrame:rect2 withScale:scale mask:imageData];
    [HTML addSubview: cameraMask];
    [cameraView switchOrientation:[UIApplication sharedApplication].statusBarOrientation];
    CALayer *viewLayer = [cameraView layer];
    [viewLayer setMasksToBounds:YES];
    CGRect bounds = [cameraView bounds];
    [captureVideoPreviewLayer setFrame:bounds];
    [captureVideoPreviewLayer setVideoGravity:AVLayerVideoGravityResizeAspectFill];
    captureVideoPreviewLayer.position=CGPointMake(CGRectGetMidX(bounds), CGRectGetMidY(bounds));
    [viewLayer insertSublayer:captureVideoPreviewLayer below:[[viewLayer sublayers] objectAtIndex:0]];
    // Start the session. This is done asychronously since -startRunning doesn't return until the session is running.
   // dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    [viewFinder setCamera:@"front"];
    [[viewFinder session] startRunning];
    [viewFinder continuousFocusAtPoint:CGPointMake(.5f, .5f)];
   // });
}

+ (NSString *)stopfeed{
    [self closefeed];
    return @"1";
}

+ (NSString *)choosecamera:(NSString *)body{
    if (viewFinder == nil) return @"-1";
    NSArray *args = [body componentsSeparatedByString: @"\n"];
    [cameraView setCameraTo: [args objectAtIndex:0]];
    BOOL res = [viewFinder setCamera:[args objectAtIndex:0]];
    return res ? @"1" : @"-1";
};

+ (NSString *)captureimage:(NSString *)oc{
    [viewFinder captureStillImage];
    oncomplete = oc;
    return @"1";
}

//////////////////////////
// camera callback
/////////////////////////

+ (void)reportImageError {
    NSString *callback = [NSString stringWithFormat: @"%@('error getting a still');",oncomplete];
    WKWebView *webview = [ViewController webview];
    
    dispatch_async(dispatch_get_main_queue(), ^{
        [webview evaluateJavaScript:callback completionHandler:nil];
    });
}

+ (void)sendBase64Image:(NSData *)imagedata {
    NSString *base64img = [cameraView getImageBase64:imagedata];
    [self closefeed];
    NSString *callback = [NSString stringWithFormat: @"%@('%@');",oncomplete, base64img];
    WKWebView *webview = [ViewController webview];
    dispatch_async(dispatch_get_main_queue(), ^{
        [webview evaluateJavaScript:callback completionHandler:nil];
    });
}

+ (void)closefeed{
    [[viewFinder session] stopRunning];
    [cameraView removeFromSuperview];
    [cameraMask removeFromSuperview];
    captureVideoPreviewLayer = nil;
    cameraView = nil;
    cameraMask = nil;
}

+ (void) registerLibraryAssets: (NSArray<NSString *> *)assetArr {
    if (assets == nil) {
        assets = [[NSMutableSet alloc] init];
    }
    for (NSString* md5 in assetArr) {
        [assets addObject:md5];
    }
}

+ (BOOL) libraryHasAsset:(NSString *)md5 {
    return [assets containsObject:md5];
}

@end
