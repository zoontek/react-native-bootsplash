#import "RNBootSplash.h"

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

static NSMutableArray<RCTPromiseResolveBlock> *_resolverQueue = nil;
static RCTRootView *_rootView = nil;
static bool _isTransitioning = false;
static bool _shouldPreventInit = false;

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

  if (_shouldPreventInit)
    return;

  [_rootView setLoadingView:loadingView];

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
  [self removeLoadingView];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (bool)isHidden {
  return _rootView == nil || _rootView.loadingView == nil || [_rootView.loadingView isHidden];
}

+ (void)removeLoadingView {
  if (![self isHidden]) {
    _rootView.loadingView.hidden = YES;
    [_rootView.loadingView removeFromSuperview];
    _rootView.loadingView = nil;
  }
}

- (void)ensureResolverQueue {
  if (_resolverQueue == nil)
    _resolverQueue = [[NSMutableArray alloc] init];
}

- (void)clearResolverQueue {
  [self ensureResolverQueue];

  while ([_resolverQueue count] > 0) {
    RCTPromiseResolveBlock resolve = [_resolverQueue objectAtIndex:0];
    [_resolverQueue removeObjectAtIndex:0];

    resolve(@(true));
  }
}

RCT_REMAP_METHOD(hide,
                 hideWithFade:(BOOL)fade
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  _shouldPreventInit = true;

  if ([RNBootSplash isHidden] || RCTRunningInAppExtension())
    return resolve(@(true));

  [self ensureResolverQueue];
  [_resolverQueue addObject:resolve];

  if (!fade) {
    [RNBootSplash removeLoadingView];
    return [self clearResolverQueue];
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

      return [self clearResolverQueue];
    }];
  });
}

RCT_REMAP_METHOD(getVisibilityStatus,
                 getVisibilityStatusWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  if ([RNBootSplash isHidden])
    return resolve(@"hidden");
  else if (_isTransitioning)
    return resolve(@"transitioning");
  else
    return resolve(@"visible");
}

@end
