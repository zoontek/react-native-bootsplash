package com.zoontek.rnbootsplash;

import android.app.Activity;

import androidx.annotation.NonNull;
import androidx.annotation.StyleRes;

public class RNBootSplash {

  public static void init(@NonNull final Activity activity, final @StyleRes int themeResId) {
    RNBootSplashModule.init(activity, themeResId);
  }
}
