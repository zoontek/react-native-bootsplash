package com.zoontek.rnbootsplash;

import android.app.Activity;
import android.content.Context;
import android.content.DialogInterface;
import android.content.res.Resources;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.Window;

import androidx.annotation.ColorRes;
import androidx.annotation.Nullable;
import androidx.annotation.StyleRes;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.PixelUtil;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

@ReactModule(name = RNBootSplashModule.MODULE_NAME)
public class RNBootSplashModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  public static final String MODULE_NAME = "RNBootSplash";
  private static final int ANIMATION_DURATION = 220;

  private enum Status {
    VISIBLE,
    HIDDEN,
    TRANSITIONING_TO_VISIBLE,
    TRANSITIONING_TO_HIDDEN
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

  @Override
  public @Nullable Map<String, Object> getConstants() {
    final HashMap<String, Object> constants = new HashMap<>();
    final Context context = getReactApplicationContext();
    final Resources resources = context.getResources();
    final boolean hasMenuKey = ViewConfiguration.get(context).hasPermanentMenuKey();

    final int statusBarHeightResId =
      resources.getIdentifier("status_bar_height", "dimen", "android");
    final int navigationBarHeightResId =
      resources.getIdentifier("navigation_bar_height", "dimen", "android");

    final float statusBarHeight =
      statusBarHeightResId > 0
        ? Math.round(PixelUtil.toDIPFromPixel(resources.getDimensionPixelSize(statusBarHeightResId)))
        : 0;
    final float navigationBarHeight =
      navigationBarHeightResId > 0 && !hasMenuKey
        ?  Math.round(PixelUtil.toDIPFromPixel(resources.getDimensionPixelSize(navigationBarHeightResId)))
        : 0;

    constants.put("statusBarHeight", statusBarHeight);
    constants.put("navigationBarHeight", navigationBarHeight);

    return constants;
  }

  protected static void init(final Activity activity,
                             @StyleRes final int bootThemeResId,
                             @ColorRes final int backgroundColorResId) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (activity == null
          || activity.isFinishing()
          || mDialog != null) {
          return;
        }

        final int backgroundColor = activity.getResources().getColor(backgroundColorResId);
        final View decorView = activity.getWindow().getDecorView();

        mBootThemeResId = bootThemeResId;
        mStatus = Status.VISIBLE;
        mDialog = new RNBootSplashDialog(activity, mBootThemeResId);

        mDialog.setOnShowListener(new DialogInterface.OnShowListener() {
          @Override
          public void onShow(DialogInterface dialog) {
            decorView.setBackgroundColor(backgroundColor);
          }
        });

        Window window = mDialog.getWindow();

        if (window != null) {
          window.setWindowAnimations(R.style.bootsplash_no_animation);
        }

        if (!mDialog.isShowing()) {
          mDialog.show();
        } else {
          decorView.setBackgroundColor(backgroundColor);
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
      || mStatus == Status.TRANSITIONING_TO_VISIBLE
      || mStatus == Status.TRANSITIONING_TO_HIDDEN
      || mIsAppInBackground
      || mTaskQueue.isEmpty();

    if (shouldSkipTick) return;

    RNBootSplashTask task = mTaskQueue.remove(0);

    switch (task.getType()) {
      case SHOW:
        show(task);
        break;
      case HIDE:
        hide(task);
        break;
    }
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

  private void show(final RNBootSplashTask task) {
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

        if (mDialog != null) {
          promise.resolve(true); // splash screen is already visible
          shiftNextTask();
          return;
        }

        mStatus = Status.TRANSITIONING_TO_VISIBLE;
        mDialog = new RNBootSplashDialog(activity, mBootThemeResId);

        Window window = mDialog.getWindow();

        if (window != null) {
          window.setWindowAnimations(fade
            ? R.style.bootsplash_fade_animation
            : R.style.bootsplash_no_animation);
        }

        if (!mDialog.isShowing()) {
          mDialog.show();
        }

        if (!fade) {
          mStatus = Status.VISIBLE;
          promise.resolve(true);
          shiftNextTask();
        } else {
          final Timer timer = new Timer();

          timer.schedule(new TimerTask() {
            @Override
            public void run() {
              mStatus = Status.VISIBLE;
              promise.resolve(true);
              shiftNextTask();
              timer.cancel();
            }
          }, ANIMATION_DURATION);
        }
      }
    });
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

        mStatus = Status.TRANSITIONING_TO_HIDDEN;

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
          window.setWindowAnimations(fade
            ? R.style.bootsplash_fade_animation
            : R.style.bootsplash_no_animation);
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
  public void show(final boolean fade, final Promise promise) {
    if (mBootThemeResId == -1) {
      promise.reject("uninitialized_module", "react-native-bootsplash has not been initialized");
    } else {
      mTaskQueue.add(new RNBootSplashTask(RNBootSplashTask.Type.SHOW, fade, promise));
      shiftNextTask();
    }
  }

  @ReactMethod
  public void hide(final boolean fade, final Promise promise) {
    if (mBootThemeResId == -1) {
      promise.reject("uninitialized_module", "react-native-bootsplash has not been initialized");
    } else {
      mTaskQueue.add(new RNBootSplashTask(RNBootSplashTask.Type.HIDE, fade, promise));
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
      case TRANSITIONING_TO_VISIBLE:
      case TRANSITIONING_TO_HIDDEN:
        promise.resolve("transitioning");
        break;
    }
  }
}
