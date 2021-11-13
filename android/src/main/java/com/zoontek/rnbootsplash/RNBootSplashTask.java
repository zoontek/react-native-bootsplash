package com.zoontek.rnbootsplash;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;

public class RNBootSplashTask {

  private final boolean mFade;
  @NonNull private final Promise mPromise;

  public RNBootSplashTask(final boolean fade, @NonNull final Promise promise) {
    mFade = fade;
    mPromise = promise;
  }

  public boolean getFade() {
    return mFade;
  }

  @NonNull
  public Promise getPromise() {
    return mPromise;
  }
}
