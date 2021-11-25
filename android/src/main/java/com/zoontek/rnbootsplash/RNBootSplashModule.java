package com.zoontek.rnbootsplash;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.app.Activity;
import android.view.View;
import android.view.animation.AccelerateInterpolator;

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

import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.LinkedBlockingQueue;

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

  private static final LinkedBlockingQueue<RNBootSplashTask> mTaskQueue = new LinkedBlockingQueue<>();
  private static Status mStatus = Status.HIDDEN;
  private static boolean mIsAppInForeground = true;
  private static boolean mShouldFade = false;
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

    mSplashScreen.setOnExitAnimationListener(new SplashScreen.OnExitAnimationListener() {
      @Override
      public void onSplashScreenExit(@NonNull final SplashScreenViewProvider splashScreenViewProvider) {
        View splashScreenView = splashScreenViewProvider.getView();

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
              splashScreenViewProvider.remove();
            }
          }).start();
      }
    });
  }

  @Override
  public void onHostDestroy() {
    mIsAppInForeground = false;
  }

  @Override
  public void onHostPause() {
    mIsAppInForeground = false;
  }

  @Override
  public void onHostResume() {
    mIsAppInForeground = true;
    shiftNextTask();
  }

  private void shiftNextTask() {
    if (mStatus != Status.TRANSITIONING && mIsAppInForeground) {
      RNBootSplashTask task = mTaskQueue.poll();

      if (task != null) {
        hideWithTask(task);
      }
    }
  }

  private void waitAndRetry() {
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
          waitAndRetry(); // Wait for activity to be ready
          return;
        }

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
            promise.resolve(true);
            shiftNextTask();
          }
        }, ANIMATION_DURATION);
      }
    });
  }

  @ReactMethod
  public void hide(final boolean fade, final Promise promise) {
    if (mSplashScreen == null || mStatus == Status.HIDDEN) {
      promise.resolve(true);
    } else {
      try {
        mTaskQueue.put(new RNBootSplashTask(fade, promise));
        shiftNextTask();
      } catch (InterruptedException e) {
        promise.resolve(true);
      }
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
