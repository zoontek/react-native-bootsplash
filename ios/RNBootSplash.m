#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

#import "RNBootSplash.h"

static RCTRootView *_rootView = nil;
static bool _isTransitioning = false;
static bool _hideHasBeenCalled = false;

@implementation RNBootSplash

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(RCTRootView * _Nullable)rootView {
  if (rootView == nil || _rootView != nil || RCTRunningInAppExtension())
    return;

  _rootView = rootView;

  [[NSNotificationCenter defaultCenter] removeObserver:rootView
                                                  name:RCTContentDidAppearNotification
                                                object:rootView];

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:storyboardName bundle:nil];
  UIView *loadingView = [[storyboard instantiateInitialViewController] view];

  if (_hideHasBeenCalled)
    return;

  [_rootView setLoadingView:loadingView];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onContentDidAppear)
                                                  name:RCTContentDidAppearNotification
                                                object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onJavaScriptDidFailToLoad)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:nil];
}

+ (bool)isHidden {
  return _rootView == nil || _rootView.loadingView == nil || [_rootView.loadingView isHidden];
}

+ (void)removeLoadingView {
  _rootView.loadingView.hidden = YES;
  [_rootView.loadingView removeFromSuperview];
  _rootView.loadingView = nil;
}

+ (void)onContentDidAppear {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (void)onJavaScriptDidFailToLoad {
  if (![self isHidden])
    [self removeLoadingView];

  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

RCT_REMAP_METHOD(hide,
                 hideWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_hideHasBeenCalled || RCTRunningInAppExtension())
    return resolve(@(true));

  _hideHasBeenCalled = true;

  if ([RNBootSplash isHidden])
    return resolve(@(true));

  if (!fade) {
    [RNBootSplash removeLoadingView];
    return resolve(@(true));
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    _isTransitioning = true;

    [UIView transitionWithView:_rootView
                      duration:0.220
                       options:UIViewAnimationOptionTransitionCrossDissolve
                    animations:^{
      _rootView.loadingView.hidden = YES;
    }
                    completion:^(__unused BOOL finished) {
      [_rootView.loadingView removeFromSuperview];
      _rootView.loadingView = nil;

      _isTransitioning = false;
      resolve(@(true));
    }];
  });
}

RCT_REMAP_METHOD(getVisibilityStatus,
                 getVisibilityStatusWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_isTransitioning)
    return resolve(@"transitioning");

  if ([RNBootSplash isHidden])
    return resolve(@"hidden");
  else
    return resolve(@"visible");
}

@end
