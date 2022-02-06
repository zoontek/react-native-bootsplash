#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static NSMutableArray<RNBootSplashTask *> *_taskQueue = nil;
static RCTRootView *_rootView = nil;
static bool _isTransitioning = false;

@implementation RNBootSplashTask

- (instancetype)initWithFade:(BOOL)fade
                    resolver:(RCTPromiseResolveBlock _Nonnull)resolve {
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
  return NO;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nullable)rootView {
  if (rootView == nil || _rootView != nil || RCTRunningInAppExtension())
    return;

  _rootView = rootView;

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:storyboardName bundle:nil];
  [_rootView setLoadingView:[[storyboard instantiateInitialViewController] view]];

  [[NSNotificationCenter defaultCenter] removeObserver:rootView
                                                  name:RCTContentDidAppearNotification
                                                object:rootView];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onJavaScriptDidLoad:)
                                               name:RCTJavaScriptDidLoadNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onJavaScriptDidFailToLoad)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(shiftNextTask)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];
}

+ (void)onJavaScriptDidLoad:(NSNotification *)notification {
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidLoadNotification
                                                object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidFailToLoadNotification
                                                object:nil];
}

+ (bool)isHidden {
  return _rootView == nil || _rootView.loadingView == nil || [_rootView.loadingView isHidden];
}

+ (void)removeLoadingView {
  if (![self isHidden]) {
    _rootView.loadingView.hidden = YES;
    [_rootView.loadingView removeFromSuperview];
    _rootView.loadingView = nil;
  }
}

+ (void)onJavaScriptDidFailToLoad {
  [self removeLoadingView];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (void)ensureTaskQueue {
  if (_taskQueue == nil)
    _taskQueue = [[NSMutableArray alloc] init];
}

+ (void)shiftNextTask {
  [self ensureTaskQueue];

  if ([_taskQueue count] > 0 &&
      !_isTransitioning &&
      [[UIApplication sharedApplication] applicationState] != UIApplicationStateBackground) {
    RNBootSplashTask *task = [_taskQueue objectAtIndex:0];
    [_taskQueue removeObjectAtIndex:0];

    [self hideWithTask:task];
  }
}

+ (void)hideWithTask:(RNBootSplashTask *)task {
  if ([self isHidden]) {
    task.resolve(@(true));
    return [self shiftNextTask];
  }

  if (!task.fade) {
    [self removeLoadingView];
    task.resolve(@(true));
    return [self shiftNextTask];
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    _isTransitioning = true;

    [UIView transitionWithView:_rootView
                      duration:0.220
                       options:UIViewAnimationOptionTransitionCrossDissolve
                    animations:^{
      _rootView.loadingView.hidden = YES;
    }
                    completion:^(__unused BOOL finished) {
      [_rootView.loadingView removeFromSuperview];
      _rootView.loadingView = nil;

      task.resolve(@(true));
      _isTransitioning = false;

      return [self shiftNextTask];
    }];
  });
}

RCT_REMAP_METHOD(hide,
                 hideWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if ([RNBootSplash isHidden] || RCTRunningInAppExtension())
    return resolve(@(true));

  RNBootSplashTask *task = [[RNBootSplashTask alloc] initWithFade:fade
                                                         resolver:resolve];

  [RNBootSplash ensureTaskQueue];
  [_taskQueue addObject:task];
  [RNBootSplash shiftNextTask];
}

RCT_REMAP_METHOD(getVisibilityStatus,
                 getVisibilityStatusWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if ([RNBootSplash isHidden])
    return resolve(@"hidden");
  else if (_isTransitioning)
    return resolve(@"transitioning");
  else
    return resolve(@"visible");
}

@end
