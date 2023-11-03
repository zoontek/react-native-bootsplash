package com.zoontek.rnbootsplash;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import java.util.Map;

@ReactModule(name = RNBootSplashModuleImpl.NAME)
public class RNBootSplashModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @NonNull
  @Override
  public String getName() {
    return RNBootSplashModuleImpl.NAME;
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
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

  @ReactMethod
  public void hide(boolean fade, Promise promise) {
    RNBootSplashModuleImpl.hide(getReactApplicationContext(), fade, promise);
  }

  @ReactMethod
  public void isVisible(Promise promise) {
    RNBootSplashModuleImpl.isVisible(promise);
  }
}
