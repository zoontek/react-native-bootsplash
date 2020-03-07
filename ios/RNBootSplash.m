#import "RNBootSplash.h"
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static UIViewController *_splashViewController = nil;
static bool _isVisible = false;
static NSString *_transitionKey = @"BootSplashTransition";

@implementation RNBootSplash

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (instancetype)init {
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onJavaScriptDidFailToLoad:)
                                                 name:RCTJavaScriptDidFailToLoadNotification
                                               object:nil];
  }

  return self;
}

- (void)onJavaScriptDidFailToLoad:(NSNotification *)notification {
  [self unlistenJavaScriptDidFailToLoad];
  [self hideWithDuration:0];
}

- (void)unlistenJavaScriptDidFailToLoad {
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                              name:RCTJavaScriptDidFailToLoadNotification
                                            object:nil];
}

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName {
  if (_splashViewController != nil || _isVisible) {
    return;
  }

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:storyboardName bundle:nil];

  if (storyboard != nil) {
    _splashViewController = [storyboard instantiateInitialViewController];
    [_splashViewController setModalPresentationStyle:UIModalPresentationFullScreen];
    _isVisible = true;
    [RCTPresentedViewController() presentViewController:_splashViewController animated:false completion:nil];
  }
}

- (void)showWithDuration:(float)duration {
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

- (void)hideWithDuration:(float)duration {
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
  [self showWithDuration:duration];
}

RCT_EXPORT_METHOD(hide:(float)duration) {
  [self unlistenJavaScriptDidFailToLoad];
  [self hideWithDuration:duration];
}

@end
