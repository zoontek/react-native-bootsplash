package com.zoontek.rnbootsplash;

import android.app.Activity;
import android.content.DialogInterface;
import android.view.Window;

import androidx.annotation.Nullable;
import androidx.annotation.StyleRes;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;

import java.util.ArrayList;
import java.util.Timer;
import java.util.TimerTask;

@ReactModule(name = RNBootSplashModule.MODULE_NAME)
public class RNBootSplashModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  public static final String MODULE_NAME = "RNBootSplash";
  private static final int ANIMATION_DURATION = 220;

  private enum Status {
    VISIBLE,
    HIDDEN,
    TRANSITIONING
  }

  private static int mBootThemeResId = -1;
  private static final ArrayList<RNBootSplashTask> mTaskQueue = new ArrayList<>();
  private static Status mStatus = Status.HIDDEN;
  private static boolean mIsAppInBackground = false;

  @Nullable
  private static RNBootSplashDialog mDialog = null;

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  protected static void init(final Activity activity, @StyleRes final int bootThemeResId) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (activity == null
          || activity.isFinishing()
          || mDialog != null) {
          return;
        }

        mBootThemeResId = bootThemeResId;
        mStatus = Status.VISIBLE;
        mDialog = new RNBootSplashDialog(activity, mBootThemeResId);

        Window window = mDialog.getWindow();

        if (window != null) {
          // window.setWindowAnimations(R.style.bootsplash_no_animation);
        }

        if (!mDialog.isShowing()) {
          mDialog.show();
        }
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
    boolean shouldSkipTick = mBootThemeResId == -1
      || mStatus == Status.TRANSITIONING
      || mIsAppInBackground
      || mTaskQueue.isEmpty();

    if (shouldSkipTick) return;

    RNBootSplashTask task = mTaskQueue.remove(0);
    hide(task);
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

  private void hide(final RNBootSplashTask task) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        final Activity activity = getReactApplicationContext().getCurrentActivity();
        final boolean fade = task.getFade();
        final Promise promise = task.getPromise();

        if (activity == null || activity.isFinishing()) {
          waitAndShiftNextTask();
          return;
        }

        if (mDialog == null) {
          promise.resolve(true); // splash screen is already hidden
          shiftNextTask();
          return;
        }

        mStatus = Status.TRANSITIONING;

        Window window = mDialog.getWindow();

        mDialog.setOnDismissListener(new DialogInterface.OnDismissListener() {
          @Override
          public void onDismiss(DialogInterface dialog) {
            mStatus = Status.HIDDEN;
            mDialog = null;
            promise.resolve(true);
            shiftNextTask();
          }
        });

        if (window != null) {
//          window.setWindowAnimations(fade
//            ? R.style.bootsplash_fade_animation
//            : R.style.bootsplash_no_animation);
        }

        if (!fade) {
          mDialog.dismiss();
        } else {
          mDialog.hide();
          final Timer timer = new Timer();

          timer.schedule(new TimerTask() {
            @Override
            public void run() {
              mDialog.dismiss();
              timer.cancel();
            }
          }, ANIMATION_DURATION);
        }
      }
    });
  }

  @ReactMethod
  public void hide(final boolean fade, final Promise promise) {
    if (mBootThemeResId == -1) {
      promise.reject("uninitialized_module", "react-native-bootsplash has not been initialized");
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
