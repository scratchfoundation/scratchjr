//
//  NSDictionary+JSONString.m
//  ScratchJr Free
//
//  Created by Yueyu Zhao on 2021/4/4.
//  Copyright © 2021 Scratch Foundation. All rights reserved.
//

#import "NSDictionary+JSONString.h"

@implementation NSDictionary(String)

- (NSString *) jsonString {
    NSData *data = [NSJSONSerialization dataWithJSONObject:self options:NSJSONWritingPrettyPrinted error:nil];
    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

@end
