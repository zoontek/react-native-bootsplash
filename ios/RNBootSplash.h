#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>

typedef enum {
  RNBootSplashTaskTypeShow = 0,
  RNBootSplashTaskTypeHide = 1
} RNBootSplashTaskType;

typedef enum {
  RNBootSplashStatusVisible = 0,
  RNBootSplashStatusHidden = 1,
  RNBootSplashStatusTransitioningToVisible = 2,
  RNBootSplashStatusTransitioningToHidden = 3
} RNBootSplashStatus;

@interface RNBootSplashTask : NSObject

@property (nonatomic, readonly) RNBootSplashTaskType type;
@property (nonatomic, readonly) BOOL fade;
@property (nonatomic, readonly, strong) RCTPromiseResolveBlock _Nonnull resolve;
@property (nonatomic, readonly, strong) RCTPromiseRejectBlock _Nonnull reject;

- (instancetype _Nonnull)initWithType:(RNBootSplashTaskType)type
                                 fade:(BOOL)fade
                             resolver:(RCTPromiseResolveBlock _Nonnull)resolve
                             rejecter:(RCTPromiseRejectBlock _Nonnull)reject;

@end

@interface RNBootSplash : NSObject <RCTBridgeModule>

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nonnull)rootView;

@end
