#import "RNBootSplash.h"

#import <React/RCTUtils.h>

static NSMutableArray<RCTPromiseResolveBlock> *_resolveQueue = nil;
static UIView *_loadingView = nil;
static RCTRootView *_rootView = nil;
static float _duration = 0;
static bool _nativeHidden = false;
static bool _transitioning = false;

@implementation RNBootSplash

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (bool)isLoadingViewHidden {
  return _loadingView == nil || [_loadingView isHidden];
}

+ (bool)hasResolveQueue {
  return _resolveQueue != nil;
}

+ (void)clearResolveQueue {
  if (![self hasResolveQueue])
    return;

  while ([_resolveQueue count] > 0) {
    RCTPromiseResolveBlock resolve = [_resolveQueue objectAtIndex:0];
    [_resolveQueue removeObjectAtIndex:0];
    resolve(@(true));
  }
}

+ (void)hideLoadingView {
  if ([self isLoadingViewHidden])
    return [RNBootSplash clearResolveQueue];

  if (_duration > 0) {
    dispatch_async(dispatch_get_main_queue(), ^{
      _transitioning = true;

      [UIView transitionWithView:_rootView
                        duration:_duration / 1000.0
                         options:UIViewAnimationOptionTransitionCrossDissolve
                      animations:^{
        _loadingView.hidden = YES;
      }
                      completion:^(__unused BOOL finished) {
        [_loadingView removeFromSuperview];
        _loadingView = nil;

        _transitioning = false;
        return [RNBootSplash clearResolveQueue];
      }];
    });
  } else {
    _loadingView.hidden = YES;
    [_loadingView removeFromSuperview];
    _loadingView = nil;

    return [RNBootSplash clearResolveQueue];
  }
}

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(UIView * _Nullable)rootView {
  if (rootView == nil
      || ![rootView isKindOfClass:[RCTRootView class]]
      || _rootView != nil
      || [self hasResolveQueue] // hide has already been called, abort init
      || RCTRunningInAppExtension())
    return;

  _rootView = (RCTRootView *)rootView;

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:storyboardName bundle:nil];

  _loadingView = [[storyboard instantiateInitialViewController] view];
  _loadingView.hidden = NO;
  _loadingView.center = (CGPoint){CGRectGetMidX(_rootView.bounds), CGRectGetMidY(_rootView.bounds)};

  [_rootView addSubview:_loadingView];

  [NSTimer scheduledTimerWithTimeInterval:0.35
                                  repeats:NO
                                    block:^(NSTimer * _Nonnull timer) {
    // wait for native iOS launch screen to fade out
    _nativeHidden = true;

    // hide has been called before native launch screen fade out
    if ([self hasResolveQueue])
      [self hideLoadingView];
  }];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onJavaScriptDidLoad)
                                               name:RCTJavaScriptDidLoadNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onJavaScriptDidFailToLoad)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:nil];
}

+ (void)onJavaScriptDidLoad {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (void)onJavaScriptDidFailToLoad {
  [self hideLoadingView];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)hide:(double)duration
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject {
  if (_resolveQueue == nil)
    _resolveQueue = [[NSMutableArray alloc] init];

  [_resolveQueue addObject:resolve];

  if ([RNBootSplash isLoadingViewHidden] || RCTRunningInAppExtension())
    return [RNBootSplash clearResolveQueue];

  _duration = lroundf((float)duration);

  if (_nativeHidden)
    return [RNBootSplash hideLoadingView];
}

- (void)getVisibilityStatus:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject {
  if ([RNBootSplash isLoadingViewHidden])
    return resolve(@"hidden");
  else if (_transitioning)
    return resolve(@"transitioning");
  else
    return resolve(@"visible");
}

#ifdef RCT_NEW_ARCH_ENABLED

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeRNBootSplashSpecJSI>(params);
}

#else

RCT_REMAP_METHOD(hide,
                 hideWithDuration:(double)duration
                 resolve:(RCTPromiseResolveBlock)resolve
                 rejecte:(RCTPromiseRejectBlock)reject) {
  [self hide:duration
     resolve:resolve
      reject:reject];
}

RCT_REMAP_METHOD(getVisibilityStatus,
                 getVisibilityStatusWithResolve:(RCTPromiseResolveBlock)resolve
                 rejecte:(RCTPromiseRejectBlock)reject) {
  [self getVisibilityStatus:resolve
                     reject:reject];
}

#endif

@end
