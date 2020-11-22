package com.zoontek.rnbootsplash;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.app.Activity;
import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.widget.LinearLayout;
import android.widget.LinearLayout.LayoutParams;

import androidx.annotation.DrawableRes;
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

@ReactModule(name = RNBootSplashModule.MODULE_NAME)
public class RNBootSplashModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  public static final String MODULE_NAME = "RNBootSplash";
  private static final int ANIMATION_DURATION = 220;

  private enum Status {
    VISIBLE,
    HIDDEN,
    TRANSITIONING
  }

  private static int mDrawableResId = -1;

  private final ArrayList<RNBootSplashTask> mTaskQueue = new ArrayList<>();
  private Status mStatus = Status.HIDDEN;
  private boolean mIsAppInBackground = false;

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);

    if (mDrawableResId != -1) {
      mStatus = Status.VISIBLE;
    }

    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  private static LinearLayout getLayout(@NonNull Activity activity, LayoutParams params) {
    Context context = activity.getApplicationContext();
    LinearLayout layout = new LinearLayout(context);
    View view = new View(context);

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

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();

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
            || activity.findViewById(R.id.bootsplash_layout_id) != null) {
            return;
          }

          mStatus = Status.VISIBLE;

          LayoutParams params = new LayoutParams(
            LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
          activity.addContentView(getLayout(activity, params), params);
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
    boolean shouldSkipTick = mDrawableResId == -1
      || mStatus == Status.TRANSITIONING
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

  private void show(final RNBootSplashTask task) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        final Activity activity = getReactApplicationContext().getCurrentActivity();
        final Promise promise = task.getPromise();

        if (activity == null || activity.isFinishing()) {
          promise.reject("invalid_activity",
            "Couldn't call show() without a valid Activity");
          shiftNextTask();
          return;
        }

        if (activity.findViewById(R.id.bootsplash_layout_id) != null) {
          promise.resolve(true); // splash screen is already visible
          shiftNextTask();
          return;
        }

        mStatus = Status.TRANSITIONING;

        LayoutParams params = new LayoutParams(
          LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
        LinearLayout layout = getLayout(activity, params);

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
          promise.reject("invalid_activity",
            "Couldn't call show() without a valid Activity");
          shiftNextTask();
          return;
        }

        final LinearLayout layout = activity.findViewById(R.id.bootsplash_layout_id);

        if (layout == null) {
          promise.resolve(true); // splash screen is already hidden
          shiftNextTask();
          return;
        }

        mStatus = Status.TRANSITIONING;

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
    });
  }

  @ReactMethod
  public void show(final boolean fade, final Promise promise) {
    if (mDrawableResId == -1) {
      promise.reject("uninitialized_module", "react-native-bootsplash has not been initialized");
    } else {
      mTaskQueue.add(new RNBootSplashTask(RNBootSplashTask.Type.SHOW, fade, promise));
      shiftNextTask();
    }
  }

  @ReactMethod
  public void hide(final boolean fade, final Promise promise) {
    if (mDrawableResId == -1) {
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
      case TRANSITIONING:
        promise.resolve("transitioning");
        break;
    }
  }
}
