package com.zoontek.rnbootsplash;

import android.app.Activity;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = RNBootSplashModule.MODULE_NAME)
public class RNBootSplashModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  public static final String MODULE_NAME = "RNBootSplash";

  private boolean mRunHideOnAppResume = false;
  private boolean mRunShowOnAppResume = false;

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  @Override
  public void onHostResume() {
    if (mRunHideOnAppResume) {
      hide(0.0f);
    }
    if (mRunShowOnAppResume) {
      show(0.0f);
    }

    mRunHideOnAppResume = false;
    mRunShowOnAppResume = false;
  }

  @Override
  public void onHostPause() {}

  @Override
  public void onHostDestroy() {}

  @ReactMethod
  public void show(final Float duration) {
    final Activity activity = getReactApplicationContext().getCurrentActivity();

    if (activity == null) {
      mRunHideOnAppResume = false;
      mRunShowOnAppResume = true;
    } else {
      RNBootSplash.show(activity, duration);
    }
  }

  @ReactMethod
  public void hide(final Float duration) {
    final Activity activity = getReactApplicationContext().getCurrentActivity();

    if (activity == null) {
      mRunHideOnAppResume = true;
      mRunShowOnAppResume = false;
    } else {
      RNBootSplash.hide(activity, duration);
    }
  }
}
