package com.zoontek.rnbootsplash;

import android.app.Activity;
import android.app.Dialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;

import androidx.annotation.NonNull;
import androidx.annotation.StyleRes;

public class RNBootSplashDialog extends Dialog {

  private final boolean mFade;

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
  public void dismiss() {
    if (!isShowing()) {
      return;
    }

    try {
      super.dismiss();
    } catch (Exception ignored) {}
  }

  public void dismiss(@NonNull final Runnable callback) {
    if (!isShowing()) {
      callback.run();
      return;
    }

    setOnDismissListener(new OnDismissListener() {
      @Override
      public void onDismiss(DialogInterface dialog) {
        callback.run();
      }
    });

    try {
      super.dismiss();
    } catch (Exception ignored) {
      callback.run();
    }
  }

  @Override
  public void show() {
    if (isShowing()) {
      return;
    }

    try {
      super.show();
    } catch (Exception ignored) {}
  }

  public void show(@NonNull final Runnable callback) {
    if (isShowing()) {
      callback.run();
      return;
    }

    setOnShowListener(new DialogInterface.OnShowListener() {
      @Override
      public void onShow(DialogInterface dialog) {
        callback.run();
      }
    });

    try {
      super.show();
    } catch (Exception ignored) {
      callback.run();
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

      window.setWindowAnimations(mFade
        ? R.style.BootSplashFadeOutAnimation
        : R.style.BootSplashNoAnimation);

      if (RNBootSplashModuleImpl.isSamsungOneUI4()) {
        window.setBackgroundDrawableResource(R.drawable.compat_splash_screen_oneui_4);
      }
    }

    super.onCreate(savedInstanceState);
  }
}
