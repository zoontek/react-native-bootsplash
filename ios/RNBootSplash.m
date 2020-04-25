#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static RCTRootView *_rootView = nil;
static bool _animated = false;
static bool _visible = false;
static UIViewController *_bootsplashViewController = nil;
static NSTimer *_timer = nil;
static RCTPromiseResolveBlock _resolve = nil;

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

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:storyboardName bundle:nil];
  UIView *loadingView = [[storyboard instantiateInitialViewController] view];

  [rootView setLoadingView:loadingView];
  rootView.loadingViewFadeDelay = 0.1;
  rootView.loadingViewFadeDuration = 0;

  _bootsplashViewController = [storyboard instantiateInitialViewController];
  [_bootsplashViewController setModalPresentationStyle:UIModalPresentationOverFullScreen];
  [_bootsplashViewController setModalTransitionStyle:UIModalTransitionStyleCrossDissolve];

  [[NSNotificationCenter defaultCenter] removeObserver:rootView
                                                  name:RCTContentDidAppearNotification
                                                object:rootView];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(onJavaScriptDidLoad:)
                                              name:RCTJavaScriptDidLoadNotification
                                            object:[rootView bridge]];
}

+ (void)onJavaScriptDidLoad:(NSNotification *)notification {
  _visible = true;

  [RCTPresentedViewController() presentViewController:_bootsplashViewController
                                             animated:false
                                           completion:^{
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(_rootView.loadingViewFadeDelay * NSEC_PER_SEC)),
                   dispatch_get_main_queue(), ^{
      [_rootView.loadingView removeFromSuperview];
      _rootView.loadingView = nil;
    });
  }];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidLoadNotification
                                                object:[_rootView bridge]];
}

- (void)onHideInterval {
  if (_rootView.loadingView != nil)
    return; // wait until rootView.loadingView is removed

  [_timer invalidate];
  _timer = nil;

  [_bootsplashViewController dismissViewControllerAnimated:_animated
                                                completion:^{
    _resolve(@(true));
    _resolve = nil;
  }];
}

RCT_REMAP_METHOD(show,
                 showWithAnimated:(BOOL)animated
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_bootsplashViewController == nil)
    return reject(@"uninitialized_bootsplash", @"Your bootsplash has not been initialized. Add the `initWithStoryboard` method call to your `AppDelegate.m`.", nil);

  if (_visible)
    return reject(@"visible_bootsplash", @"Your bootsplash is already visible. Calling `show` here have no effect.", nil);

  _visible = true;

  [RCTPresentedViewController() presentViewController:_bootsplashViewController
                                             animated:animated
                                           completion:^{
    resolve(@(true));
  }];
}

RCT_REMAP_METHOD(hide,
                 hideWithAnimated:(BOOL)animated
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_bootsplashViewController == nil)
    return reject(@"uninitialized_bootsplash", @"Your bootsplash has not been initialized. Add the `initWithStoryboard` method call to your `AppDelegate.m`.", nil);

  if (!_visible)
    return reject(@"hidden_bootsplash", @"Your bootsplash is already hidden. Calling `hide` here have no effect.", nil);

  _visible = false;
  _animated = animated;
  _resolve = resolve;

  _timer = [NSTimer scheduledTimerWithTimeInterval:0.05
                                            target:self
                                          selector:@selector(onHideInterval)
                                          userInfo:nil
                                           repeats:true];
}

@end
