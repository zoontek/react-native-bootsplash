package com.zoontek.rnbootsplash;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = RNBootSplashModuleImpl.NAME)
public class RNBootSplashModule extends NativeRNBootSplashSpec {

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return RNBootSplashModuleImpl.NAME;
  }

  @Override
  public void hide(double duration, Promise promise) {
    RNBootSplashModuleImpl.hide(getReactApplicationContext(), duration, promise);
  }

  @Override
  public void getVisibilityStatus(Promise promise) {
    RNBootSplashModuleImpl.getVisibilityStatus(promise);
  }
}
