#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static NSString* _Nonnull _storyboardName = @"BootSplash";
static RCTRootView* _Nullable _rootView = nil;

static bool _appPaused = true;
static bool _fadeOption = false;

static NSString* _Nullable _taskToRunOnResume = nil;
static NSTimer* _Nullable _timer = nil;
static RCTPromiseResolveBlock _Nullable _pendingResolve = nil;
static UIViewController* _Nullable _viewController = nil;

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
  _storyboardName = storyboardName;
  _rootView = rootView;

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:storyboardName bundle:nil];
  UIView *loadingView = [[storyboard instantiateInitialViewController] view];

  [rootView setLoadingView:loadingView];

  [[NSNotificationCenter defaultCenter] removeObserver:rootView
                                                  name:RCTContentDidAppearNotification
                                                object:rootView];

  _viewController = [storyboard instantiateInitialViewController];
  [_viewController setModalPresentationStyle:UIModalPresentationOverFullScreen];
  [_viewController setModalTransitionStyle:UIModalTransitionStyleCrossDissolve];

  [RCTPresentedViewController() presentViewController:_viewController
                                             animated:false
                                           completion:^{
    [_rootView.loadingView removeFromSuperview];
    _rootView.loadingView = nil;
  }];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(removeJavaScriptLoadingListeners:)
                                               name:RCTJavaScriptDidLoadNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onDidFailToLoadNotification:)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:nil];

  // https://github.com/facebook/react-native/blob/v0.63.2/React/CoreModules/RCTAppState.mm#L73
  for (NSString *name in @[
         UIApplicationDidBecomeActiveNotification,
         UIApplicationDidEnterBackgroundNotification,
         UIApplicationDidFinishLaunchingNotification,
         UIApplicationWillResignActiveNotification,
         UIApplicationWillEnterForegroundNotification
       ]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onAppStateDidChange:)
                                                 name:name
                                               object:nil];
  }
}

+ (void)onAppStateDidChange:(NSNotification *)notification {
  _appPaused = [notification.name isEqualToString:UIApplicationDidEnterBackgroundNotification] ||
               [notification.name isEqualToString:UIApplicationWillResignActiveNotification];

  if (_appPaused || _taskToRunOnResume == nil)
    return;

  if ([_taskToRunOnResume isEqualToString:@"show"]) {
    _timer = [NSTimer scheduledTimerWithTimeInterval:0.05
                                              target:self
                                            selector:@selector(onStaticShowInterval)
                                            userInfo:nil
                                             repeats:true];
  } else if ([_taskToRunOnResume isEqualToString:@"hide"]) {
    _timer = [NSTimer scheduledTimerWithTimeInterval:0.05
                                              target:self
                                            selector:@selector(onStaticHideInterval)
                                            userInfo:nil
                                             repeats:true];
  }

  _taskToRunOnResume = nil;
}

+ (void)removeJavaScriptLoadingListeners:(NSNotification *)notification {
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidLoadNotification
                                                object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidFailToLoadNotification
                                                object:nil];
}

+ (void)onDidFailToLoadNotification:(NSNotification *)notification {
  [RNBootSplash removeJavaScriptLoadingListeners:nil];

  if (_viewController != nil) {
    [_viewController dismissViewControllerAnimated:false completion:^{
      _viewController = nil;
    }];
  }
}

+ (void)onStaticShowInterval {
  if (_rootView.loadingView != nil)
    return; // wait until rootView.loadingView is removed (timer loop)

  if (_timer != nil) {
    [_timer invalidate];
    _timer = nil;
  }

  if (_appPaused) {
    _taskToRunOnResume = @"show";
    return;
  }

  if (_viewController != nil) {
    if (_pendingResolve != nil) {
      _pendingResolve(@(true)); // the splashscreen is already visible
      _pendingResolve = nil;
    }
  } else {
    UIStoryboard *storyboard = [UIStoryboard storyboardWithName:_storyboardName bundle:nil];

    _viewController = [storyboard instantiateInitialViewController];
    [_viewController setModalPresentationStyle:UIModalPresentationOverFullScreen];
    [_viewController setModalTransitionStyle:UIModalTransitionStyleCrossDissolve];

    [RCTPresentedViewController() presentViewController:_viewController
                                               animated:_fadeOption
                                             completion:^{
      if (_pendingResolve != nil) {
        _pendingResolve(@(true));
        _pendingResolve = nil;
      }
    }];
  }
}

+ (void)onStaticHideInterval {
  if (_rootView.loadingView != nil)
    return; // wait until rootView.loadingView is removed (timer loop)

  if (_timer != nil) {
    [_timer invalidate];
    _timer = nil;
  }

  if (_appPaused) {
    _taskToRunOnResume = @"hide";
    return;
  }

  if (_viewController == nil) {
    if (_pendingResolve != nil) {
      _pendingResolve(@(true)); // the splashscreen is already hidden
      _pendingResolve = nil;
    }
  } else {
    [_viewController dismissViewControllerAnimated:_fadeOption
                                        completion:^{
      if (_pendingResolve != nil) {
        _pendingResolve(@(true));
        _pendingResolve = nil;
      }

      _viewController = nil;
    }];
  }
}

- (void)onShowInterval {
  [RNBootSplash onStaticShowInterval];
}

- (void)onHideInterval {
  [RNBootSplash onStaticHideInterval];
}

RCT_REMAP_METHOD(show,
                 showWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_rootView == nil)
    return reject(@"uninitialized_module", @"react-native-bootsplash has not been initialized", nil);

  if (_pendingResolve != nil)
    return reject(@"task_already_pending", @"A bootsplash task is already pending", nil);

  _fadeOption = fade;
  _pendingResolve = resolve;

  _timer = [NSTimer scheduledTimerWithTimeInterval:0.05
                                            target:self
                                          selector:@selector(onShowInterval)
                                          userInfo:nil
                                           repeats:true];
}

RCT_REMAP_METHOD(hide,
                 hideWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_rootView == nil)
    return reject(@"uninitialized_module", @"react-native-bootsplash has not been initialized", nil);

  if (_pendingResolve != nil)
    return reject(@"task_already_pending", @"A bootsplash task is already pending", nil);

  _fadeOption = fade;
  _pendingResolve = resolve;

  _timer = [NSTimer scheduledTimerWithTimeInterval:0.05
                                            target:self
                                          selector:@selector(onHideInterval)
                                          userInfo:nil
                                           repeats:true];
}

RCT_REMAP_METHOD(getVisibilityStatus,
                 getVisibilityStatusWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_pendingResolve != nil) {
    resolve(@"transitioning");
  } else {
    resolve(_viewController != nil ? @"visible" : @"hidden");
  }
}

@end
