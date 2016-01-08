@import Foundation;

/**
 * This class provides configuration details to Google APIs.
 */
@interface GGLConfiguration : NSObject

/**
 * Initializes the configuration with provided details.
 *
 * This is the designated initializer.
 *
 * @param apiKey A secret iOS API key used for authenticating requests from your app, e.g.
 *               @"AIzaSyDdVgKwhZl0sTTTLZ7iTmt1r3N2cJLnaDk", used to identify your app to Google
 *               servers.
 * @param clientID The OAuth2 client ID used to authenticate Google users, for example
 *                 @"12345.apps.googleusercontent.com", used for signing in with Google.
 * @param identityProviders The set of providers used for authentication when presenting or
 *                          configuring authentication options. See |kGGLGoogleIdentityProvider|
 *                          and |kGGLFacebookIdentityProvider|.
 * @param trackingID The tracking ID for Google Analytics, e.g. @"UA-12345678-1", used to configure
 *                   Google Analytics.
 * @param widgetURL Where the GITkit JavaScript widget is hosted. It should be defined in REDIRECT
 *                  URIS of the Client ID for web application.
 * @param bannerAdUnitID Mobile Ads' Ad Unit ID for a banner view, for example
                         @"ca-app-pub-1234567890", used for displaying ads view.
 * @param interstitialAdUnitID Mobile Ads' Ad Unit ID for an interstitial view, for example
 *                             @"ca-app-pub-1234567890", used for displaying ads view.
 * @param gcmSenderID The Project Number from the Google Developer's console,
 *                    for example @"012345678901", used to configure Google Cloud Messaging.
 * @param androidClientID The Android client ID used in Google AppInvite when an iOS app has its
 *                        Android version, for example @"12345.apps.googleusercontent.com".
 */
- (instancetype)initWithAPIKey:(NSString *)apiKey
                      clientID:(NSString *)clientID
             identityProviders:(NSArray *)identityProviders
                    trackingID:(NSString *)trackingID
                     widgetURL:(NSString *)widgetURL
                bannerAdUnitID:(NSString *)bannerAdUnitID
          interstitialAdUnitID:(NSString *)interstitialAdUnitID
                   gcmSenderID:(NSString *)gcmSenderID
               androidClientID:(NSString *)androidClientID;

/**
 * A secret iOS API key used for authenticating requests from your app, e.g.
 * @"AIzaSyDdVgKwhZl0sTTTLZ7iTmt1r3N2cJLnaDk", used to identify your app to Google servers.
 */
@property(nonatomic, readonly, copy) NSString *apiKey;

/**
 * The OAuth2 client ID for iOS application used to authenticate Google users, for example
 * @"12345.apps.googleusercontent.com", used for signing in with Google.
 */
@property(nonatomic, readonly, copy) NSString *clientID;

/**
 * The set of providers used for authentication when presenting or configuring authentication
 * options.  See |kGGLGoogleIdentityProvider| and |kGGLFacebookIdentityProvider|.
 */
@property(nonatomic, readonly, copy) NSArray *identityProviders;

/**
 * The tracking ID for Google Analytics, e.g. @"UA-12345678-1", used to configure Google Analytics.
 */
@property(nonatomic, readonly, copy) NSString *trackingID;

/**
 * Where the GITkit JavaScript widget is hosted. It should be defined in REDIRECT URIS of the Client
 * ID for web application. The widget is used for operations like password recovery and email
 * change. It should be hosted in the developer's backend server. It can be nil if such a server
 * does not exist.
 */
@property(nonatomic, readonly, copy) NSString *widgetURL;

/**
 * Mobile Ads' Ad Unit ID for a banner view, for example @"ca-app-pub-1234567890", used for
 * displaying ads view.
 */
@property(nonatomic, readonly, copy) NSString *bannerAdUnitID;

/**
 * Mobile Ads' Ad Unit ID for an interstitial view, for example @"ca-app-pub-1234567890", used for
 * displaying ads view.
 */
@property(nonatomic, readonly, copy) NSString *interstitialAdUnitID;

/**
 * The Project Number from the Google Developer's console, for example @"012345678901", used to
 * configure Google Cloud Messaging.
 */
@property(nonatomic, readonly, copy) NSString *gcmSenderID;

/**
 * The Android client ID used in Google AppInvite when an iOS app has its Android version, for
 * example @"12345.apps.googleusercontent.com".
 */
@property(nonatomic, readonly, copy) NSString *androidClientID;

@end
