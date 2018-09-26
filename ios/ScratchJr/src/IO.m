#import "ScratchJr.h"
#import <CommonCrypto/CommonDigest.h>
ViewController* HTML;
MFMailComposeViewController *emailDialog;
NSMutableDictionary *mediastrings;
NSMutableDictionary *sounds;
NSMutableDictionary *soundtimers;

// new primtives


@implementation IO

// new primtives
+ (void)init:(ViewController*)vc {
    mediastrings = [[NSMutableDictionary alloc] init];
    sounds = [[NSMutableDictionary alloc] init];
    soundtimers = [[NSMutableDictionary alloc] init];
    HTML =vc;
}

+ (NSString*)getpath {return [NSHomeDirectory() stringByAppendingPathComponent:@"Documents"];}
+ (NSString*)getdocpath:(NSString*)body {return [NSHomeDirectory() stringByAppendingPathComponent:@"Documents"];}

+ (NSString*)clearcache:(NSString*)body  {
    [[NSURLCache sharedURLCache] removeAllCachedResponses];
    return @"1";
}

+ (NSString*)clearurlcache:(NSString*)body  {
    NSArray *args = [body componentsSeparatedByString: @"\n"];
    NSString *path = [args objectAtIndex:0];
    NSURL *url = [NSURL URLWithString:path];
    NSURLRequest* request = [NSURLRequest requestWithURL:url];
    [[NSURLCache sharedURLCache] removeCachedResponseForRequest:request];
    return @"1";
}

+ (NSString*)getsettings {
    NSString *choice =[[NSUserDefaults standardUserDefaults] stringForKey:@"debugstate"];
    return [NSString stringWithFormat: @"%@,%@,%@,%@", [NSHomeDirectory() stringByAppendingPathComponent:@"Documents"],choice, [RecordSound getPermission], [ViewFinder cameraHasPermission]];
}

+(NSString*) remove:(NSString*)filename {
    return [IO removeFile:filename];
}

+ (NSString*)print:(NSString*)body{
    NSLog(@"%@",body);
    return @"1";
}

+ (NSString*)dir:(NSString*)body{
    NSArray *args = [body componentsSeparatedByString: @"\n"];
    NSString *path = [args objectAtIndex:0];
    NSString *dir;
    if ([path isEqualToString:@"Documents"]) dir = [NSHomeDirectory() stringByAppendingPathComponent:@"Documents"];
    else dir = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent: path];
    NSError *error;
    NSFileManager *filemgr = [NSFileManager defaultManager];
    NSArray *dirContents = [filemgr contentsOfDirectoryAtPath:dir error:&error];
    NSString *result = ([dirContents count] == 0) ? [NSString stringWithFormat: @"[]"]:
    [NSString stringWithFormat: @"[\"%@\"]", [[dirContents valueForKey:@"description"] componentsJoinedByString:@"\", \""]];
    return result;
}

+ (NSString*)setfile:(NSString*)md5 :(NSString*)contents {
    NSURL *url = [self getDocumentPath:md5];
    NSData *plaindata = [IO decodeBase64:contents];
    BOOL ok =  [plaindata writeToURL:url atomically:NO];
    return (!ok)  ? @"-1" :  md5;
}

+ (NSString*)getfile:(NSString*)filename{
    NSURL *url =  [self getDocumentPath:filename];
    NSData *data =  [[NSData alloc] initWithContentsOfURL:url];
    data = (data == NULL) ?[@"archnemesis" dataUsingEncoding:NSUTF8StringEncoding] : data;
    return [IO encodeBase64:data];
}

+ (NSString*) setmedia:(NSString*) contents :(NSString*) extension {
    NSString *key = [self getMD5:contents];
    NSString *md5 =[NSString stringWithFormat:@"%@.%@", key, extension];
    return [self writefile:md5 with:contents];
}

+ (NSString*) setmedianame:(NSString*) contents :(NSString*) key :(NSString*) ext {
    NSString *md5 =[NSString stringWithFormat:@"%@.%@", key, ext];
    return [self writefile:md5 with:contents];
}

+ (NSString*)writefile:(NSString*)filename with: (NSString*)contents   {
    NSURL *url = [self getDocumentPath:filename];
    NSData *plaindata = [IO decodeBase64:contents];
    BOOL ok =  [plaindata writeToURL:url atomically:NO];
    return (!ok)  ? @"-1" :  filename;
}

