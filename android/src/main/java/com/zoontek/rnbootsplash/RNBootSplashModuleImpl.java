package com.zoontek.rnbootsplash;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.res.Resources;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.view.animation.AccelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.window.SplashScreen;
import android.window.SplashScreenView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.StyleRes;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.PixelUtil;

import java.util.HashMap;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

public class RNBootSplashModuleImpl {

  public static final String NAME = "RNBootSplash";

  private static final RNBootSplashQueue<Promise> mPromiseQueue = new RNBootSplashQueue<>();
  private static boolean mShouldKeepOnScreen = false;

  @StyleRes
  private static int mThemeResId = -1;

  @NonNull
  private static View getContentView(@NonNull Activity activity) {
    return activity.findViewById(android.R.id.content);
  }

  @Nullable
  private static ViewGroup getRootView(@NonNull Activity activity) {
    return (ViewGroup) getContentView(activity).getRootView();
  }

  @Nullable
  private static View getSplashScreenView(@NonNull Activity activity) {
    final ViewGroup rootView = getRootView(activity);

    return rootView != null
      ? rootView.findViewById(R.id.bootsplash_layout)
      : null;
  }

  private static void removeSplashScreenView(@NonNull Activity activity) {
    final ViewGroup rootView = getRootView(activity);
    final View splashScreenView = getSplashScreenView(activity);

    if (rootView != null && splashScreenView != null) {
      rootView.removeView(splashScreenView);
    }
  }

  private static void clearPromiseQueue() {
    while (!mPromiseQueue.isEmpty()) {
      Promise promise = mPromiseQueue.shift();

      if (promise != null) {
        promise.resolve(true);
      }
    }
  }

  protected static void init(
    @Nullable final Activity activity,
    @StyleRes int themeResId
  ) {
    if (mThemeResId != -1) {
      FLog.w(ReactConstants.TAG, NAME + ": Ignored initialization, module is already initialized.");
      return;
    }

    mThemeResId = themeResId;

    if (activity == null) {
      FLog.w(ReactConstants.TAG, NAME + ": Ignored initialization, current activity is null.");
      return;
    }

    ViewGroup rootView = getRootView(activity);

    if (rootView == null) {
      FLog.w(ReactConstants.TAG, NAME + ": Ignored initialization, current activity rootView is null.");
      return;
    }

    // Apply postBootSplashTheme
    TypedValue typedValue = new TypedValue();
    Resources.Theme currentTheme = activity.getTheme();

    if (currentTheme
      .resolveAttribute(R.attr.postBootSplashTheme, typedValue, true)) {
      int finalThemeId = typedValue.resourceId;

      if (finalThemeId != 0) {
        activity.setTheme(finalThemeId);
      }
    }

    @Nullable Integer backgroundResId = null;
    @Nullable Integer backgroundColor = null;
    @Nullable Drawable logo = null;
    @Nullable Drawable brand = null;

    if (currentTheme.resolveAttribute(R.attr.bootSplashBackground, typedValue, true)) {
      backgroundResId = typedValue.resourceId;
      backgroundColor = typedValue.data;
    }

    if (currentTheme.resolveAttribute(R.attr.bootSplashLogo, typedValue, true)
      && typedValue.resourceId != Resources.ID_NULL) {
      logo = currentTheme.getDrawable(typedValue.resourceId);
    }

    if (currentTheme.resolveAttribute(R.attr.bootSplashBrand, typedValue, true)
      && typedValue.resourceId != Resources.ID_NULL) {
      brand = currentTheme.getDrawable(typedValue.resourceId);
    }

    // Keep the splash screen on-screen until View is added
    final View contentView = getContentView(activity);
    mShouldKeepOnScreen = true;

    contentView
      .getViewTreeObserver()
      .addOnPreDrawListener(new ViewTreeObserver.OnPreDrawListener() {
        @Override
        public boolean onPreDraw() {
          if (mShouldKeepOnScreen) {
            return false;
          }

          contentView
            .getViewTreeObserver()
            .removeOnPreDrawListener(this);

          return true;
        }
      });

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      // This is not called on Android 12 when activity is started using intent
      // (Android studio / CLI / notification / widget…)
      activity
        .getSplashScreen()
        .setOnExitAnimationListener(new SplashScreen.OnExitAnimationListener() {
          @Override
          public void onSplashScreenExit(@NonNull SplashScreenView splashScreenView) {
            splashScreenView.remove(); // Remove it immediately, without animation

            activity
              .getSplashScreen()
              .clearOnExitAnimationListener();
          }
        });
    }

