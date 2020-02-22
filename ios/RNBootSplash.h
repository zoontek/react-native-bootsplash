#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>

@interface RNBootSplash : NSObject <RCTBridgeModule>

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
            viewController:(UIViewController * _Nonnull)rootViewController;

@end
