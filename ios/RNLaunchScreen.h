#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>

@interface RNLaunchScreen : NSObject <RCTBridgeModule>

+ (void)show:(NSString * _Nonnull)name
      inView:(RCTRootView * _Nonnull)view;

@end
