#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static NSMutableArray<RNBootSplashTask *> *_taskQueue = nil;
static RCTRootView *_rootView = nil;
static RNBootSplashStatus _status = RNBootSplashStatusHidden;

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
  return YES;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nonnull)rootView {
  _rootView = rootView;
  _status = RNBootSplashStatusVisible;
  _taskQueue = [[NSMutableArray alloc] init];

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

+ (void)onJavaScriptDidFailToLoad {
  _status = RNBootSplashStatusHidden;

  if (_rootView != nil) {
    _rootView.loadingView.hidden = YES;
    [_rootView.loadingView removeFromSuperview];
    _rootView.loadingView = nil;
  }

  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (void)shiftNextTask {
  if (_status != RNBootSplashStatusTransitioning &&
      [_taskQueue count] > 0 &&
      [[UIApplication sharedApplication] applicationState] != UIApplicationStateBackground) {
    RNBootSplashTask *task = [_taskQueue objectAtIndex:0];
    [_taskQueue removeObjectAtIndex:0];

    [self hideWithTask:task];
  }
}

+ (void)hideWithTask:(RNBootSplashTask *)task {
  if (_status == RNBootSplashStatusHidden) {
    task.resolve(@(true));
    return [self shiftNextTask];
  }

  if (!task.fade) {
    _status = RNBootSplashStatusHidden;

    _rootView.loadingView.hidden = YES;
    [_rootView.loadingView removeFromSuperview];
    _rootView.loadingView = nil;

    task.resolve(@(true));
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

                               task.resolve(@(true));
                               return [self shiftNextTask];
                             }];
}

RCT_REMAP_METHOD(hide,
                 hideWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_rootView == nil || _status == RNBootSplashStatusHidden)
    return resolve(@(true));

  RNBootSplashTask *task = [[RNBootSplashTask alloc] initWithFade:fade
                                                         resolver:resolve];

  [_taskQueue addObject:task];
  [RNBootSplash shiftNextTask];
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
