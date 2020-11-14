package com.zoontek.rnbootsplash;

import android.app.Activity;

import androidx.annotation.DrawableRes;
import androidx.annotation.NonNull;

public class RNBootSplash {

  public static void init(final @DrawableRes int drawableResId, @NonNull final Activity activity) {
    RNBootSplashModule.init(drawableResId, activity);
  }
}
