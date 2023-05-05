package com.zoontek.rnbootsplash;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = RNBootSplashModuleImpl.NAME)
public class RNBootSplashModule extends ReactContextBaseJavaModule {

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return RNBootSplashModuleImpl.NAME;
  }

  @ReactMethod
  public void hide(final double duration, final Promise promise) {
    RNBootSplashModuleImpl.hide(getReactApplicationContext(), duration, promise);
  }

  @ReactMethod
  public void getVisibilityStatus(final Promise promise) {
    RNBootSplashModuleImpl.getVisibilityStatus(promise);
  }
}
