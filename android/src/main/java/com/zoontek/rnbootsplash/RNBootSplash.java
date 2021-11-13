package com.zoontek.rnbootsplash;

import android.app.Activity;

import androidx.annotation.NonNull;
import androidx.annotation.StyleRes;

public class RNBootSplash {

  public static void init(@NonNull final Activity activity,
                          @StyleRes final int bootThemeResId) {
    RNBootSplashModule.init(activity, bootThemeResId);
  }
}
