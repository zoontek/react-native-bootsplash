#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static NSMutableArray<RNBootSplashTask *> * _Nullable _taskQueue = nil;
static bool _isTransitioning = false;
static RCTRootView * _Nullable _rootView = nil;

@implementation RNBootSplashTask

- (instancetype)initWithFade:(BOOL)fade
                     resolve:(RCTPromiseResolveBlock _Nonnull)resolve {
  if (self = [super init]) {
    _fade = fade;
    _resolve = resolve;
  }

  return self;
}

@end

@implementation RNBootSplash

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nullable)rootView {
  if (rootView == nil)
    return; // initWithStoryboard has been called without rootView (ex: iOS 15 notifications)

  [[NSNotificationCenter defaultCenter] removeObserver:rootView
                                                  name:RCTContentDidAppearNotification
                                                object:rootView];

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:storyboardName bundle:nil];
  UIView *view = [[storyboard instantiateInitialViewController] view];

  _rootView = rootView;
  [_rootView setLoadingView:view];

  [self dequeueTask];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(dequeueTask)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onJavaScriptDidLoad:)
                                               name:RCTJavaScriptDidLoadNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onJavaScriptDidFailToLoad)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:nil];
}

+ (void)hideLoadingView {
  if (_rootView != nil && _rootView.loadingView != nil) {
    _rootView.loadingView.hidden = YES;
    [_rootView.loadingView removeFromSuperview];
    _rootView.loadingView = nil;
  }
}

+ (void)ensureTaskQueue {
  if (_taskQueue == nil)
    _taskQueue = [[NSMutableArray alloc] init];
}

+ (void)dequeueTask {
  [self ensureTaskQueue];

  bool isForeground = [[UIApplication sharedApplication] applicationState] != UIApplicationStateActive;

  bool shouldSkipTick = _rootView == nil // _rootView isn't set
    || !isForeground // the app is not in foreground
    || _isTransitioning // the splash screen is currently hiding
    || [_taskQueue count] < 1; // there is no tasks left

  if (shouldSkipTick) {
    return; // avoid dequeueing task in these
  }

  RNBootSplashTask *task = [_taskQueue objectAtIndex:0];
  [_taskQueue removeObjectAtIndex:0];

  if (_rootView.loadingView == nil) {
    task.resolve(@(true));
    return [self dequeueTask];
  }

  if (!task.fade) {
    [self hideLoadingView];
    task.resolve(@(true));
    return [self dequeueTask];
  }

  _isTransitioning = true;

  [UIView transitionWithView:_rootView
                    duration:0.220
                     options:UIViewAnimationOptionTransitionCrossDissolve
                  animations:^{
                    _rootView.loadingView.hidden = YES;
                  }
                  completion:^(__unused BOOL finished) {
                    [self hideLoadingView];
                    _isTransitioning = false;
                    task.resolve(@(true));
                    return [self dequeueTask];
                  }];
}

+ (void)onJavaScriptDidLoad:(NSNotification *)notification {
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidLoadNotification
                                                object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidFailToLoadNotification
                                                object:nil];
}

+ (void)onJavaScriptDidFailToLoad {
  if (_taskQueue != nil)
    [_taskQueue removeAllObjects];

  [self hideLoadingView];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

RCT_REMAP_METHOD(hide,
                 hideWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  RNBootSplashTask *task = [[RNBootSplashTask alloc] initWithFade:fade
                                                          resolve:resolve];

  [RNBootSplash ensureTaskQueue];
  [_taskQueue addObject:task];
  [RNBootSplash dequeueTask];
}

RCT_REMAP_METHOD(getVisibilityStatus,
                 getVisibilityStatusWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_isTransitioning)
    return resolve(@"transitioning");
  if (_rootView == nil || _rootView.loadingView == nil)
    return resolve(@"hidden");
  else
    return resolve(@"visible");
}

@end
