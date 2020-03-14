#import "RNBootSplash.h"
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static UIViewController *_splashViewController = nil;
static RCTRootView *_rootView = nil;
static bool _visible = false;
static NSString *_storyboardName = nil;
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
  _storyboardName = storyboardName;
  _rootView = rootView;

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:_storyboardName bundle:nil];
  UIView *loadingView = [[storyboard instantiateInitialViewController] view];

  [rootView setLoadingView:loadingView];
  rootView.loadingViewFadeDuration = 0;

  _splashViewController = [storyboard instantiateInitialViewController];
  [_splashViewController setModalPresentationStyle:UIModalPresentationOverFullScreen];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(onJavaScriptDidLoad:)
                                              name:RCTJavaScriptDidLoadNotification
                                            object:[rootView bridge]];
}

+ (void)onJavaScriptDidLoad:(NSNotification *)notification {
  _visible = true;

  [RCTPresentedViewController() presentViewController:_splashViewController animated:false completion:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidLoadNotification
                                                object:[_rootView bridge]];
}

+ (void)initialShow {
  NSLog(@"🚨 [RNBootSplash initialShow] This method as been deprecated and will be removed in a future version. You can safely delete the call.");
}

RCT_EXPORT_METHOD(show:(float)duration) {
  if (_splashViewController == nil || _visible) {
    return;
  }

  _visible = true;

  UIViewController *_presentedViewController = RCTPresentedViewController();
  UIWindow *window = [[_presentedViewController view] window];

  if (window != nil) {
    float roundedDuration = lroundf(duration);

    if (roundedDuration <= 0) {
     [[window layer] removeAnimationForKey:_transitionKey];
    } else {
      CATransition *transition = [CATransition animation];

      transition.duration = roundedDuration / 1000;
      transition.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseOut];
      transition.type = kCATransitionFade;

      [[window layer] addAnimation:transition forKey:_transitionKey];
    }
  }

  [_presentedViewController presentViewController:_splashViewController animated:false completion:nil];
}

RCT_EXPORT_METHOD(hide:(float)duration) {
  if (_splashViewController == nil || !_visible) {
    return;
  }

  _visible = false;

  UIWindow *window = [[_splashViewController view] window];

  if (window != nil) {
    float roundedDuration = lroundf(duration);

    if (roundedDuration <= 0) {
      [[window layer] removeAnimationForKey:_transitionKey];
    } else {
      CATransition *transition = [CATransition animation];

      transition.duration = roundedDuration / 1000;
      transition.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseIn];
      transition.type = kCATransitionFade;

      [[window layer] addAnimation:transition forKey:_transitionKey];
    }
  }

  [_splashViewController dismissViewControllerAnimated:false completion:nil];
}

@end
