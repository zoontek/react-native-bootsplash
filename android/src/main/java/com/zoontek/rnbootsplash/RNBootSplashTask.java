package com.zoontek.rnbootsplash;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;

public class RNBootSplashTask {

  public enum Type {
    SHOW,
    HIDE
  }

  private final boolean mFade;
  @NonNull private final Promise mPromise;
  @NonNull private final Type mType;

  public RNBootSplashTask(@NonNull Type type,
                          boolean fade,
                          @NonNull Promise promise) {
    mType = type;
    mFade = fade;
    mPromise = promise;
  }

  public boolean getFade() {
    return mFade;
  }

  @NonNull
  public Type getType() {
    return mType;
  }

  @NonNull
  public Promise getPromise() {
    return mPromise;
  }
}
