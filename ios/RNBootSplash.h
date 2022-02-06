#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>

typedef enum {
  RNBootSplashStatusVisible = 0,
  RNBootSplashStatusHidden = 1,
  RNBootSplashStatusTransitioning = 2
} RNBootSplashStatus;

@interface RNBootSplashTask : NSObject

@property (nonatomic, readonly) BOOL fade;
@property (nonatomic, readonly, strong) RCTPromiseResolveBlock _Nonnull resolve;

- (instancetype _Nonnull)initWithFade:(BOOL)fade
                             resolver:(RCTPromiseResolveBlock _Nonnull)resolve;

@end

@interface RNBootSplash : NSObject <RCTBridgeModule>

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nonnull)rootView;

@end
