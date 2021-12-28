#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static NSMutableArray<RNBootSplashTask *> * _Nullable _taskQueue = nil;
static RCTRootView * _Nullable _rootView = nil;
static bool _transitioning = false;
static bool _contentHasAppeared = false;

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

+ (void)ensureModuleInit {
  if (_taskQueue != nil || RCTRunningInAppExtension())
    return;

  _taskQueue = [[NSMutableArray alloc] init];
  _transitioning = false;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(dequeueTask)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onContentDidAppear)
                                               name:RCTContentDidAppearNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onJavaScriptDidFailToLoad)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:nil];
}

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nullable)rootView {
  if (rootView == nil || _rootView != nil || RCTRunningInAppExtension())
    return;

  _rootView = rootView;

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:storyboardName bundle:nil];
  UIView *loadingView = [[storyboard instantiateInitialViewController] view];

  rootView.loadingView = loadingView;
  loadingView.hidden = NO;
  [rootView addSubview:loadingView];

  [[NSNotificationCenter defaultCenter] removeObserver:rootView
                                                  name:RCTContentDidAppearNotification
                                                object:rootView];

  [self ensureModuleInit];
  [self dequeueTask];
}

+ (void)onContentDidAppear {
  _contentHasAppeared = true;
  [self dequeueTask];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTContentDidAppearNotification
                                                object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidFailToLoadNotification
                                                object:nil];
}

+ (void)onJavaScriptDidFailToLoad {
  [_taskQueue removeAllObjects];
  [self hideLoadingView];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (bool)hidden {
  return _rootView == nil || _rootView.loadingView == nil;
}

+ (void)hideLoadingView {
  if ([self hidden])
    return;

  _rootView.loadingView.hidden = YES;
  [_rootView.loadingView removeFromSuperview];
  _rootView.loadingView = nil;
}

+ (bool)shouldPreventDequeuing {
  UIApplication * _Nullable sharedApplication = RCTSharedApplication();

  return sharedApplication == nil
    || _rootView == nil
    || _taskQueue == nil
    || !_contentHasAppeared
    || _transitioning
    || [_taskQueue count] < 1
    || [sharedApplication applicationState] != UIApplicationStateActive;
}

+ (void)dequeueTask {
  if ([self shouldPreventDequeuing])
    return;

  RNBootSplashTask *task = [_taskQueue objectAtIndex:0];
  [_taskQueue removeObjectAtIndex:0];

  if ([self hidden]) {
    task.resolve(@(true));
    return [self dequeueTask];
  }
  if (!task.fade) {
    [self hideLoadingView];
    task.resolve(@(true));
    return [self dequeueTask];
  }

  _transitioning = true;

  [UIView transitionWithView:_rootView
                    duration:0.220
                     options:UIViewAnimationOptionTransitionCrossDissolve
                  animations:^{
                    _rootView.loadingView.hidden = YES;
                  }
                  completion:^(__unused BOOL finished) {
                    [self hideLoadingView];
                    _transitioning = false;
                    task.resolve(@(true));
                    return [self dequeueTask];
                  }];
}

RCT_REMAP_METHOD(hide,
                 hideWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (RCTRunningInAppExtension())
    return resolve(@(true));

  RNBootSplashTask *task = [[RNBootSplashTask alloc] initWithFade:fade
                                                          resolve:resolve];

  [RNBootSplash ensureModuleInit];
  [_taskQueue addObject:task];
  [RNBootSplash dequeueTask];
}

RCT_REMAP_METHOD(getVisibilityStatus,
                 getVisibilityStatusWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_transitioning)
    return resolve(@"transitioning");
  if ([RNBootSplash hidden])
    return resolve(@"hidden");
  else
    return resolve(@"visible");
}

@end
