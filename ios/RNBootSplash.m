#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static NSString *_storyboardName = @"BootSplash";
static RCTRootView *_rootView = nil;

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

@implementation RNBootSplash {
  NSMutableArray<RNBootSplashTask *> *_taskQueue;
  RNBootSplashStatus _status;
  UIViewController *_splashVC;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nonnull)rootView {
  _storyboardName = storyboardName;
  _rootView = rootView;

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:_storyboardName bundle:nil];
  [_rootView setLoadingView:[[storyboard instantiateInitialViewController] view]];

  [[NSNotificationCenter defaultCenter] removeObserver:rootView
                                                  name:RCTContentDidAppearNotification
                                                object:rootView];
}

- (instancetype)init {
  if ((self = [super init])) {
    if (_rootView == nil) {
      _status = RNBootSplashStatusHidden;
      return self;
    }

    _taskQueue = [[NSMutableArray alloc] init];
    _status = RNBootSplashStatusVisible;

    UIStoryboard *storyboard = [UIStoryboard storyboardWithName:_storyboardName bundle:nil];

    // handle development reload
    if (_rootView.loadingView == nil)
      [_rootView setLoadingView:[[storyboard instantiateInitialViewController] view]];

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
                                             selector:@selector(removeJavaScriptLoadingObservers:)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(invalidate)
                                                 name:RCTJavaScriptDidFailToLoadNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(shiftNextTask)
                                                 name:UIApplicationDidBecomeActiveNotification
                                               object:nil];
  }

  return self;
}

- (void)invalidate {
  if (_splashVC != nil) {
    [_splashVC dismissViewControllerAnimated:false
                                  completion:^{
      self->_splashVC = nil;
    }];
  }

  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)removeJavaScriptLoadingObservers:(NSNotification *)notification {
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidLoadNotification
                                                object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidFailToLoadNotification
                                                object:nil];
}

- (void)shiftNextTask {
  bool shouldSkipTick = _rootView.loadingView != nil
    || _status == RNBootSplashStatusTransitioning
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

- (void)showWithTask:(RNBootSplashTask *)task {
  if (_splashVC != nil) {
    task.resolve(@(true)); // splash screen is already visible
    [self shiftNextTask];
  } else {
    _status = RNBootSplashStatusTransitioning;

    _splashVC = [[UIStoryboard storyboardWithName:_storyboardName bundle:nil] instantiateInitialViewController];
    [_splashVC setModalPresentationStyle:UIModalPresentationOverFullScreen];
    [_splashVC setModalTransitionStyle:UIModalTransitionStyleCrossDissolve];

    [RCTPresentedViewController() presentViewController:_splashVC
                                               animated:task.fade
                                             completion:^{
      self->_status = RNBootSplashStatusVisible;
      task.resolve(@(true));
      [self shiftNextTask];
    }];
  }
}

- (void)hideWithTask:(RNBootSplashTask *)task {
  if (_splashVC == nil) {
    task.resolve(@(true)); // splash screen is already hidden
    [self shiftNextTask];
  } else {
    _status = RNBootSplashStatusTransitioning;

    [_splashVC dismissViewControllerAnimated:task.fade
                                  completion:^{
      self->_splashVC = nil;
      self->_status = RNBootSplashStatusHidden;
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
    return reject(@"uninitialized_module", @"react-native-bootsplash has not been initialized", nil);

  RNBootSplashTask *task = [[RNBootSplashTask alloc] initWithType:RNBootSplashTaskTypeShow
                                                             fade:fade
                                                         resolver:resolve
                                                         rejecter:reject];

  [_taskQueue addObject:task];
  [self shiftNextTask];
}

RCT_REMAP_METHOD(hide,
                 hideWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_rootView == nil)
    return reject(@"uninitialized_module", @"react-native-bootsplash has not been initialized", nil);

  RNBootSplashTask *task = [[RNBootSplashTask alloc] initWithType:RNBootSplashTaskTypeHide
                                                             fade:fade
                                                         resolver:resolve
                                                         rejecter:reject];

  [_taskQueue addObject:task];
  [self shiftNextTask];
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