+ (NSString*) getmedia:(NSString*) filename {
    NSURL *url = [self getDocumentPath:filename];
    NSString *str = [[NSString alloc] initWithContentsOfURL: url encoding:NSUTF8StringEncoding error:nil];
    return str;
}


// old get media not safe for large images

+ (NSString*)getmediab64:(NSString *)body {
    NSArray *args = [body componentsSeparatedByString: @"\n"];
    NSURL *url = [self getDocumentPath:[args objectAtIndex:0]];
    NSString *str = [IO encodeBase64: [[NSData alloc] initWithContentsOfURL:url]];
    return str;
}

// Start new get media to make sure big images go across the divide
// first function gets the length
// second function sends a protion of the data
// last one removes the data from the pull

+ (NSString*) getmedialen:(NSString*)file :(NSString*)key {
    NSURL *url = [self getDocumentPath:file];
    NSString *value = [IO encodeBase64: [[NSData alloc] initWithContentsOfURL:url]];
    [mediastrings setObject:value forKey:key];
    return [NSString stringWithFormat: @"%d", (int)[value length]];
}

 + (NSString*) getmediadata:(NSString*)filename :(int) offset :(int) len {
     return [[mediastrings valueForKey:filename] substringWithRange: NSMakeRange(offset, len)];
 }

+ (NSString*) getmediadone:(NSString*)filename {
    [mediastrings removeObjectForKey:filename];
    return @"1";
}

// end of getmedia

+ (void) cleanassets:(NSString *)filetype{
    NSArray *data = [IO getFilesType:filetype];
    for(NSString *file in data) {
        NSString *stmt = @"select id from projects where json LIKE ?";
        NSMutableArray *values = [[NSMutableArray alloc] init];
        [values addObject: [NSString stringWithFormat:  @"%@%@%@", @"%", file,@"%"]];
        NSArray *res = [Database findDataIn:stmt with:values];
        if ([res count] > 0) continue;
        stmt = @"select id from usershapes where md5 = ?";
        [values removeObjectAtIndex: 0];
        [values addObject: file];
        res = [Database findDataIn:stmt with:values];
        if ([res count] > 0) continue;
        stmt = @"select id from userbkgs where md5 = ?";
        res = [Database findDataIn:stmt with:values];
        if ([res count] > 0) continue;
       [IO removeFile:file];
    }
}

// Tools

+ (NSString *)destroyall:(NSString*)body {return [IO removeAllFiles];}


// File Related
+ (NSArray*)getFilesType:(NSString*)ft{
    NSString *dir = [NSHomeDirectory() stringByAppendingPathComponent:@"Documents"];
    NSError *error;
    NSFileManager *filemgr = [NSFileManager defaultManager];
    NSArray *array = [filemgr contentsOfDirectoryAtPath:dir error:&error];
    NSMutableArray *data = [[NSMutableArray alloc] init];
    for(NSString *file in array) {
        if ([file hasSuffix:ft]) [data addObject: file];
    }
    return (NSArray *)data;
}

+ (NSString*)removeFile:(NSString *)str{
    NSURL *url = [self getDocumentPath:str];
    NSError *error;
    NSLog(@"remove file %@", url);
    NSFileManager *filemgr = [NSFileManager defaultManager];
    BOOL ok =[filemgr removeItemAtURL:url error:&error];
    if (!ok) return [NSString stringWithFormat:@"Couldn't remove %@ file",str];
    else return [NSString stringWithFormat:@"File: %@ removed",str];
}

+ (NSString*) getMD5:(NSString*)str {
    const char *ptr = [str UTF8String];
    unsigned char md5Buffer[CC_MD5_DIGEST_LENGTH];
    CC_MD5(ptr, (int)strlen(ptr), md5Buffer);
    NSMutableString *output = [NSMutableString stringWithCapacity:CC_MD5_DIGEST_LENGTH * 2];
    for(int i = 0; i < CC_MD5_DIGEST_LENGTH; i++)
        [output appendFormat:@"%02x",md5Buffer[i]];
    return [output copy];
}

