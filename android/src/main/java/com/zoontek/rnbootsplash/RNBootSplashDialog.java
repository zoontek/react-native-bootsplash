package com.zoontek.rnbootsplash;

import android.app.Activity;
import android.app.Dialog;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;

import androidx.annotation.NonNull;
import androidx.annotation.StyleRes;

public class RNBootSplashDialog extends Dialog {

  @NonNull
  private final Activity mActivity;

  @StyleRes
  private int mWindowAnimationsResId = -1;

  public RNBootSplashDialog(@NonNull Activity activity, @StyleRes int themeResId) {
    super(activity, themeResId);
    mActivity = activity;
    setCancelable(false);
    setCanceledOnTouchOutside(false);
  }

  @Override
  public void onBackPressed() {
    mActivity.moveTaskToBack(true);
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    final Window window = this.getWindow();

    if (window != null) {
      window.setLayout(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.MATCH_PARENT
      );

      if (mWindowAnimationsResId != -1) {
        window.setWindowAnimations(mWindowAnimationsResId);
      }
    }

    super.onCreate(savedInstanceState);
  }

  public void setWindowAnimations(@StyleRes int windowAnimationsResId) {
    mWindowAnimationsResId = windowAnimationsResId;
  }
}