    View splashScreenView = FrameLayout.inflate(activity, R.layout.splash_screen_view, null);

    if (backgroundResId != null && backgroundResId != Resources.ID_NULL) {
      splashScreenView.setBackgroundResource(backgroundResId);
    } else if (backgroundColor != null) {
      splashScreenView.setBackgroundColor(backgroundColor);
    } else {
      splashScreenView.setBackground(activity.getWindow().getDecorView().getBackground());
    }

    if (logo != null) {
      ImageView logoView = splashScreenView.findViewById(R.id.bootsplash_logo);
      logoView.setImageDrawable(logo);
    }

    if (brand != null) {
      ImageView brandView = splashScreenView.findViewById(R.id.bootsplash_brand);
      brandView.setImageDrawable(brand);
    }

    rootView.addView(splashScreenView);
    mShouldKeepOnScreen = false; // unfreeze the system thread UI
  }

  private static void hideAndClearPromiseQueue(
    final ReactApplicationContext reactContext,
    final boolean fade
  ) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        final Activity activity = reactContext.getCurrentActivity();

        if (mShouldKeepOnScreen
          || activity == null
          || activity.isFinishing()
          || activity.isDestroyed()
        ) {
          final Timer timer = new Timer();

          timer.schedule(new TimerTask() {
            @Override
            public void run() {
              timer.cancel();
              hideAndClearPromiseQueue(reactContext, fade);
            }
          }, 100);

          return;
        }

        View splashScreenView  = getSplashScreenView(activity);

        if (splashScreenView == null) {
          clearPromiseQueue();
          return;
        }

        if (!fade) {
          removeSplashScreenView(activity);
          clearPromiseQueue();
          return;
        }

        splashScreenView
          .animate()
          .setDuration(250)
          .alpha(0)
          .setInterpolator(new AccelerateInterpolator())
          .setListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
              super.onAnimationEnd(animation);

              removeSplashScreenView(activity);
              clearPromiseQueue();
            }
          });
      }
    });
  }

  public static Map<String, Object> getConstants(final ReactApplicationContext reactContext) {
    final Resources resources = reactContext.getResources();
    HashMap<String, Object> constants = new HashMap<>();

    @SuppressLint({"InternalInsetResource", "DiscouragedApi"}) final int statusBarHeightResId =
      resources.getIdentifier("status_bar_height", "dimen", "android");

    @SuppressLint({"InternalInsetResource", "DiscouragedApi"}) final int navigationBarHeightResId =
      resources.getIdentifier("navigation_bar_height", "dimen", "android");

    float statusBarHeight = statusBarHeightResId > 0
      ? PixelUtil.toDIPFromPixel(resources.getDimensionPixelSize(statusBarHeightResId))
      : 0;

    float navigationBarHeight = navigationBarHeightResId > 0 && !ViewConfiguration.get(reactContext).hasPermanentMenuKey()
      ? PixelUtil.toDIPFromPixel(resources.getDimensionPixelSize(navigationBarHeightResId))
      : 0;

    constants.put("statusBarHeight", statusBarHeight);
    constants.put("navigationBarHeight", navigationBarHeight);

    return constants;
  }

  public static void hide(
    final ReactApplicationContext reactContext,
    final boolean fade,
    final Promise promise
  ) {
    mPromiseQueue.push(promise);
    hideAndClearPromiseQueue(reactContext, fade);
  }

  public static void isVisible(
    final ReactApplicationContext reactContext,
    final Promise promise
  ) {
    final Activity activity = reactContext.getCurrentActivity();
    promise.resolve(mShouldKeepOnScreen || (activity != null && getSplashScreenView(activity) != null));
  }
}
