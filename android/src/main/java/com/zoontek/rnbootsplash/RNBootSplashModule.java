package com.zoontek.rnbootsplash;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.TimeInterpolator;
import android.app.Activity;
import android.view.View;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.LinearInterpolator;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.splashscreen.SplashScreenViewProvider;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.module.annotations.ReactModule;

import java.util.ArrayList;
import java.util.Timer;
import java.util.TimerTask;

@ReactModule(name = RNBootSplashModule.NAME)
public class RNBootSplashModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  public static final String NAME = "RNBootSplash";
  private static final int ANIMATION_DURATION = 220;

  private enum Status {
    VISIBLE,
    HIDDEN,
    TRANSITIONING
  }

  @Nullable
  private static SplashScreen mSplashScreen = null;

  private static final ArrayList<RNBootSplashTask> mTaskQueue = new ArrayList<>();
  private static Status mStatus = Status.HIDDEN;
  private static boolean mIsAppInBackground = false;
  private static boolean mShouldKeepOnScreen = true;

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return NAME;
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

    mSplashScreen.setKeepVisibleCondition(new SplashScreen.KeepOnScreenCondition() {
      @Override
      public boolean shouldKeepOnScreen() {
        return mShouldKeepOnScreen;
      }
    });
  }

  @Override
  public void onHostDestroy() {
    mIsAppInBackground = true;
  }

  @Override
  public void onHostPause() {
    mIsAppInBackground = true;
  }

  @Override
  public void onHostResume() {
    mIsAppInBackground = false;
    shiftNextTask();
  }

  private void shiftNextTask() {
    boolean shouldSkipTick = mStatus == Status.TRANSITIONING
      || mIsAppInBackground
      || mTaskQueue.isEmpty();

    if (shouldSkipTick) return;

    RNBootSplashTask task = mTaskQueue.remove(0);
    hideWithTask(task);
  }

  private void waitAndShiftNextTask() {
    final Timer timer = new Timer();

    timer.schedule(new TimerTask() {
      @Override
      public void run() {
        shiftNextTask();
        timer.cancel();
      }
    }, 250);
  }

  private void hideWithTask(final RNBootSplashTask task) {
    final Activity activity = getReactApplicationContext().getCurrentActivity();
    final boolean fade = task.getFade();
    final Promise promise = task.getPromise();

    if (mSplashScreen == null || mStatus == Status.HIDDEN) {
      promise.resolve(true);
      shiftNextTask();
      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (activity == null || activity.isFinishing()) {
          waitAndShiftNextTask(); // Wait for activity to be ready
          return;
        }

        mStatus = Status.TRANSITIONING;

        mSplashScreen.setOnExitAnimationListener(new SplashScreen.OnExitAnimationListener() {
          @Override
          public void onSplashScreenExit(@NonNull SplashScreenViewProvider splashScreenViewProvider) {
            View splashScreenView = splashScreenViewProvider.getView();
            TimeInterpolator interpolator =
              fade ? new AccelerateInterpolator() : new LinearInterpolator();

            // Avoid automatic transitions by setting the lowest value possible
            int duration = fade ? ANIMATION_DURATION : 60;

            splashScreenView
              .animate()
              .setDuration(duration)
              .alpha(0.0f)
              .setInterpolator(interpolator)
              .setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                  super.onAnimationEnd(animation);
                  mStatus = Status.HIDDEN;

                  splashScreenViewProvider.remove();
                  mSplashScreen = null;

                  promise.resolve(true);
                  shiftNextTask();
                }
              }).start();
          }
        });

        mShouldKeepOnScreen = false;
      }
    });
  }

  @ReactMethod
  public void hide(final boolean fade, final Promise promise) {
    if (mSplashScreen == null) {
      promise.resolve(true);
    } else {
      mTaskQueue.add(new RNBootSplashTask(fade, promise));
      shiftNextTask();
    }
  }

  @ReactMethod
  public void getVisibilityStatus(final Promise promise) {
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
