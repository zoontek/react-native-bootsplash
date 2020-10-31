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
import androidx.annotation.Nullable;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = RNBootSplashModule.MODULE_NAME)
public class RNBootSplashModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  public static final String MODULE_NAME = "RNBootSplash";
  private static final int ANIMATION_DURATION = 220;

  private static int mDrawableResId = -1;
  private static boolean mSplashVisible = false;
  private static boolean mAppPaused = true;
  private static boolean mFadeOption = false;

  @Nullable private static String mTaskToRunOnResume = null;
  @Nullable private static Promise mPendingPromise = null;

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  private static void resolvePendingPromise() {
    if (mPendingPromise == null) return;
    mPendingPromise.resolve(null);
    mPendingPromise = null;
  }

  private static void rejectPendingPromise(@NonNull final String code, @NonNull final String message) {
    if (mPendingPromise == null) return;
    mPendingPromise.reject(code, message);
    mPendingPromise = null;
  }

  protected static void init(final @DrawableRes int drawableResId, @NonNull final Activity activity) {
    mDrawableResId = drawableResId;
    RNBootSplashModule.show(activity, false);
  }

  @Override
  public void onHostDestroy() {
    mAppPaused = true;
  }

  @Override
  public void onHostPause() {
    mAppPaused = true;
  }

  @Override
  public void onHostResume() {
    mAppPaused = false;

    if (mTaskToRunOnResume == null) {
      return;
    }

    final Activity activity = getReactApplicationContext().getCurrentActivity();

    if (mTaskToRunOnResume.equals("show")) {
      RNBootSplashModule.show(activity, mFadeOption);
    } else if (mTaskToRunOnResume.equals("hide")) {
      RNBootSplashModule.hide(activity, mFadeOption);
    }

    mTaskToRunOnResume = null;
  }

  private static void show(@Nullable final Activity activity, final boolean fade) {
    if (mSplashVisible) {
      resolvePendingPromise(); // The splashscreen is already visible
      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (activity == null || activity.isFinishing()) {
          rejectPendingPromise("invalid_activity", "Couldn't call show() without a valid Activity");
          return;
        }

        mSplashVisible = true;

        Context context = activity.getApplicationContext();
        LinearLayout layout = new LinearLayout(context);
        LayoutParams params = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
        View view = new View(context);

        view.setBackgroundResource(mDrawableResId);
        layout.setId(R.id.bootsplash_layout_id);
        layout.setLayoutTransition(null);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.addView(view, params);

        if (fade) {
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
                resolvePendingPromise();
              }
            })
            .start();
        } else {
          activity.addContentView(layout, params);
          resolvePendingPromise();
        }
      }
    });
  }

  private static void hide(@Nullable final Activity activity, final boolean fade) {
    if (!mSplashVisible) {
      resolvePendingPromise(); // The splashscreen is already hidden
      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (activity == null || activity.isFinishing()) {
          rejectPendingPromise("invalid_activity", "Couldn't call hide() without a valid Activity");
          return;
        }

        mSplashVisible = false;

        final LinearLayout layout = activity.findViewById(R.id.bootsplash_layout_id);

        if (layout == null) {
          rejectPendingPromise("invalid_layout", "Couldn't call hide() without a valid layout");
          return;
        }

        final ViewGroup parent = (ViewGroup) layout.getParent();

        if (fade) {
          layout
            .animate()
            .setDuration(ANIMATION_DURATION)
            .alpha(0.0f)
            .setInterpolator(new AccelerateInterpolator())
            .setListener(new AnimatorListenerAdapter() {

              @Override
              public void onAnimationEnd(Animator animation) {
                super.onAnimationEnd(animation);
                if (parent != null) parent.removeView(layout);
                resolvePendingPromise();
              }
            }).start();
        } else {
          parent.removeView(layout);
          resolvePendingPromise();
        }
      }
    });
  }

  @ReactMethod
  public void show(final boolean fade, final Promise promise) {
    if (mDrawableResId == -1) {
      promise.reject("uninitialized_module", "react-native-bootsplash has not been initialized");
      return;
    }

    if (mPendingPromise != null) {
      promise.reject("task_already_pending", "A bootsplash task is already pending");
      return;
    }

    mFadeOption = fade;
    mPendingPromise = promise;

    if (mAppPaused) {
      mTaskToRunOnResume = "show";
    } else {
      final Activity activity = getReactApplicationContext().getCurrentActivity();
      RNBootSplashModule.show(activity, fade);
    }
  }

  @ReactMethod
  public void hide(final boolean fade, final Promise promise) {
    if (mDrawableResId == -1) {
      promise.reject("uninitialized_module", "react-native-bootsplash has not been initialized");
      return;
    }

    if (mPendingPromise != null) {
      promise.reject("task_already_pending", "A bootsplash task is already pending");
      return;
    }

    mFadeOption = fade;
    mPendingPromise = promise;

    if (mAppPaused) {
      mTaskToRunOnResume = "hide";
    } else {
      final Activity activity = getReactApplicationContext().getCurrentActivity();
      RNBootSplashModule.hide(activity, fade);
    }
  }

  @ReactMethod
  public void getVisibilityStatus(final Promise promise) {
    if (mPendingPromise != null) {
      promise.resolve("transitioning");
    } else {
      if (mSplashVisible) {
        promise.resolve("visible");
      } else {
        promise.resolve("hidden");
      }
    }
  }
}
