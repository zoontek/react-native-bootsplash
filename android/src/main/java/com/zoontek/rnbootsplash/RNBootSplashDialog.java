package com.zoontek.rnbootsplash;

import android.app.Activity;
import android.app.Dialog;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;

import androidx.annotation.NonNull;
import androidx.annotation.StyleRes;

public class RNBootSplashDialog extends Dialog {

  public final boolean mFade;

  public RNBootSplashDialog(@NonNull Activity activity, @StyleRes int themeResId, boolean fade) {
    super(activity, themeResId);

    mFade = fade;

    setOwnerActivity(activity);
    setCancelable(false);
    setCanceledOnTouchOutside(false);
  }

  @Override
  public void onBackPressed() {
    Activity activity = getOwnerActivity();

    if (activity != null) {
      activity.moveTaskToBack(true);
    }
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    final Window window = getWindow();

    if (window != null) {
      window.setLayout(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.MATCH_PARENT
      );

      if (RNBootSplashModuleImpl.isSamsungOneUI4()) {
        window.setBackgroundDrawableResource(R.drawable.compat_splash_screen_oneui_4);
      }
      if (mFade) {
        window.setWindowAnimations(R.style.BootSplashFadeOutAnimation);
      }
    }

    super.onCreate(savedInstanceState);
  }
}
