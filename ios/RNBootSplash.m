#import "RNBootSplash.h"
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static UIViewController *_splashViewController = nil;
static UIView *_rootSubView = nil;
static bool _isVisible = false;
static NSString *_storyboardName = nil;
static NSString *_transitionKey = @"BootSplashTransition";

@implementation RNBootSplash

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (void)listenJavaScriptDidFailToLoad {
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onJavaScriptDidFailToLoad:)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:nil];
}

+ (void)unlistenJavaScriptDidFailToLoad {
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidFailToLoadNotification
                                                object:nil];
}

+ (void)onJavaScriptDidFailToLoad:(NSNotification *)notification {
  [RNBootSplash unlistenJavaScriptDidFailToLoad];
  [RNBootSplash hideWithDuration:0];
}

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nonnull)rootView {
  if (_rootSubView != nil || _splashViewController != nil || _isVisible) {
    return;
  }

  _storyboardName = storyboardName;
  _rootSubView = [[[UIStoryboard storyboardWithName:_storyboardName bundle:nil] instantiateInitialViewController] view];

  [RNBootSplash listenJavaScriptDidFailToLoad];

  [UIView performWithoutAnimation:^{
    _rootSubView.frame = rootView.bounds;
    [rootView layoutIfNeeded];
    [rootView addSubview:_rootSubView];
  }];
}

+ (void)initialShow {
  if (_splashViewController != nil || _isVisible) {
    return;
  }

  _isVisible = true;

  _splashViewController = [[UIStoryboard storyboardWithName:_storyboardName bundle:nil] instantiateInitialViewController];
  [_splashViewController setModalPresentationStyle:UIModalPresentationFullScreen];
  [RCTPresentedViewController() presentViewController:_splashViewController animated:false completion:nil];
}

+ (void)showWithDuration:(float)duration {
  if (_splashViewController == nil || _isVisible) {
    return;
  }

  _isVisible = true;
  UIWindow *presentedWindow = [[RCTPresentedViewController() view] window];

  if (presentedWindow != nil) {
    float roundedDuration = lroundf(duration);

    if (roundedDuration <= 0) {
      [[presentedWindow layer] removeAnimationForKey:_transitionKey];
    } else {
      CATransition *transition = [CATransition animation];

      transition.duration = roundedDuration / 1000;
      transition.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseOut];
      transition.type = kCATransitionFade;

      [[presentedWindow layer] addAnimation:transition forKey:_transitionKey];
    }
  }

  [RCTPresentedViewController() presentViewController:_splashViewController animated:false completion:nil];
}

+ (void)hideWithDuration:(float)duration {
  if (_splashViewController == nil || !_isVisible) {
    return;
  }

  _isVisible = false;
  UIWindow *splashWindow = [[_splashViewController view] window];

  if (splashWindow != nil) {
    float roundedDuration = lroundf(duration);

    if (roundedDuration <= 0) {
      [[splashWindow layer] removeAnimationForKey:_transitionKey];
    } else {
      CATransition *transition = [CATransition animation];

      transition.duration = roundedDuration / 1000;
      transition.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseIn];
      transition.type = kCATransitionFade;

      [[splashWindow layer] addAnimation:transition forKey:_transitionKey];
    }
  }

  [_splashViewController dismissViewControllerAnimated:false completion:nil];
}

RCT_EXPORT_METHOD(show:(float)duration) {
  [RNBootSplash showWithDuration:duration];
}

RCT_EXPORT_METHOD(hide:(float)duration) {
  if (_rootSubView != nil) {
    [UIView performWithoutAnimation:^{
      [[_rootSubView superview] layoutIfNeeded];
      [_rootSubView removeFromSuperview];
      _rootSubView = nil;
    }];
  }

  [RNBootSplash unlistenJavaScriptDidFailToLoad];
  [RNBootSplash hideWithDuration:duration];
}

@end
