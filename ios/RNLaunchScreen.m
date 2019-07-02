#import "RNLaunchScreen.h"
#import <React/RCTBridge.h>
#import <UIKit/UIKit.h>

static UIView* launchScreen = nil;
static bool isFlaggedAsHidden = false;

@implementation RNLaunchScreen

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (void)show:(NSString * _Nonnull)name
      inView:(RCTRootView * _Nonnull)view {
  if (launchScreen != nil) {
    return NSLog(@"🚨 [RNLaunchScreen] show method is called more than once");
  }

  @try {
    UIView *xib = [[[NSBundle mainBundle] loadNibNamed:name owner:self options:nil] firstObject];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleJavaScriptDidFailToLoad:)
                                                 name:RCTJavaScriptDidFailToLoadNotification
                                               object:nil];

    xib.frame = [view bounds];
    launchScreen = xib;
    [view addSubview:xib];
  }
  @catch (NSException *exception) {
    NSLog(@"🚨 [RNLaunchScreen] File \"%@\" does not exists or is not copied in app bundle resources", name);
  }
}

- (void)removeFromView {
  [launchScreen removeFromSuperview];
  launchScreen = nil;
}

- (void)handleJavaScriptDidFailToLoad:(NSNotification *)notification {
  [self removeFromView];
}

RCT_EXPORT_METHOD(hide:(float)duration) {
  if (launchScreen == nil || isFlaggedAsHidden) return;
  isFlaggedAsHidden = true;

  float roundedDuration = lroundf(duration);

  if (roundedDuration <= 0) {
    return [self removeFromView];
  }

  [UIView animateWithDuration:roundedDuration / 1000
                        delay:0.0
                      options:UIViewAnimationOptionCurveEaseIn
                   animations:^{
                     launchScreen.alpha = 0;
                   }
                   completion:^(BOOL finished) {
                     [self removeFromView];
                   }];
}

@end
