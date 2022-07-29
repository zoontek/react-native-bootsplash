package com.zoontek.rnbootsplash;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.app.Activity;
import android.os.Build;
import android.view.View;
import android.view.animation.AccelerateInterpolator;
import android.window.SplashScreenView;

import androidx.annotation.NonNull;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.splashscreen.SplashScreenViewProvider;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;

import java.util.Timer;
import java.util.TimerTask;

import javax.annotation.Nullable;

public class RNBootSplashImpl {
  public static final String NAME = "RNBootSplash";
  private static final int ANIMATION_DURATION = 220;

  private enum Status {
    VISIBLE,
    HIDDEN,
    TRANSITIONING
  }

  @Nullable
  private static SplashScreen mSplashScreen = null;

  private static final RNBootSplashQueue<Promise> mPromiseQueue = new RNBootSplashQueue<>();
  private static Status mStatus = Status.HIDDEN;
  private static boolean mShouldFade = false;
  private static boolean mShouldKeepOnScreen = true;

  private ReactApplicationContext context;

  public RNBootSplashImpl(ReactApplicationContext reactContext) {
    this.context = reactContext;

  }

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
          // Crappy hack to avoid automatic layout transitions
          .setDuration(mShouldFade ? ANIMATION_DURATION: 0)
          .setStartDelay(mShouldFade ? 0 : ANIMATION_DURATION)
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

  private static void hideAndResolveAll(final boolean fade, Activity activity) {
    if (mSplashScreen == null || mStatus == Status.HIDDEN) {
      clearPromiseQueue();
      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {

        if (activity == null || activity.isFinishing()) {
          // Wait for activity to be ready
          final Timer timer = new Timer();

          timer.schedule(new TimerTask() {
            @Override
            public void run() {
              hideAndResolveAll(fade, activity);
              timer.cancel();
            }
          }, 250);
        } else {
          if (fade) {
            mStatus = Status.TRANSITIONING;
          }

          mShouldFade = fade;
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
          }, ANIMATION_DURATION);
        }
      }
    });
  }

  public static void hide(final boolean fade, Activity activity, final Promise promise) {
    mPromiseQueue.push(promise);
    hideAndResolveAll(fade, activity);
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
