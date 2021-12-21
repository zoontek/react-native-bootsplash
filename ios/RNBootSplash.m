#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static NSMutableArray<RNBootSplashTask *> * _Nullable _taskQueue = nil;
static bool _transitioning = false;
static RCTRootView * _Nullable _rootView = nil;

@implementation RNBootSplashTask

- (instancetype)initWithFade:(BOOL)fade
                    resolver:(RCTPromiseResolveBlock _Nullable)resolver {
  if (self = [super init]) {
    _fade = fade;
    _resolver = resolver;
  }

  return self;
}

- (void)resolve {
  if (_resolver != nil)
    _resolver(@(true));
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
  if (_rootView == nil)
    return; // initWithStoryboard has been called without rootView (ex: iOS 15 notifications)

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

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:storyboardName bundle:nil];
  UIView *view = [[storyboard instantiateInitialViewController] view];

  _rootView = rootView;

  [_rootView setLoadingView:view];
  [RNBootSplash shiftNextTask];
}

+ (void)shiftNextTask {
  if (_taskQueue == nil)
    _taskQueue = [[NSMutableArray alloc] init];

  bool shouldSkipTick = _rootView == nil
    || _transitioning
    || [_taskQueue count] < 1
    || [[UIApplication sharedApplication] applicationState] == UIApplicationStateBackground;

  if (shouldSkipTick)
    return;

  RNBootSplashTask *task = [_taskQueue objectAtIndex:0];
  [_taskQueue removeObjectAtIndex:0];

  if (_rootView.loadingView == nil) {
    [task resolve];
    return [self shiftNextTask];
  }

  if (!task.fade) {
    _rootView.loadingView.hidden = YES;
    [_rootView.loadingView removeFromSuperview];
    _rootView.loadingView = nil;

    [task resolve];
    return [self shiftNextTask];
  }

  _transitioning = true;

  [UIView transitionWithView:_rootView
                    duration:0.220
                     options:UIViewAnimationOptionTransitionCrossDissolve
                  animations:^{
                               _rootView.loadingView.hidden = YES;
                             }
                  completion:^(__unused BOOL finished) {
                               [_rootView.loadingView removeFromSuperview];
                               _rootView.loadingView = nil;

                               [task resolve];
                               _transitioning = false;

                               return [self shiftNextTask];
                             }];
}

+ (void)createTaskWithFade:(BOOL)fade
                  resolver:(RCTPromiseResolveBlock)resolve {
  RNBootSplashTask *task = [[RNBootSplashTask alloc] initWithFade:fade
                                                         resolver:resolve];

  if (_taskQueue == nil)
    _taskQueue = [[NSMutableArray alloc] init];

  [_taskQueue addObject:task];
  [RNBootSplash shiftNextTask];
}

+ (void)onJavaScriptDidLoad:(NSNotification *)notification {
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidLoadNotification
                                                object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidFailToLoadNotification
                                                object:nil];

  [RNBootSplash shiftNextTask];
}

+ (void)onJavaScriptDidFailToLoad {
  [RNBootSplash createTaskWithFade:false
                          resolver:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

RCT_REMAP_METHOD(hide,
                 hideWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  [RNBootSplash createTaskWithFade:fade
                          resolver:resolve];
}

RCT_REMAP_METHOD(getVisibilityStatus,
                 getVisibilityStatusWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_transitioning)
    return resolve(@"transitioning");

  if (_rootView != nil && (_rootView.loadingView != nil || _rootView.loadingView.hidden == YES))
    return resolve(@"visible");
  else
    return resolve(@"hidden");
}

@end
