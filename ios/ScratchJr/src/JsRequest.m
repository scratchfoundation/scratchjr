//
//  JsRequest.m
//  ScratchJr Free
//
//  Created by Yueyu on 2020/7/31.
//

#import "ScratchJr.h"

@implementation JsRequest

- (instancetype)initWithDictionary:(NSDictionary *)dictionary {
    self = [super init];
    self.method = dictionary[@"method"];
    self.callId = dictionary[@"id"];
    self.params = dictionary[@"params"];
    return self;
}

- (void) callback:(NSString *)res {
    NSString *js = nil;
    if ([res hasPrefix:@"["] || [res hasPrefix:@"{"]) {
        js = [NSString stringWithFormat:@"iOS.resolve('%@', %@);", self.callId, res];
    } else {
        js = [NSString stringWithFormat:@"iOS.resolve('%@', '%@');", self.callId, res];
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        [ViewController.webview evaluateJavaScript:js completionHandler:nil];
    });
}

@end
