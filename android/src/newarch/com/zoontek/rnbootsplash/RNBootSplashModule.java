package com.zoontek.rnbootsplash;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;

import java.util.Map;

@ReactModule(name = RNBootSplashModuleImpl.NAME)
public class RNBootSplashModule extends NativeRNBootSplashSpec implements LifecycleEventListener {

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  @NonNull
  public String getName() {
    return RNBootSplashModuleImpl.NAME;
  }

  @Override
  protected Map<String, Object> getTypedExportedConstants() {
    return RNBootSplashModuleImpl.getConstants(getReactApplicationContext());
  }

  @Override
  public void onHostDestroy() {}

  @Override
  public void onHostResume() {
    RNBootSplashModuleImpl.onHostResume();
  }

  @Override
  public void onHostPause() {
    RNBootSplashModuleImpl.onHostPause();
  }

  @Override
  public void hide(boolean fade, Promise promise) {
    RNBootSplashModuleImpl.hide(getReactApplicationContext(), fade, promise);
  }

  @Override
  public void isVisible(Promise promise) {
    RNBootSplashModuleImpl.isVisible(promise);
  }
}
