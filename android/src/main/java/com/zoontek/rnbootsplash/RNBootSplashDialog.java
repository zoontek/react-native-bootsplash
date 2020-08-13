package com.zoontek.rnbootsplash;

import android.app.Activity;
import android.app.Dialog;
import android.view.Window;

import androidx.annotation.NonNull;
import androidx.annotation.StyleRes;

class RNBootSplashDialog extends Dialog {

  RNBootSplashDialog(final @NonNull Activity activity, final @StyleRes int themeResId) {
    super(activity, themeResId);

    setOwnerActivity(activity);
    setCancelable(false);

    final Window window = getWindow();

    if (window != null) {
      window.setWindowAnimations(0);
    }
  }
}
