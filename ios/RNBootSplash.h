#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>

@interface RNBootSplashTask : NSObject

@property (nonatomic, readonly) BOOL fade;
@property (nonatomic, readonly, strong) RCTPromiseResolveBlock _Nonnull resolve;

- (instancetype _Nonnull)initWithFade:(BOOL)fade
                              resolve:(RCTPromiseResolveBlock _Nonnull)resolve;

@end

@interface RNBootSplash : NSObject <RCTBridgeModule>

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nullable)rootView;

@end
