package com.zoontek.rnbootsplash;

import android.app.Activity;

import androidx.annotation.DrawableRes;
import androidx.annotation.LayoutRes;
import androidx.annotation.NonNull;

public class RNBootSplash {

  public static void init(final @DrawableRes int drawableResId, @NonNull final Activity activity) {
    RNBootSplashModule.init(drawableResId, false, activity);
  }

  public static void initLayout(final @LayoutRes int layoutResId, @NonNull final Activity activity) {
    RNBootSplashModule.init(layoutResId, true, activity);
  }
}
