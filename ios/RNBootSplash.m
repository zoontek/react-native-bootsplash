#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static NSMutableArray<RNBootSplashTask *> * _Nullable _taskQueue = nil;
static RCTRootView * _Nullable _rootView = nil;
static RNBootSplashStatus _status = RNBootSplashStatusHidden;

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
                  rootView:(RCTRootView * _Nonnull)rootView {
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
    || _status == RNBootSplashStatusTransitioning
    || [_taskQueue count] < 1
    || [[UIApplication sharedApplication] applicationState] == UIApplicationStateBackground;

  if (!shouldSkipTick) {
    RNBootSplashTask *task = [_taskQueue objectAtIndex:0];
    [_taskQueue removeObjectAtIndex:0];

    [self hideWithTask:task];
  }
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

+ (void)hideWithTask:(RNBootSplashTask *)task {
  if (_status == RNBootSplashStatusHidden) {
    [task resolve];
    return [self shiftNextTask];
  }

  if (!task.fade) {
    _status = RNBootSplashStatusHidden;

    _rootView.loadingView.hidden = YES;
    [_rootView.loadingView removeFromSuperview];
    _rootView.loadingView = nil;

    [task resolve];
    return [self shiftNextTask];
  }

  _status = RNBootSplashStatusTransitioning;

  [UIView transitionWithView:_rootView
                    duration:0.220
                     options:UIViewAnimationOptionTransitionCrossDissolve
                  animations:^{
                               _rootView.loadingView.hidden = YES;
                             }
                  completion:^(__unused BOOL finished) {
                               _status = RNBootSplashStatusHidden;

                               [_rootView.loadingView removeFromSuperview];
                               _rootView.loadingView = nil;

                               [task resolve];
                               return [self shiftNextTask];
                             }];
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
  switch (_status) {
    case RNBootSplashStatusVisible:
      return resolve(@"visible");
    case RNBootSplashStatusHidden:
      return resolve(@"hidden");
    case RNBootSplashStatusTransitioning:
      return resolve(@"transitioning");
  }
}

@end
