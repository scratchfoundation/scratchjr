#import <AVFoundation/AVFoundation.h>
#import <QuartzCore/QuartzCore.h>
#import "ScratchJr.h"

@implementation CameraView

float xcoor;
float ycoor;
float scale;
NSString *usingCamera;
CGFloat angle;
UIImageView *loadingImage;

NSString* usingCamera;

int orientation;

- (id)initWithFrame:(CGRect)frame withScale:(float)s{
    self.usingCamera = [NSString stringWithFormat:@"front"];
    CGRect rect = CGRectMake(0, 0,  frame.size.height, frame.size.width);
    CGFloat delta = (frame.size.width - frame.size.height) / 2;
    self.ycoor = frame.origin.y - delta;
    self.xcoor = frame.origin.x + delta;
    self.scale = s;
    self = [super initWithFrame:rect];
    if (self) {
        [self setBackgroundColor: [UIColor colorWithRed:(40/255.0) green:(165/255.0) blue:(218/255.0) alpha:1]];
        // Initialization code
        NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];
        [notificationCenter addObserver:self selector:@selector(deviceOrientationDidChange) name:UIDeviceOrientationDidChangeNotification object:nil];
		orientation =  [UIApplication sharedApplication].statusBarOrientation;
    }
    return self;
}

- (void)dealloc{
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceOrientationDidChangeNotification object:nil];
   }

-(void) switchOrientation:(int)dir {
    switch (dir) {
        case UIInterfaceOrientationLandscapeLeft:
            angle=90.f*M_PI/180.f;
            break;
        case UIInterfaceOrientationLandscapeRight:
            angle=-90.f*M_PI/180.f;
            break;
        default: angle=0.f;
            break;
    }
    if(angle==0 && CGAffineTransformIsIdentity(self.transform)) return;
   
    CGAffineTransform mtx = CGAffineTransformIdentity;
    mtx = CGAffineTransformTranslate(mtx, self.xcoor, self.ycoor);
    mtx = CGAffineTransformRotate(mtx, angle);
    mtx = CGAffineTransformScale(mtx, self.scale, self.scale);
    self.transform=mtx;
    orientation = dir;
}

-(void) setCameraTo:(NSString*)dir {self.usingCamera = dir;};

- (void)deviceOrientationDidChange{
    if (!self) return;
    [self switchOrientation:[UIApplication sharedApplication].statusBarOrientation];
}

-(NSString*)getImageBase64:(NSData*)imgdata {
    UIImage *originalImage = [[UIImage alloc] initWithData:imgdata];
    CALayer *layer = [self layer];
    CGFloat s = fmin(originalImage.size.width/[layer bounds].size.height,originalImage.size.height/[layer bounds].size.width);
    int dir =  [self.usingCamera isEqualToString:@"front"] ? ( (orientation == 4) ? 4 : 5) : ((orientation == 4) ? 1 : 0);
    UIImage *cropped = [self crop:originalImage scaled:s orientation:dir];
    NSData *idata = UIImagePNGRepresentation(cropped);
    return [IO encodeBase64:idata];
}

- (UIImage *)crop:(UIImage *)image scaled:(CGFloat)s orientation:(int)dir{
    CALayer *layer = [self layer];
    UIImage *scaledImage =
        [UIImage imageWithCGImage:[image CGImage]
                        scale: s
                  orientation: dir];
    CGRect rect = CGRectMake((scaledImage.size.width - [layer bounds].size.height) / 2,
                             (scaledImage.size.height - [layer bounds].size.width) / 2,
                             [layer bounds].size.height,
                             [layer bounds].size.width);
    if (scaledImage.scale > 1.0f) {
        rect = CGRectMake(rect.origin.x * scaledImage.scale,
                          rect.origin.y * scaledImage.scale,
                          rect.size.width * scaledImage.scale,
                          rect.size.height * scaledImage.scale);
    }
    CGImageRef imageRef = CGImageCreateWithImageInRect(scaledImage.CGImage, rect);
    UIImage *result = [UIImage imageWithCGImage:imageRef scale:scaledImage.scale orientation:scaledImage.imageOrientation];
    CGImageRelease(imageRef);
    return [self imageWithImage:result scaledToSize:CGSizeMake(rect.size.width / scaledImage.scale, rect.size.height / scaledImage.scale)];
}

- (UIImage *)imageWithImage:(UIImage *)image scaledToSize:(CGSize)newSize {
    UIGraphicsBeginImageContextWithOptions(newSize, NO, 1.0);
    [image drawInRect:CGRectMake(0, 0, newSize.width, newSize.height)];
    UIImage *newImage = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return newImage;
}


@end