+ (NSString *)removeAllFiles{
    NSString *dir = [NSHomeDirectory() stringByAppendingPathComponent:@"Documents"];
    NSError *error;
    NSFileManager *filemgr = [NSFileManager defaultManager];
    NSArray *dirContents = [filemgr contentsOfDirectoryAtPath:dir error:&error];
    for(int i = 0; i <[dirContents count]; i++)  [IO removeFile: [dirContents objectAtIndex: i]];
    return @"1";
}

// Receive a .sjr file from inside the app.  Send using native UI - Airdrop or Email

+ (NSString*) sendSjrUsingShareDialog:(NSString *)fullname :(NSString*)emailSubject :(NSString*)emailBody :(int)shareType :(NSString*)contents {

    NSString* extensionFormat =  @"%@.sjr";

    #if PBS
        extensionFormat =  @"%@.psjr";
    #endif

    NSString *filename = [NSString stringWithFormat:extensionFormat, fullname];
    NSURL *url = [self getDocumentPath:filename];
    NSData *plaindata = [IO decodeBase64:contents];
    BOOL ok =  [plaindata writeToURL:url atomically:NO];

    if (ok) {
        if (shareType == 0) {
            [HTML showShareEmail:url withName:filename withSubject:emailSubject withBody:emailBody];
        } else {
            [HTML showShareAirdrop:url];
        }
    } else {
        NSLog(@"couldn't save file");
    }
    return @"1";
}

////////////////////////////
// Sound System
////////////////////////////

+ (NSString *)registerSound:(NSString*)dir :(NSString*)name  {
    NSURL *url;
    if ([dir isEqual:@"Documents"]){
        url = [self getDocumentPath: name];
    }
    else {
        url = [self getResourcePath: [NSString stringWithFormat: @"%@%@", dir, name]];
    }

    NSError *error;
    AVAudioPlayer *snd = [[AVAudioPlayer alloc] initWithContentsOfURL: url error:&error];

    if (error == nil) {
        [sounds setObject:snd forKey:name];
        [snd prepareToPlay];
        return [NSString stringWithFormat: @"%@,%f", name,  snd.duration];
    }
    return @"error";
}

+ (NSString *)playSound :(NSString*)name  {
    // TODO: make scratchJr pay attention to the mute
    //         // audio type: respect the "Mute" if there are audio sounds
    //         // ignore the Mute if it is from recording / playback and Runtime.
    //         NSString *audiotype = ([dir  isEqual: @"Documents"] || [name isEqual:@"pop.mp3"]) ? AVAudio\
    // SessionCategoryPlayAndRecord : AVAudioSessionCategoryAmbient;
    //         [[AVAudioSession sharedInstance] setCategory:audiotype error:nil];
    AVAudioPlayer *snd = sounds[name];
    if (snd == nil) {
        return [NSString stringWithFormat:@"%@ not found", name];
    }
    NSTimer *sndTimer = soundtimers[name];
    if (sndTimer.valid) {
        // this sound is already playing, invalidate so that new timer will overrule
        [sndTimer invalidate];
    }
    [snd setCurrentTime:0];
    [snd play];
    [soundtimers setObject:[NSTimer scheduledTimerWithTimeInterval:[snd duration]
                                     target:self
                                   selector:@selector(soundEnded:)
                                   userInfo:@{@"soundName":name}
                                    repeats:NO] forKey:name];
    return  [NSString stringWithFormat:@"%@ played", name];
}

+ (void)soundEnded:(NSTimer*)timer {
    NSString *soundName = [[timer userInfo] objectForKey:@"soundName"];
    if (sounds[soundName] == nil) return;
    NSString *callback = [NSString stringWithFormat:@"iOS.soundDone('%@');", soundName];
    UIWebView *webview = [ViewController webview];
    dispatch_async(dispatch_get_main_queue(), ^{
        [webview stringByEvaluatingJavaScriptFromString:callback];
    });
}

+ (NSString *)stopSound :(NSString*)name  {
    AVAudioPlayer *snd = sounds[name];
    if (snd == nil) {
        return [NSString stringWithFormat:@"%@ not found", name];
    }
    [snd stop];
    return  [NSString stringWithFormat:@"%@ stopped", name];
}

////////////////////////////
// File system
////////////////////////////

