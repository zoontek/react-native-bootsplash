package com.zoontek.rnbootsplash;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.app.Activity;
import android.os.Build;
import android.view.View;
import android.view.animation.AccelerateInterpolator;
import android.window.SplashScreenView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.splashscreen.SplashScreenViewProvider;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;

import java.util.Timer;
import java.util.TimerTask;

public class RNBootSplashModuleImpl {

  public static final String NAME = "RNBootSplash";

  private enum Status {
    VISIBLE,
    HIDDEN,
    TRANSITIONING
  }

  @Nullable
  private static SplashScreen mSplashScreen = null;

  private static final RNBootSplashQueue<Promise> mPromiseQueue = new RNBootSplashQueue<>();
  private static Status mStatus = Status.HIDDEN;
  private static int mFadeDuration = 0;
  private static boolean mShouldKeepOnScreen = true;

  protected static void init(@Nullable final Activity activity) {
    if (activity == null) {
      FLog.w(
        ReactConstants.TAG,
        NAME + ": Ignored initialization, current activity is null.");
      return;
    }

    mSplashScreen = SplashScreen.installSplashScreen(activity);
    mStatus = Status.VISIBLE;

    mSplashScreen.setKeepOnScreenCondition(new SplashScreen.KeepOnScreenCondition() {
      @Override
      public boolean shouldKeepOnScreen() {
        return mShouldKeepOnScreen;
      }
    });

    mSplashScreen.setOnExitAnimationListener(new SplashScreen.OnExitAnimationListener() {
      @Override
      public void onSplashScreenExit(@NonNull final SplashScreenViewProvider splashScreenViewProvider) {
        final View splashScreenView = splashScreenViewProvider.getView();

        splashScreenView
          .animate()
          .setDuration(mFadeDuration)
          // Crappy hack to avoid automatic layout transitions
          .setStartDelay(Math.min(0, mFadeDuration))
          .alpha(0.0f)
          .setInterpolator(new AccelerateInterpolator())
          .setListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
              super.onAnimationEnd(animation);

              if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                splashScreenViewProvider.remove();
              } else {
                // Avoid calling applyThemesSystemBarAppearance
                ((SplashScreenView) splashScreenView).remove();
              }
            }
          }).start();
      }
    });
  }

  private static void clearPromiseQueue() {
    while (!mPromiseQueue.isEmpty()) {
      Promise promise = mPromiseQueue.shift();

      if (promise != null)
        promise.resolve(true);
    }
  }

  private static void hideAndResolveAll(final ReactApplicationContext reactContext) {
    if (mSplashScreen == null || mStatus == Status.HIDDEN) {
      clearPromiseQueue();
      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        final Activity activity = reactContext.getCurrentActivity();

        if (activity == null || activity.isFinishing()) {
          // Wait for activity to be ready
          final Timer timer = new Timer();

          timer.schedule(new TimerTask() {
            @Override
            public void run() {
              hideAndResolveAll(reactContext);
              timer.cancel();
            }
          }, 250);
        } else {
          if (mFadeDuration > 0) {
            mStatus = Status.TRANSITIONING;
          }

          mShouldKeepOnScreen = false;

          final Timer timer = new Timer();

          // We cannot rely on setOnExitAnimationListener
          // See https://issuetracker.google.com/issues/197906327
          timer.schedule(new TimerTask() {
            @Override
            public void run() {
              mStatus = Status.HIDDEN;
              timer.cancel();
              clearPromiseQueue();
            }
          }, mFadeDuration);
        }
      }
    });
  }

  public static void hide(final ReactApplicationContext reactContext,
                          final double duration,
                          final Promise promise) {
    mFadeDuration = (int) Math.round(duration);
    mPromiseQueue.push(promise);
    hideAndResolveAll(reactContext);
  }

  public static void getVisibilityStatus(final Promise promise) {
    switch (mStatus) {
      case VISIBLE:
        promise.resolve("visible");
        break;
      case HIDDEN:
        promise.resolve("hidden");
        break;
      case TRANSITIONING:
        promise.resolve("transitioning");
        break;
    }
  }
}
