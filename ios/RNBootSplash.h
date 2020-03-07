#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>

@interface RNBootSplash : NSObject <RCTBridgeModule>

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName;

@end
