package com.zoontek.rnbootsplash;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.app.Activity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.widget.LinearLayout;
import android.widget.LinearLayout.LayoutParams;

import androidx.annotation.DrawableRes;
import androidx.annotation.LayoutRes;
import androidx.annotation.NonNull;

import com.facebook.react.ReactApplication;
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
    TRANSITIONING_TO_VISIBLE,
    TRANSITIONING_TO_HIDDEN
  }

  private static int mDrawableResId = -1;
  private static int mLayoutResId = -1;
  private static int mLayoutId = -1;

  private final ArrayList<RNBootSplashTask> mTaskQueue = new ArrayList<>();
  private Status mStatus = Status.HIDDEN;
  private boolean mIsAppInBackground = false;

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);

    if (mDrawableResId != -1 || mLayoutResId != -1) {
      mStatus = Status.VISIBLE;
    }

    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  private static LinearLayout getLayout(@NonNull Activity activity, LayoutParams params) {
    LinearLayout layout = new LinearLayout(activity);
    View view = new View(activity);

    view.setBackgroundResource(mDrawableResId);
    layout.setId(R.id.bootsplash_layout_id);
    layout.setLayoutTransition(null);
    layout.setOrientation(LinearLayout.VERTICAL);
    layout.addView(view, params);

    return layout;
  }

  protected static void init(final @DrawableRes int drawableResId, final Activity activity) {
    mDrawableResId = drawableResId;

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (activity == null
          || activity.isFinishing()
          || activity.findViewById(R.id.bootsplash_layout_id) != null) {
          return;
        }

        LayoutParams params = new LayoutParams(
          LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
        activity.addContentView(getLayout(activity, params), params);
      }
    });
  }

  protected static void initLayout(
    final @LayoutRes int layoutResId,
    final int layoutId,
    final Activity activity) {
    mLayoutResId = layoutResId;
    mLayoutId = layoutId;

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (activity == null
          || activity.isFinishing()
          || activity.findViewById(layoutId) != null) {
          return;
        }

        LayoutParams params = new LayoutParams(
          LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);

        LayoutInflater inflater = LayoutInflater.from(activity);
        LinearLayout layout = (LinearLayout) inflater.inflate(
          mLayoutResId,
          null,
          false);

        activity.addContentView(layout, params);
      }
    });
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();

    // Don't go further if module was not initialized
    if (mDrawableResId == -1 && mLayoutResId == -1) return;

    try {
      Activity activity = getReactApplicationContext().getCurrentActivity();
      assert activity != null;
      ReactApplication application = (ReactApplication) activity.getApplication();

      boolean isDevelopmentReload = application
        .getReactNativeHost()
        .getUseDeveloperSupport();

      if (!isDevelopmentReload) return;

      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          Activity activity = getReactApplicationContext().getCurrentActivity();

          if (activity == null
            || activity.isFinishing()
            || activity.findViewById(R.id.bootsplash_layout_id) != null
            || activity.findViewById(mLayoutId) != null) {
            return;
          }

          mStatus = Status.VISIBLE;

          if (mLayoutResId != -1) {
            LayoutParams params = new LayoutParams(
              LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);

            LayoutInflater inflater = LayoutInflater.from(activity);
            LinearLayout layout = (LinearLayout) inflater.inflate(
              mLayoutResId,
              null,
              false);

            activity.addContentView(layout, params);
          } else {
            LayoutParams params = new LayoutParams(
              LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
            activity.addContentView(getLayout(activity, params), params);
          }
        }
      });
    } catch (Exception ignored) {
    }
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
    boolean shouldSkipTick = (mDrawableResId == -1 && mLayoutResId == -1)
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
        final Promise promise = task.getPromise();

        if (activity == null || activity.isFinishing()) {
          waitAndShiftNextTask();
          return;
        }

        if (activity.findViewById(R.id.bootsplash_layout_id) != null
          || activity.findViewById(mLayoutId) != null) {
          promise.resolve(true); // splash screen is already visible
          shiftNextTask();
          return;
        }

        mStatus = Status.TRANSITIONING_TO_VISIBLE;

        LayoutParams params = new LayoutParams(
          LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
        LinearLayout layout;

        if (mLayoutResId != -1) {
          layout = activity.findViewById(mLayoutId);
        } else {
          layout = getLayout(activity, params);
        }

        if (task.getFade()) {
          layout.setAlpha(0.0f);
          activity.addContentView(layout, params);

          layout
            .animate()
            .setDuration(ANIMATION_DURATION)
            .alpha(1.0f)
            .setInterpolator(new DecelerateInterpolator())
            .setListener(new AnimatorListenerAdapter() {
              @Override
              public void onAnimationEnd(Animator animation) {
                super.onAnimationEnd(animation);
                mStatus = Status.VISIBLE;
                promise.resolve(true);
                shiftNextTask();
              }
            })
            .start();
        } else {
          activity.addContentView(layout, params);
          mStatus = Status.VISIBLE;
          promise.resolve(true);
          shiftNextTask();
        }
      }
    });
  }

  private void hide(final RNBootSplashTask task) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        final Activity activity = getReactApplicationContext().getCurrentActivity();
        final Promise promise = task.getPromise();

        if (activity == null || activity.isFinishing()) {
          waitAndShiftNextTask();
          return;
        }

        final LinearLayout layout = activity.findViewById(R.id.bootsplash_layout_id);
        final LinearLayout customLayout = activity.findViewById(mLayoutId);

        if (layout == null && customLayout == null) {
          promise.resolve(true); // splash screen is already hidden
          shiftNextTask();
          return;
        }

        hideLayout(promise, layout != null ? layout : customLayout, task);
      }
    });
  }

  private void hideLayout(final Promise promise, final LinearLayout layout, RNBootSplashTask task) {
    mStatus = Status.TRANSITIONING_TO_HIDDEN;

    final ViewGroup parent = (ViewGroup) layout.getParent();

    if (task.getFade()) {
      layout
        .animate()
        .setDuration(ANIMATION_DURATION)
        .alpha(0.0f)
        .setInterpolator(new AccelerateInterpolator())
        .setListener(new AnimatorListenerAdapter() {
          @Override
          public void onAnimationEnd(Animator animation) {
            super.onAnimationEnd(animation);

            if (parent != null)
              parent.removeView(layout);

            mStatus = Status.HIDDEN;
            promise.resolve(true);
            shiftNextTask();
          }
        }).start();
    } else {
      parent.removeView(layout);
      mStatus = Status.HIDDEN;
      promise.resolve(true);
      shiftNextTask();
    }
  }

  @ReactMethod
  public void show(final boolean fade, final Promise promise) {
    if (mDrawableResId == -1 && mLayoutResId == -1) {
      promise.reject("uninitialized_module", "react-native-bootsplash has not been initialized");
    } else {
      mTaskQueue.add(new RNBootSplashTask(RNBootSplashTask.Type.SHOW, fade, promise));
      shiftNextTask();
    }
  }

  @ReactMethod
  public void hide(final boolean fade, final Promise promise) {
    if (mDrawableResId == -1 && mLayoutResId == -1) {
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
