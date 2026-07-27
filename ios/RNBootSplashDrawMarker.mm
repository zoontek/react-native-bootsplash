#ifdef RCT_NEW_ARCH_ENABLED

#import "RNBootSplashDrawMarker.h"
#import "RNBootSplash.h"

#import <react/renderer/components/RNBootSplashSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNBootSplashSpec/Props.h>

using namespace facebook::react;

#pragma mark - Marker

@interface RNBootSplashDrawMarkerView : UIView

@property (nonatomic, assign) BOOL fade;

@end

@implementation RNBootSplashDrawMarkerView {
  BOOL _hasDrawn;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _hasDrawn = NO;
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
  [self scheduleBootSplashHide];
}

- (void)scheduleBootSplashHide {
  BOOL fade = _fade;

  dispatch_async(dispatch_get_main_queue(), ^{
    [RNBootSplash hideWithFade:fade];
  });
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
    self.contentView = _markerView;
  }

  return self;
}

- (void)updateProps:(const Props::Shared &)props
           oldProps:(const Props::Shared &)oldProps {
  _markerView.fade = std::static_pointer_cast<const RNBootSplashDrawMarkerProps>(props)->fade;
  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> RNBootSplashDrawMarkerCls(void) {
  return RNBootSplashDrawMarker.class;
}

#endif
