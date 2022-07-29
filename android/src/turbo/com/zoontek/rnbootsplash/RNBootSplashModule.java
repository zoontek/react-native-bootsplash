package com.zoontek.rnbootsplash;


import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.reactnativeturbo.NativeBootSplashSpec;


@ReactModule(name = RNBootSplashImpl.NAME)
public class RNBootSplashModule extends NativeBootSplashSpec {

  public static final String NAME = RNBootSplashImpl.NAME;

  RNBootSplashModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  @NonNull
  public String getName() {
    return RNBootSplashImpl.NAME;
  }

  @Override
  @ReactMethod
  public void hide(final boolean fade, final Promise promise) {
    RNBootSplashImpl.hide(fade, getReactApplicationContext().getCurrentActivity(), promise);
  }

  @Override
  @ReactMethod
  public void getVisibilityStatus(final Promise promise) {
    RNBootSplashImpl.getVisibilityStatus(promise);
  }
}
