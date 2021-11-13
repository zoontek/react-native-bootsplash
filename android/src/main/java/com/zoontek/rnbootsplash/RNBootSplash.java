package com.zoontek.rnbootsplash;

import android.app.Activity;

import androidx.annotation.NonNull;

public class RNBootSplash {

  public static void init(@NonNull final Activity activity) {
    RNBootSplashModule.init(activity);
  }
}
