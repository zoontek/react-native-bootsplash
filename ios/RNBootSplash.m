#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static NSMutableArray<RNBootSplashTask *> *_taskQueue = nil;
static NSString *_storyboardName = @"BootSplash";
static RCTRootView *_rootView = nil;
static RNBootSplashStatus _status = RNBootSplashStatusHidden;
static UIViewController *_splashVC = nil;

@implementation RNBootSplashTask

- (instancetype)initWithType:(RNBootSplashTaskType)type
                        fade:(BOOL)fade
                    resolver:(RCTPromiseResolveBlock _Nonnull)resolve
                    rejecter:(RCTPromiseRejectBlock _Nonnull)reject {
  if (self = [super init]) {
    _type = type;
    _fade = fade;
    _resolve = resolve;
    _reject = reject;
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
  _storyboardName = storyboardName;
  _taskQueue = [[NSMutableArray alloc] init];

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:_storyboardName bundle:nil];
  [_rootView setLoadingView:[[storyboard instantiateInitialViewController] view]];

  [[NSNotificationCenter defaultCenter] removeObserver:rootView
                                                  name:RCTContentDidAppearNotification
                                                object:rootView];

  _splashVC = [storyboard instantiateInitialViewController];
  [_splashVC setModalPresentationStyle:UIModalPresentationOverFullScreen];
  [_splashVC setModalTransitionStyle:UIModalTransitionStyleCrossDissolve];

  [RCTPresentedViewController() presentViewController:_splashVC
                                             animated:false
                                           completion:^{
    [_rootView.loadingView removeFromSuperview];
    _rootView.loadingView = nil;

    [self shiftNextTask]; // JS thread might started pushing tasks
  }];

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
  if (_splashVC != nil) {
    [_splashVC dismissViewControllerAnimated:false
                                  completion:^{
      _splashVC = nil;
    }];
  }

  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (void)shiftNextTask {
  bool shouldSkipTick = _rootView.loadingView != nil
    || _status == RNBootSplashStatusTransitioningToVisible
    || _status == RNBootSplashStatusTransitioningToHidden
    || [_taskQueue count] == 0
    || [[UIApplication sharedApplication] applicationState] == UIApplicationStateBackground;

  if (shouldSkipTick) return;

  RNBootSplashTask *task = [_taskQueue objectAtIndex:0];
  [_taskQueue removeObjectAtIndex:0];

  switch (task.type) {
    case RNBootSplashTaskTypeShow:
      return [self showWithTask:task];
    case RNBootSplashTaskTypeHide:
      return [self hideWithTask:task];
  }
}

+ (void)showWithTask:(RNBootSplashTask *)task {
  if (_splashVC != nil) {
    task.resolve(@(true)); // splash screen is already visible
    [self shiftNextTask];
  } else {
    _status = RNBootSplashStatusTransitioningToVisible;

    _splashVC = [[UIStoryboard storyboardWithName:_storyboardName bundle:nil] instantiateInitialViewController];
    [_splashVC setModalPresentationStyle:UIModalPresentationOverFullScreen];
    [_splashVC setModalTransitionStyle:UIModalTransitionStyleCrossDissolve];

    [RCTPresentedViewController() presentViewController:_splashVC
                                               animated:task.fade
                                             completion:^{
      _status = RNBootSplashStatusVisible;

      task.resolve(@(true));
      [self shiftNextTask];
    }];
  }
}

+ (void)hideWithTask:(RNBootSplashTask *)task {
  if (_splashVC == nil) {
    task.resolve(@(true)); // splash screen is already hidden
    [self shiftNextTask];
  } else {
    _status = RNBootSplashStatusTransitioningToHidden;

    [_splashVC dismissViewControllerAnimated:task.fade
                                  completion:^{
      _splashVC = nil;
      _status = RNBootSplashStatusHidden;

      task.resolve(@(true));
      [self shiftNextTask];
    }];
  }
}

RCT_REMAP_METHOD(show,
                 showWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_rootView == nil)
    return reject(@"uninitialized_module", @"react-native-bootsplash has not been initialized, or has been too early", nil);

  RNBootSplashTask *task = [[RNBootSplashTask alloc] initWithType:RNBootSplashTaskTypeShow
                                                             fade:fade
                                                         resolver:resolve
                                                         rejecter:reject];

  [_taskQueue addObject:task];
  [RNBootSplash shiftNextTask];
}

RCT_REMAP_METHOD(hide,
                 hideWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_rootView == nil)
    return reject(@"uninitialized_module", @"react-native-bootsplash has not been initialized, or has been too early", nil);

  RNBootSplashTask *task = [[RNBootSplashTask alloc] initWithType:RNBootSplashTaskTypeHide
                                                             fade:fade
                                                         resolver:resolve
                                                         rejecter:reject];

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
    case RNBootSplashStatusTransitioningToVisible:
    case RNBootSplashStatusTransitioningToHidden:
      return resolve(@"transitioning");
  }
}

@end
