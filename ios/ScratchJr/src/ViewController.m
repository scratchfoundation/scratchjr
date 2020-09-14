#import "ScratchJr.h"
#import <WebKit/WebKit.h>
// @import MessageUI;
@import Firebase;

WKWebView *webview;
NSDate* startDate;
UIImageView *splashScreen;
NSDate *startDate;

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

    webview = [[WKWebView alloc] initWithFrame:CGRectZero configuration:[self webViewConfig]];
    webview.backgroundColor = UIColor.blackColor;
    webview.navigationDelegate = self;
    self.view = webview;
    [self registerDefaultsFromSettingsBundle];

    // disable webview scroll
    // to fix https://github.com/LLK/scratchjr/issues/243
    webview.scrollView.scrollEnabled = false;

    [Database open:@"ScratchJr"];
    [ScratchJr cameraInit];
    [self reload];
    [self showSplash];
    [IO init: self];
    [[UIApplication sharedApplication] setStatusBarHidden:YES withAnimation:NO];
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];
}

- (WKWebViewConfiguration*) webViewConfig {
    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    config.allowsInlineMediaPlayback = true;
    config.allowsAirPlayForMediaPlayback = true;
    [config.preferences setValue:@YES forKey:@"allowFileAccessFromFileURLs"];

    WKUserContentController *controller = [[WKUserContentController alloc] init];
    [controller addScriptMessageHandler:[[JsBridge alloc] init] name:@"jsBridge"];
    config.userContentController = controller;
    return config;
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

+ (WKWebView*) webview {return webview;}
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
    [[NSUserDefaults standardUserDefaults] registerDefaults:defaultsToRegister];
}

- (void)reload {
    WKWebView *webview = (WKWebView*)[self view];
    NSString *location = [[NSUserDefaults standardUserDefaults] stringForKey:@"html"];
    if ([location length] > 3) location = [location substringFromIndex:3];
    NSString *path = [[NSBundle mainBundle]  pathForResource: @"HTML5/index" ofType:@"html"];
    NSURL *url = [NSURL fileURLWithPath:path];
    NSURLRequest* request = [NSURLRequest requestWithURL:url];
    [[NSURLCache sharedURLCache] removeAllCachedResponses];
    [webview loadRequest:request];
}

- (void)viewWillAppear:(BOOL)animated{[super viewWillAppear:animated];}

- (void)viewDidAppear:(BOOL)animated{
    [super viewDidAppear:animated];
    startDate = [NSDate date];
}

// Disables iOS 9 webview touch tooltip by disabling the long-press gesture recognizer in subviews
// Thanks to Rye:
// http://stackoverflow.com/questions/32687368/how-to-completely-disable-magnifying-glass-for-uiwebview-ios9
- (void) disableWebViewLongPressGestures:(WKWebView *)webview {
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

- (void) receiveProject:(NSString *)project{
    NSString *callback = [NSString stringWithFormat:@"OS.loadProjectFromSjr('%@');", project];
    WKWebView *webview = [ViewController webview];
    dispatch_async(dispatch_get_main_queue(), ^{
        [webview evaluateJavaScript:callback completionHandler:^(id result, NSError * _Nullable error) {
            if (error != nil) {
                return;
            }
            NSString *res = [NSString stringWithFormat:@"%@", result];
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
        }];
    });
}

- (BOOL)prefersStatusBarHidden{
    return YES;
}

// WKNavigationDelegate

- (void) webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
    [webview evaluateJavaScript:@"window.tablet = window.webkit.messageHandlers.jsBridge" completionHandler:nil];
    [self disableWebViewLongPressGestures:webView];

    NSString *debugChoice =[[NSUserDefaults standardUserDefaults] stringForKey:@"debugstate"];

    // Patch through app "advanced"->debug to allow users to display long-form errors when projects fail to load
    if (![debugChoice isEqualToString:@""] && ![debugChoice isEqualToString:@"0"]) {
        [webView evaluateJavaScript:@"window.reloadDebug = true;" completionHandler:nil];
    }

    NSURL* screenName = webView.URL.filePathURL;
    NSString* screenString =[screenName absoluteString];
    NSArray<NSString*>* parts = [screenString componentsSeparatedByString:@"/"];
    NSString* page = [[[parts lastObject] componentsSeparatedByString:@"?"] firstObject];

    // Track pageview in Firebase?
    [FIRAnalytics setScreenName:page screenClass:NULL];
}

- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error {
    NSLog(@"could not load the website caused by error DESC: %@", error);
    NSDictionary *userInfo = [error userInfo];
    NSString *desc = [NSString stringWithFormat:@"%@", ([userInfo objectForKey: @"NSLocalizedDescription"] == NULL)? [error localizedDescription]: [userInfo objectForKey: @"NSLocalizedDescription"]];
    NSString *callback = [NSString stringWithFormat: @"iOS.pageError('%@');",desc];
    WKWebView *webview = [ViewController webview];
    dispatch_async(dispatch_get_main_queue(), ^{
        [webview evaluateJavaScript:callback completionHandler:nil];
    });
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
