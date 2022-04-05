//
//  JsBridge.m
//  ScratchJr Free
//
//  Created by Yueyu on 2020/7/31.
//

#import "ScratchJr.h"
#import <WebKit/WebKit.h>
@import Firebase;

@implementation JsBridge

-(void) userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message
{
    NSDictionary *dict = (NSDictionary *)message.body;

    JsRequest *request = [[JsRequest alloc] initWithDictionary:dict];

    NSString *method = [request.method stringByAppendingString:@":"];
    SEL selector = NSSelectorFromString(method);
    if (![self respondsToSelector:selector]) {
        NSLog(@"method %@ not exists", request.method);
        return;
    }
    // [self performSelector:selector withObject:request];
    // to disable warning: PerformSelector may cause a leak because its selector is unknown
    // thanks wbyoung for https://stackoverflow.com/a/20058585
    IMP imp = [self methodForSelector:selector];
    void (*func)(id, SEL, JsRequest *) = (void *)imp;
    func(self, selector, request);
}

-(void) askForPermission: (JsRequest *) request
{
    [RecordSound setPermission];
    [request callback:@"ok"];
}

-(void) database_stmt: (JsRequest *) request {
    [request callback:[Database stmt:request.params[0]]];
}

-(void) database_query: (JsRequest *) request {
    [request callback:[Database query:request.params[0]]];
}

-(void) io_getmd5: (JsRequest *) request {
    [request callback:[IO getMD5:request.params[0]]];
}

-(void) io_getsettings: (JsRequest *) request {
    [request callback:[IO getsettings]];
}

-(void) io_cleanassets: (JsRequest *) request {
    [IO cleanassets: request.params[0]];
    [request callback:@"ok"];
}

-(void) io_setfile: (JsRequest *) request {
    [request callback:[IO setfile:request.params[0]:request.params[1]]];
}

-(void) io_getfile: (JsRequest *) request {
    [request callback:[IO getfile:request.params[0]]];
}

-(void) io_setmedia: (JsRequest *) request {
    [request callback:[IO setmedia:request.params[0] :request.params[1]]];
}

-(void) io_setmedianame: (JsRequest *) request {
    [request callback:[IO setmedianame:request.params[0] :request.params[1] :request.params[2]]];
}

-(void) io_getmedia: (JsRequest *) request {
    [request callback:[IO getmedia:request.params[0]]];
}

-(void) io_getmediadata: (JsRequest *) request {
    int offset = [request.params[1] intValue];
    int length = [request.params[2] intValue];
    NSString *key = [NSString stringWithFormat:@"%@", request.params[0]];
    [request callback:[IO getmediadata:key :offset :length]];
}

-(void) io_getmedialen: (JsRequest *) request {
    NSString *key = [NSString stringWithFormat:@"%@", request.params[1]];
    [request callback:[IO getmedialen:request.params[0] :key]];
}

-(void) io_getmediadone: (JsRequest *) request {
    [request callback:[IO getmediadone:request.params[0]]];
}

-(void) io_remove: (JsRequest *) request {
    [request callback:[IO remove:request.params[0]]];
}

-(void) io_registersound: (JsRequest *) request {
    [request callback:[IO registerSound:request.params[0] :request.params[1]]];
}

-(void) io_playsound: (JsRequest *) request {
    [request callback:[IO playSound:request.params[0]]];
}

-(void) io_stopsound: (JsRequest *) request {
    [request callback:[IO stopSound:request.params[0]]];
}

-(void) recordsound_recordstart: (JsRequest *) request {
    [request callback:[RecordSound startRecord]];
}

-(void) recordsound_recordstop: (JsRequest *) request {
    [request callback:[RecordSound stopRecording]];
}

-(void) recordsound_volume: (JsRequest *) request {
    [request callback:[NSString stringWithFormat:@"%f", [RecordSound getVolume]]];
}

-(void) recordsound_startplay: (JsRequest *) request {
    [request callback:[RecordSound startPlay]];
}

-(void) recordsound_stopplay: (JsRequest *) request {
    [request callback:[RecordSound stopPlay]];
}

-(void) recordsound_recordclose: (JsRequest *) request {
    [request callback:[RecordSound recordclose:request.params[0]]];
}

-(void) scratchjr_cameracheck: (JsRequest *) request {
    [request callback:[ScratchJr cameracheck]];
}

-(void) scratchjr_has_multiple_cameras: (JsRequest *) request {
    [request callback:@"YES"];
}

-(void) scratchjr_startfeed: (JsRequest *) request {
    [request callback:[ScratchJr startfeed: request.params[0]]];
}

-(void) scratchjr_stopfeed: (JsRequest *) request {
    [request callback:[ScratchJr stopfeed]];
}

-(void) scratchjr_choosecamera: (JsRequest *) request {
    [request callback:[ScratchJr choosecamera:request.params[0]]];
}

-(void) scratchjr_captureimage: (JsRequest *) request {
    [request callback:[ScratchJr captureimage:request.params[0]]];
}

-(void) createZipForProject: (JsRequest *) request {
    NSString *projectData = request.params[0];
    NSDictionary* metadata = request.params[1];
    NSString* name = request.params[2];
    NSString * fullName = [IO createZipForProject:projectData :metadata :name];
    fullName = [fullName stringByReplacingOccurrencesOfString:@"'" withString:@"\\'"];
    [request callback:fullName];
}

-(void) sendSjrUsingShareDialog: (JsRequest *) request {
    int shareType = [request.params[3] intValue];
    NSString *res = [IO sendSjrUsingShareDialog:request.params[0] :request.params[1] :request.params[2] :shareType];
    [request callback:res];
}

- (void) hideSplash: (JsRequest *) request {
    [request callback:[ScratchJr hideSplash:nil]];
}

-(void) analyticsEvent: (JsRequest *) request {
    NSString *label = @"undefined";
    if (![request.params[2] isEqual:[NSNull null]]) {
        label = request.params[2];
    }
    [FIRAnalytics logEventWithName:request.params[1] // action
    parameters:@{
                 kFIRParameterItemName:label, // label
                 kFIRParameterItemCategory:request.params[0] // category
    }];
    [request callback:@"ok"];
}

-(void) setAnalyticsPlacePref: (JsRequest *) request {
    [FIRAnalytics setUserPropertyString:request.params[0] forName:@"place_preference"];
    [request callback:@"ok"];
}

// @param request like [name, propertyString]
-(void) setAnalyticsPref: (JsRequest *) request {
    NSString *name = [NSString stringWithFormat:@"%@", request.params[0]];
    NSString *propertyString = [NSString stringWithFormat:@"%@", request.params[1]];
    [FIRAnalytics setUserPropertyString:propertyString forName:name];
    [request callback:@"ok"];
}

// iPad name (used for information in the name/sharing dialog to help people using Airdrop)
- (void) deviceName: (JsRequest *) request {
    [request callback:[[UIDevice currentDevice] name]];
}

- (void) registerLibraryAssets: (JsRequest *) request {
    ScratchJr.assetLibraryVersion = (NSInteger) request.params[0];
    NSString *assets = request.params[1];
    [ScratchJr registerLibraryAssets: [assets componentsSeparatedByString:@","]];
    [request callback:@"1"];
}

// duplicate library/sample assets for further usage
- (void) duplicateAsset: (JsRequest *) request {
    NSString *path = request.params[0];
    NSString *name = request.params[1];
    NSLog(@"duplicate asset %@", path);
    [IO duplicateAsset:path :name];
    [request callback:@"1"];
}

@end
