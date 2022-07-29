package com.zoontek.rnbootsplash;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.app.Activity;
import android.os.Build;
import android.view.View;
import android.view.animation.AccelerateInterpolator;
import android.window.SplashScreenView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.splashscreen.SplashScreenViewProvider;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.module.annotations.ReactModule;

import java.util.Timer;
import java.util.TimerTask;

@ReactModule(name = RNBootSplashImpl.NAME)
public class RNBootSplashModule extends ReactContextBaseJavaModule {

  public static final String NAME = RNBootSplashImpl.NAME;

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }



  @ReactMethod
  public void hide(final boolean fade, final Promise promise) {
    RNBootSplashImpl.hide(fade, getReactApplicationContext().getCurrentActivity(), promise);
  }

  @ReactMethod
  public void getVisibilityStatus(final Promise promise) {
    RNBootSplashImpl.getVisibilityStatus(promise);
  }
}
