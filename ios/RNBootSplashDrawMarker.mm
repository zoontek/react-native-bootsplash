#ifdef RCT_NEW_ARCH_ENABLED

#import "RNBootSplashDrawMarker.h"
#import "RNBootSplash.h"

#import <react/renderer/components/RNBootSplashSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNBootSplashSpec/EventEmitters.h>
#import <react/renderer/components/RNBootSplashSpec/Props.h>

using namespace facebook::react;

#pragma mark - Marker

@interface RNBootSplashDrawMarker ()

- (void)emitOnDrawn;

@end

@interface RNBootSplashDrawMarkerView : UIView

@property (nonatomic, assign) BOOL autoHide;
@property (nonatomic, assign) BOOL fade;
@property (nonatomic, weak) RNBootSplashDrawMarker *owner;

- (void)reset;

@end

@implementation RNBootSplashDrawMarkerView {
  BOOL _hasDrawn;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _hasDrawn = NO;
    _autoHide = YES;
    _fade = NO;

    self.opaque = NO;
    self.backgroundColor = UIColor.clearColor;
    self.contentMode = UIViewContentModeRedraw;
  }

  return self;
}

- (void)didMoveToWindow {
  [super didMoveToWindow];

  if (self.window != nil && !_hasDrawn) {
    [self setNeedsDisplay];
  }
}

- (void)drawRect:(CGRect)rect {
  [super drawRect:rect];

  if (_hasDrawn) {
    return;
  }

  _hasDrawn = YES;
  [self scheduleDrawn];
}

- (void)scheduleDrawn {
  BOOL autoHide = _autoHide;
  BOOL fade = _fade;

  dispatch_async(dispatch_get_main_queue(), ^{
    if (autoHide) {
      [RNBootSplash hideWithFade:fade];
    }

    [self.owner emitOnDrawn];
  });
}

- (void)reset {
  _hasDrawn = NO;
}

@end

#pragma mark - Component view

@implementation RNBootSplashDrawMarker {
  RNBootSplashDrawMarkerView *_markerView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<RNBootSplashDrawMarkerComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNBootSplashDrawMarkerProps>();
    _props = defaultProps;

    _markerView = [[RNBootSplashDrawMarkerView alloc] initWithFrame:CGRectZero];
    _markerView.owner = self;
    self.contentView = _markerView;
  }

  return self;
}

- (void)emitOnDrawn {
  // The marker emits after a runloop hop, the view could have been recycled in the meantime
  if (!_eventEmitter) {
    return;
  }

  static_cast<const RNBootSplashDrawMarkerEventEmitter &>(*_eventEmitter).onDrawn({});
}

- (void)updateProps:(const Props::Shared &)props
           oldProps:(const Props::Shared &)oldProps {
  const auto &markerProps = *std::static_pointer_cast<const RNBootSplashDrawMarkerProps>(props);

  _markerView.autoHide = markerProps.autoHide;
  _markerView.fade = markerProps.fade;

  [super updateProps:props oldProps:oldProps];
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  [_markerView reset];
}

@end

Class<RCTComponentViewProtocol> RNBootSplashDrawMarkerCls(void) {
  return RNBootSplashDrawMarker.class;
}

#endif
