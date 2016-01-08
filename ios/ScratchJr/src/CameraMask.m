#import "ScratchJr.h"

@implementation CameraMask

- (id)initWithFrame:(CGRect)frame withScale:(float)s mask:(NSData *)imageData{
    self = [super initWithFrame:frame];
    if (self) {
            // Initialization code
        UIImageView *loadingImage = [[UIImageView alloc] initWithImage: [UIImage imageWithData:imageData]];
        [self addSubview:loadingImage];
        CGAffineTransform mtx = CGAffineTransformIdentity;
        mtx = CGAffineTransformScale(mtx, s, s);
        self.transform=mtx;
    }
    return self;
}

@end
