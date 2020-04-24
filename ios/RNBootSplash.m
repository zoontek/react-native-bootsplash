#import "RNBootSplash.h"
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static RCTRootView *_rootView = nil;
static UIViewController *_splashViewController = nil;
static bool _visible = false;
static NSString *_transitionKey = @"BootSplashTransition";

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

  _splashViewController = [storyboard instantiateInitialViewController];
  [_splashViewController setModalPresentationStyle:UIModalPresentationOverFullScreen];

  [[NSNotificationCenter defaultCenter] removeObserver:rootView
                                                  name:RCTContentDidAppearNotification
                                                object:rootView];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(onJavaScriptDidLoad:)
                                              name:RCTJavaScriptDidLoadNotification
                                            object:[rootView bridge]];
}

+ (void)removeLoadingView {
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(_rootView.loadingViewFadeDelay * NSEC_PER_SEC)),
                 dispatch_get_main_queue(), ^{
    [_rootView.loadingView removeFromSuperview];
    _rootView.loadingView = nil;
  });
}

+ (void)onJavaScriptDidLoad:(NSNotification *)notification {
  _visible = true;

  [RCTPresentedViewController() presentViewController:_splashViewController animated:false completion:^{
    [RNBootSplash removeLoadingView];
  }];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidLoadNotification
                                                object:[_rootView bridge]];
}

+ (void)initialShow {
  NSLog(@"🚨 [RNBootSplash initialShow] This method as been deprecated and will be removed in a future version. You can safely delete the call.");
}

+ (void)setAnimationForWindow:(UIWindow * _Nullable)window
                     duration:(float)duration
               timingFunction:(CAMediaTimingFunctionName _Nonnull)function {
  if (window == nil)
    return;

  float roundedDuration = lroundf(duration);

  if (roundedDuration <= 0)
    return [[window layer] removeAnimationForKey:_transitionKey];

  CATransition *transition = [CATransition animation];
  transition.duration = roundedDuration / 1000;
  transition.type = kCATransitionFade;
  transition.timingFunction = [CAMediaTimingFunction functionWithName:function];

  [[window layer] addAnimation:transition
                        forKey:_transitionKey];
}

RCT_EXPORT_METHOD(show:(float)duration) {
  if (_splashViewController == nil || _visible)
    return;

  _visible = true;

  UIViewController *_presentedViewController = RCTPresentedViewController();

  [RNBootSplash setAnimationForWindow:[[_presentedViewController view] window]
                             duration:duration
                       timingFunction:kCAMediaTimingFunctionEaseOut];

  [_presentedViewController presentViewController:_splashViewController animated:false completion:nil];
}

RCT_EXPORT_METHOD(hide:(float)duration) {
  if (_splashViewController == nil || !_visible)
    return;

  _visible = false;

  [RNBootSplash setAnimationForWindow:[[_splashViewController view] window]
                             duration:duration
                       timingFunction:kCAMediaTimingFunctionEaseIn];

  [_splashViewController dismissViewControllerAnimated:false completion:nil];
}

@end
