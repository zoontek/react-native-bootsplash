package com.zoontek.rnbootsplash;

import android.app.Activity;
import android.app.Dialog;
import android.view.ViewGroup.LayoutParams;
import android.view.Window;

import androidx.annotation.NonNull;
import androidx.annotation.StyleRes;

class RNBootSplashDialog extends Dialog {

  RNBootSplashDialog(final @NonNull Activity activity, final @StyleRes int themeResId) {
    super(activity, themeResId);

    setOwnerActivity(activity);
    setCancelable(false);
    setCanceledOnTouchOutside(false);

    final Window window = getWindow();

    if (window != null) {
      window.setLayout(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
      window.setWindowAnimations(0);
    }
  }
}
