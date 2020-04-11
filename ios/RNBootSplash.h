#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>

@interface RNBootSplash : NSObject <RCTBridgeModule>

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nonnull)rootView;

// Deprecated, will be removed in a future version
+ (void)initialShow;

@end
