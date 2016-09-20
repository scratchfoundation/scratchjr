#import "ScratchJr.h"
#import <Google/Analytics.h>
// @import MessageUI;


UIWebView *webview;
NSDate* startDate;
UIImageView *splashScreen;
NSDate *startDate;
JSContext *js;

@interface ViewController ()

@end

@implementation ViewController

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    [self registerDefaultsFromSettingsBundle];
    webview = (UIWebView*)[self view] ;
    [webview setDelegate:self];
    [Database open:@"ScratchJr"];
    [ScratchJr cameraInit];
    [self reload];
    [self showSplash];
    [IO init: self];
    [[UIApplication sharedApplication] setStatusBarHidden:YES withAnimation:NO];
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];
}

- (void) showSplash {
    UIImage *loadingImage = [UIImage imageNamed:@"Default-Landscape~ipad.png"];
    splashScreen = [[UIImageView alloc] initWithImage:loadingImage];
    splashScreen.animationImages = [NSArray arrayWithObjects:
                                    [UIImage imageNamed:@"Default.png"],
                                    nil];
    [self.view addSubview:splashScreen];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

+ (UIWebView*) webview {return webview;}
+ (UIImageView*) splashScreen {return splashScreen;}

- (void)registerDefaultsFromSettingsBundle {
    NSString *settingsBundle = [[NSBundle mainBundle] pathForResource:@"Settings" ofType:@"bundle"];
    //root list
    NSDictionary *settings = [NSDictionary dictionaryWithContentsOfFile:[settingsBundle stringByAppendingPathComponent:@"Root.plist"]];
    NSArray *preferences = [settings objectForKey:@"PreferenceSpecifiers"];
    NSDictionary *pagesettings = [NSDictionary dictionaryWithContentsOfFile:[settingsBundle stringByAppendingPathComponent:@"Debug.plist"]];
    NSArray *preferences2 = [pagesettings objectForKey:@"PreferenceSpecifiers"];
    NSMutableDictionary *defaultsToRegister = [[NSMutableDictionary alloc] initWithCapacity:[preferences count] + [preferences2 count]];
    for(NSDictionary *prefSpecification in preferences) {
        NSString *key = [prefSpecification objectForKey:@"Key"];
        if(key) {
            [defaultsToRegister setObject:[prefSpecification objectForKey:@"DefaultValue"] forKey:key];
        }
    }
    for(NSDictionary *prefSpecification in preferences2) {
        NSString *key = [prefSpecification objectForKey:@"Key"];
        if(key) {
            [defaultsToRegister setObject:[prefSpecification objectForKey:@"DefaultValue"] forKey:key];
        }
    }
  //  NSLog(@"defaultsToRegister %@", defaultsToRegister);
    [[NSUserDefaults standardUserDefaults] registerDefaults:defaultsToRegister];
}

- (void)reload {
    UIWebView *webview = (UIWebView*)[self view];
    NSString *location = [[NSUserDefaults standardUserDefaults] stringForKey:@"html"];
    if ([location length] > 3) location = [location substringFromIndex:3];
    NSString *path = [[NSBundle mainBundle]  pathForResource: @"HTML5/index" ofType:@"html"];
    NSURL *url = [NSURL URLWithString: [path stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
    NSURLRequest* request = [NSURLRequest requestWithURL:url];
    [[NSURLCache sharedURLCache] removeAllCachedResponses];
    [webview loadRequest:request];
}

- (void)viewWillAppear:(BOOL)animated{[super viewWillAppear:animated];}

- (void)viewDidAppear:(BOOL)animated{
    [super viewDidAppear:animated];
    startDate = [NSDate date];
}

// UIWebView delegate methods

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType{
    //read your request here
    //before the webview will load your request
    return YES;
}

- (void)webViewDidStartLoad:(UIWebView *)webView{
    //access your request
}

- (void)webViewDidFinishLoad:(UIWebView *)webView{
    // Inject a reference for the dispatch method into the UIWebView
    // This happens after the page is loaded and the page's onLoad method is called
    js = [webView valueForKeyPath:@"documentView.webView.mainFrame.javaScriptContext"];
    js[@"tablet"] = self;
    [self disableWebViewLongPressGestures:webView];

    NSString *debugChoice =[[NSUserDefaults standardUserDefaults] stringForKey:@"debugstate"];

    // Patch through app "advanced"->debug to allow users to display long-form errors
    if (![debugChoice isEqualToString:@""] && ![debugChoice isEqualToString:@"0"]) {
        [webView stringByEvaluatingJavaScriptFromString:@"window.reloadDebug = true;"];
    }

    NSURL* screenName = webView.request.URL.filePathURL;
    NSString* screenString =[screenName absoluteString];
    NSArray<NSString*>* parts = [screenString componentsSeparatedByString:@"/"];

    // Track an Analytics pageview
    id<GAITracker> tracker = [[GAI sharedInstance] defaultTracker];
    [tracker set:kGAIScreenName value:[parts lastObject]];
    [tracker send:[[GAIDictionaryBuilder createScreenView] build]];

}

// Disables iOS 9 webview touch tooltip by disabling the long-press gesture recognizer in subviews
// Thanks to Rye:
// http://stackoverflow.com/questions/32687368/how-to-completely-disable-magnifying-glass-for-uiwebview-ios9
- (void) disableWebViewLongPressGestures:(UIWebView *)webview {
    for(id subView in webview.subviews) {
        if([subView isKindOfClass:[UIScrollView class]]) {
            UIScrollView *scrollView = (UIScrollView *)subView;
            for(id ssView in scrollView.subviews) {
                if([NSStringFromClass([ssView class]) isEqualToString:@"UIWebBrowserView"]) {
                    for(UIGestureRecognizer *gs in [ssView gestureRecognizers]) {
                        if ([gs isKindOfClass:[UILongPressGestureRecognizer class]])
                        {
                            gs.enabled = NO;
                        }
                    }
                }
            }
        }
    }
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error{
    NSLog(@"could not load the website caused by error DESC: %@", error);
    NSDictionary *userInfo = [error userInfo];
    NSString *desc = [NSString stringWithFormat:@"%@", ([userInfo objectForKey: @"NSLocalizedDescription"] == NULL)? [error localizedDescription]: [userInfo objectForKey: @"NSLocalizedDescription"]];
    NSString *callback = [NSString stringWithFormat: @"iOS.pageError('%@');",desc];
    UIWebView *webview = [ViewController webview];
    dispatch_async(dispatch_get_main_queue(), ^{
        [webview stringByEvaluatingJavaScriptFromString: callback];
    });
}

- (void) receiveProject:(NSString *)project{
    NSString *callback = [NSString stringWithFormat:@"iOS.loadProjectFromSjr('%@');", project];
    UIWebView *webview = [ViewController webview];
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *res = [webview stringByEvaluatingJavaScriptFromString:callback];
        if ([res isEqualToString:@"1"]) {
            // Success
            return;
        } else if ([res isEqualToString:@"0"]) {
            // Processing error
            return;
        } else {
            // Loading the project failed - reschedule for a time when the WebView has hopefully loaded
            // A little bit roundabout, but simpler than queueing projects to be loaded
            [self performSelector:@selector(receiveProject:) withObject:project afterDelay:2.0];
        }
    });
}

- (BOOL)prefersStatusBarHidden{
    return YES;
}

/*
* JavaScript Interface Exports
*/

-(void) askForPermission {
    [RecordSound setPermission];
}

-(NSString*) database_stmt: (NSString*) json {
    return [Database stmt:json];
}

-(NSString*) database_query: (NSString*) json {
    return [Database query:json];
}

-(NSString*) io_getmd5: (NSString*) str {
    return [IO getMD5:str];
}

-(NSString*) io_getsettings {
    return [IO getsettings];
}

-(void) io_cleanassets:(NSString*) fileType {
    [IO cleanassets:fileType];
}

-(NSString*) io_setfile:(NSString*)filename :(NSString*)base64ContentStr {
    return [IO setfile:filename:base64ContentStr];
}

-(NSString*) io_getfile:(NSString*)filename {
    return [IO getfile:filename];
}

-(NSString*) io_setmedia:(NSString*) base64ContentStr :(NSString*) extension {
    return [IO setmedia:base64ContentStr:extension];
}

-(NSString*) io_setmedianame:(NSString*) contents :(NSString*) key :(NSString*) ext {
    return [IO setmedianame:contents:key:ext];
}

-(NSString*) io_getmedia:(NSString*) filename {
    return [IO getmedia:filename];
}

-(NSString*) io_getmediadata:(NSString*)filename :(int) offset :(int) length {
    return [IO getmediadata:filename:offset:length];
}

-(NSString*) io_getmedialen:(NSString*)file :(NSString*)key {
    return [IO getmedialen:file:key];
}

-(NSString*) io_getmediadone:(NSString*)filename {
    return [IO getmediadone:filename];
}

-(NSString*) io_remove:(NSString*)filename {
    return [IO remove:filename];
}

-(NSString*) recordsound_recordstart {
    return [RecordSound startRecord];
}
-(NSString*) recordsound_recordstop {
    return [RecordSound stopRecording];
}
-(NSString*) recordsound_volume {
    return [NSString stringWithFormat:@"%f", [RecordSound getVolume]];
}
-(NSString*) recordsound_startplay {
    return [RecordSound startPlay];
}
-(NSString*) recordsound_stopplay {
    return [RecordSound stopPlay];
}
-(NSString*) recordsound_recordclose:(NSString*) keep {
    return [RecordSound recordclose:keep];
}

-(NSString*) scratchjr_cameracheck {
    return [ScratchJr cameracheck];
}
-(bool) scratchjr_has_multiple_cameras {
    return YES;
}
-(NSString*) scratchjr_startfeed:(NSString*)str {
    return [ScratchJr startfeed:str];
}
-(NSString*) scratchjr_stopfeed {
    return [ScratchJr stopfeed];
}

-(NSString*) scratchjr_choosecamera:(NSString *)body {
    return [ScratchJr choosecamera:body];
}

-(NSString*) scratchjr_captureimage: (NSString*)onCameraCaptureComplete {
    return [ScratchJr captureimage:onCameraCaptureComplete];
}

//iOS.sendSjrToShareDialog = function(fileName, emailSubject, emailBody, shareType, b64data) {

-(NSString*) sendSjrUsingShareDialog:(NSString*) fileName :(NSString*) emailSubject :(NSString*) emailBody :(int) shareType :(NSString*) b64data {
    return [IO sendSjrUsingShareDialog:fileName :emailSubject :emailBody :shareType : b64data];
}

- (NSString *) hideSplash :(NSString *)body {
    return [ScratchJr hideSplash:body];
}

-(NSString*) analyticsEvent:(NSString*) category :(NSString*) action :(NSString*) label :(NSNumber*) value {
    id<GAITracker> tracker = [[GAI sharedInstance] defaultTracker];
    [tracker send:[[GAIDictionaryBuilder createEventWithCategory:category
        action:action
       label:label
       value:value] build]];
    return @"1";
}

// iPad name (used for information in the name/sharing dialog to help people using Airdrop)
- (NSString*) deviceName {
    return [[UIDevice currentDevice] name];
}


// Sharing controllers - if we later decide to unify, use UIActivityViewController

// Email sharing
- (void) showShareEmail:(NSURL *) projectURL withName: (NSString*) name withSubject:(NSString*) subject withBody:(NSString*)body {
    dispatch_async(dispatch_get_main_queue(), ^{
        MFMailComposeViewController *mailComposeViewController = [[MFMailComposeViewController alloc] init];
        mailComposeViewController.mailComposeDelegate = self;

        NSString* filename = name;

        [mailComposeViewController setSubject: subject];
        [mailComposeViewController setMessageBody:body isHTML:YES];

         NSData *projectData = [NSData dataWithContentsOfURL:projectURL];

        NSString* mimeType = @"application/x-scratchjr-project";

        #if PBS
            mimeType = @"application/x-pbskids-scratchjr-project";
        #endif

        // Check to ensure modal is not nil. This can occur when the user does not have a mail account configured on their device
        if (mailComposeViewController == nil) return;

        [mailComposeViewController addAttachmentData:projectData mimeType:mimeType fileName:filename];
        [self presentViewController:mailComposeViewController animated:YES completion:nil];
    });
}

- (void)mailComposeController:(MFMailComposeViewController*)controller didFinishWithResult:(MFMailComposeResult)result error:(NSError*)error {
    [self dismissViewControllerAnimated:YES completion:nil];
}


// Airdrop sharing
- (void) showShareAirdrop:(NSURL *) projectURL {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSArray *objectsToShare = @[projectURL];

        UIActivityViewController *activityVC = [[UIActivityViewController alloc] initWithActivityItems:objectsToShare applicationActivities:nil];
        if ( [activityVC respondsToSelector:@selector(popoverPresentationController)] ) {
            activityVC.popoverPresentationController.sourceView = [ViewController webview];
            activityVC.popoverPresentationController.sourceRect = CGRectMake(660, 315, 1, 1);
        }

        activityVC.excludedActivityTypes = @[UIActivityTypeCopyToPasteboard, UIActivityTypeMail, UIActivityTypeMessage];

        [self presentViewController:activityVC animated:YES completion:nil];
    });

}


@end
