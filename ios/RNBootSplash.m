#import "RNBootSplash.h"
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static UIViewController *_viewController = nil;
static UIView *_rootSubView = nil;
static bool _visible = false;
static NSString *_storyboardName = nil;
static NSString *_transitionKey = @"BootSplashTransition";

@implementation RNBootSplash

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (void)unlistenDidFailToLoad {
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTJavaScriptDidFailToLoadNotification
                                                object:nil];
}

+ (void)removeRootSubView {
  if (_rootSubView == nil) {
    return;
  }

  [UIView performWithoutAnimation:^{
    [[_rootSubView superview] layoutIfNeeded];
    [_rootSubView removeFromSuperview];
    _rootSubView = nil;
  }];
}

+ (void)onJavaScriptDidFailToLoad:(NSNotification *)notification {
  [RNBootSplash unlistenDidFailToLoad];
  [RNBootSplash removeRootSubView];
  [RNBootSplash hideWithDuration:0];
}

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nonnull)rootView {
  if (_rootSubView != nil || _viewController != nil || _visible) {
    return;
  }

  _rootSubView = [[[UIStoryboard storyboardWithName:storyboardName bundle:nil] instantiateInitialViewController] view];
  _storyboardName = storyboardName;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(onJavaScriptDidFailToLoad:)
                                              name:RCTJavaScriptDidFailToLoadNotification
                                            object:nil];

  [UIView performWithoutAnimation:^{
    CGRect frame = rootView.frame;
    frame.origin = CGPointMake(0, 0);
    _rootSubView.frame = frame;

    [rootView layoutIfNeeded];
    [rootView addSubview:_rootSubView];
  }];
}

+ (void)initialShow {
  if (_viewController != nil || _visible) {
    return;
  }

  _visible = true;

  _viewController = [[UIStoryboard storyboardWithName:_storyboardName bundle:nil] instantiateInitialViewController];
  [_viewController setModalPresentationStyle:UIModalPresentationFullScreen];
  [RCTPresentedViewController() presentViewController:_viewController animated:false completion:nil];
}

+ (void)showWithDuration:(float)duration {
  if (_viewController == nil || _visible) {
    return;
  }

  _visible = true;

  UIWindow *window = [[RCTPresentedViewController() view] window];

  if (window != nil) {
    float roundedDuration = lroundf(duration);

    if (roundedDuration > 0) {
      CATransition *transition = [CATransition animation];

      transition.duration = roundedDuration / 1000;
      transition.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseOut];
      transition.type = kCATransitionFade;

      [[window layer] addAnimation:transition forKey:_transitionKey];
    } else {
      [[window layer] removeAnimationForKey:_transitionKey];
    }
  }

  [RCTPresentedViewController() presentViewController:_viewController animated:false completion:nil];
}

+ (void)hideWithDuration:(float)duration {
  if (_viewController == nil || !_visible) {
    return;
  }

  _visible = false;

  UIWindow *window = [[_viewController view] window];

  if (window != nil) {
    float roundedDuration = lroundf(duration);

    if (roundedDuration > 0) {
      CATransition *transition = [CATransition animation];

      transition.duration = roundedDuration / 1000;
      transition.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseIn];
      transition.type = kCATransitionFade;

      [[window layer] addAnimation:transition forKey:_transitionKey];
    } else {
      [[window layer] removeAnimationForKey:_transitionKey];
    }
  }

  [_viewController dismissViewControllerAnimated:false completion:nil];
}

RCT_EXPORT_METHOD(show:(float)duration) {
  [RNBootSplash showWithDuration:duration];
}

RCT_EXPORT_METHOD(hide:(float)duration) {
  [RNBootSplash unlistenDidFailToLoad];
  [RNBootSplash removeRootSubView];
  [RNBootSplash hideWithDuration:duration];
}

@end