+ (NSURL*)getResourcePath:(NSString *)name{
    NSString *dir = [[NSBundle mainBundle]  resourcePath];
    // Build the path
    return [NSURL fileURLWithPath: [[NSString alloc] initWithString: [dir stringByAppendingPathComponent: name]]];
}

+ (NSURL*)getDocumentPath:(NSString *)name{
    NSString *dir = [NSHomeDirectory() stringByAppendingPathComponent:@"Documents"];
    return  [NSURL fileURLWithPath: [dir stringByAppendingPathComponent: name]];
}

///////////////////////////////
// Base64 encode and decode
//////////////////////////////

+ (NSString*)encodeBase64:(NSData*)theData {
    const uint8_t* input = (const uint8_t*)[theData bytes];
    NSInteger length = [theData length];
    static char table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    NSMutableData* data = [NSMutableData dataWithLength:((length + 2) / 3) * 4];
    uint8_t* output = (uint8_t*)data.mutableBytes;
    NSInteger i;
    for (i=0; i < length; i += 3) {
        NSInteger value = 0;
        NSInteger j;
        for (j = i; j < (i + 3); j++) {
            value <<= 8;
            if (j < length)  value |= (0xFF & input[j]);
        }
        NSInteger theIndex = (i / 3) * 4;
        output[theIndex + 0] =                    table[(value >> 18) & 0x3F];
        output[theIndex + 1] =                    table[(value >> 12) & 0x3F];
        output[theIndex + 2] = (i + 1) < length ? table[(value >> 6)  & 0x3F] : '=';
        output[theIndex + 3] = (i + 2) < length ? table[(value >> 0)  & 0x3F] : '=';
    }
    return [[NSString alloc] initWithData:data encoding:NSASCIIStringEncoding];
}

+ (NSData *) decodeBase64:(NSString *) string {
    NSMutableData *mutableData = nil;

    if( string ) {
        unsigned long ixtext = 0;
        unsigned long lentext = 0;
        unsigned char ch = 0;
        unsigned char inbuf[4]={}, outbuf[3];
        short i = 0, ixinbuf = 0;
        BOOL flignore = NO;
        BOOL flendtext = NO;
        NSData *base64Data = nil;
        const unsigned char *base64Bytes = nil;

        // Convert the string to ASCII data.
        base64Data = [string dataUsingEncoding:NSASCIIStringEncoding];
        base64Bytes = [base64Data bytes];
        mutableData = [NSMutableData dataWithCapacity:[base64Data length]];
        lentext = [base64Data length];

        while( YES ) {
            if( ixtext >= lentext ) break;
            ch = base64Bytes[ixtext++];
            flignore = NO;

            if( ( ch >= 'A' ) && ( ch <= 'Z' ) ) ch = ch - 'A';
            else if( ( ch >= 'a' ) && ( ch <= 'z' ) ) ch = ch - 'a' + 26;
            else if( ( ch >= '0' ) && ( ch <= '9' ) ) ch = ch - '0' + 52;
            else if( ch == '+' ) ch = 62;
            else if( ch == '=' ) flendtext = YES;
            else if( ch == '/' ) ch = 63;
            else flignore = YES;

            if( ! flignore ) {
                short ctcharsinbuf = 3;
                BOOL flbreak = NO;

                if( flendtext ) {
                    if( ! ixinbuf ) break;
                    if( ( ixinbuf == 1 ) || ( ixinbuf == 2 ) ) ctcharsinbuf = 1;
                    else ctcharsinbuf = 2;
                    ixinbuf = 3;
                    flbreak = YES;
                }

                inbuf [ixinbuf++] = ch;

                if( ixinbuf == 4 ) {
                    ixinbuf = 0;
                    outbuf [0] = ( inbuf[0] << 2 ) | ( ( inbuf[1] & 0x30) >> 4 );
                    outbuf [1] = ( ( inbuf[1] & 0x0F ) << 4 ) | ( ( inbuf[2] & 0x3C ) >> 2 );
                    outbuf [2] = ( ( inbuf[2] & 0x03 ) << 6 ) | ( inbuf[3] & 0x3F );

                    for( i = 0; i < ctcharsinbuf; i++ )
                        [mutableData appendBytes:&outbuf[i] length:1];
                }

                if( flbreak )  break;
            }
        }
    }

    return  [mutableData copy];
}

@end
