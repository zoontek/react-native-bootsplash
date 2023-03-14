#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static NSMutableArray<RCTPromiseResolveBlock> *_resolverQueue = nil;
static RCTRootView *_rootView = nil;
static float _duration = 0;
static bool _nativeHidden = false;
static bool _transitioning = false;

@implementation RNBootSplash

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (bool)isLoadingViewHidden {
  return _rootView == nil || _rootView.loadingView == nil || [_rootView.loadingView isHidden];
}

+ (bool)hasResolverQueue {
  return _resolverQueue != nil;
}

+ (void)clearResolverQueue {
  if (![self hasResolverQueue])
    return;

  while ([_resolverQueue count] > 0) {
    RCTPromiseResolveBlock resolve = [_resolverQueue objectAtIndex:0];
    [_resolverQueue removeObjectAtIndex:0];
    resolve(@(true));
  }
}

+ (void)hideLoadingView {
  if ([self isLoadingViewHidden])
    return [RNBootSplash clearResolverQueue];

  if (_duration <= 0) {
    _rootView.loadingView.hidden = YES;
    [_rootView.loadingView removeFromSuperview];
    _rootView.loadingView = nil;

    return [RNBootSplash clearResolverQueue];
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      _transitioning = true;

      [UIView transitionWithView:_rootView
                        duration:_duration / 1000.0
                         options:UIViewAnimationOptionTransitionCrossDissolve
                      animations:^{
        _rootView.loadingView.hidden = YES;
      }
                      completion:^(__unused BOOL finished) {
        [_rootView.loadingView removeFromSuperview];
        _rootView.loadingView = nil;

        _transitioning = false;
        return [RNBootSplash clearResolverQueue];
      }];
    });
  }
}

+ (void)initWithStoryboard:(NSString * _Nonnull)storyboardName
                  rootView:(UIView * _Nullable)rootView {
  if (rootView == nil
      || ![rootView isKindOfClass:[RCTRootView class]]
      || _rootView != nil
      || [self hasResolverQueue] // hide has already been called, abort init
      || RCTRunningInAppExtension())
    return;

  _rootView = (RCTRootView *)rootView;

  [[NSNotificationCenter defaultCenter] removeObserver:rootView
                                                  name:RCTContentDidAppearNotification
                                                object:rootView];

  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:storyboardName bundle:nil];
  UIView *loadingView = [[storyboard instantiateInitialViewController] view];

  [_rootView setLoadingView:loadingView];

  [NSTimer scheduledTimerWithTimeInterval:0.35
                                  repeats:NO
                                    block:^(NSTimer * _Nonnull timer) {
    // wait for native iOS launch screen to fade out
    _nativeHidden = true;

    // hide has been called before native launch screen fade out
    if ([self hasResolverQueue])
      [self hideLoadingView];
  }];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onJavaScriptDidLoad)
                                               name:RCTJavaScriptDidLoadNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onJavaScriptDidFailToLoad)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:nil];
}

+ (void)onJavaScriptDidLoad {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (void)onJavaScriptDidFailToLoad {
  [self hideLoadingView];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

RCT_REMAP_METHOD(hide,
                 hideWithDuration:(double)duration
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if (_resolverQueue == nil)
    _resolverQueue = [[NSMutableArray alloc] init];

  [_resolverQueue addObject:resolve];

  if ([RNBootSplash isLoadingViewHidden] || RCTRunningInAppExtension())
    return [RNBootSplash clearResolverQueue];

  _duration = lroundf((float)duration);

  if (_nativeHidden)
    return [RNBootSplash hideLoadingView];
}

RCT_REMAP_METHOD(getVisibilityStatus,
                 getVisibilityStatusWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if ([RNBootSplash isLoadingViewHidden])
    return resolve(@"hidden");
  else if (_transitioning)
    return resolve(@"transitioning");
  else
    return resolve(@"visible");
}

@end
