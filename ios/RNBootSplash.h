#ifdef RCT_NEW_ARCH_ENABLED

#import <RNBootSplashSpec/RNBootSplashSpec.h>
@interface RNBootSplash : NSObject <NativeRNBootSplashSpec>

#else

#import <React/RCTBridgeModule.h>
@interface RNBootSplash : NSObject <RCTBridgeModule>

#endif

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(UIView * _Nullable)rootView;

@end
