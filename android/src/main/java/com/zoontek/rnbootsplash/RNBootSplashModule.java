package com.zoontek.rnbootsplash;

import android.app.Activity;
import android.content.DialogInterface;
import android.view.Window;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.StyleRes;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;

import java.util.Timer;
import java.util.TimerTask;

@ReactModule(name = RNBootSplashModule.MODULE_NAME)
public class RNBootSplashModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  public static final String MODULE_NAME = "RNBootSplash";
  private static final int ANIMATION_DURATION = 220;

  private static int mThemeResId = -1;
  private static boolean mAppPaused = true;
  private static boolean mFadeOption = false;

  @Nullable private static String mTaskToRunOnResume = null;
  @Nullable private static Promise mPendingPromise = null;
  @Nullable private static RNBootSplashDialog mDialog = null;

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  static void init(@NonNull final Activity activity, final @StyleRes int themeResId) {
    mThemeResId = themeResId;

    mDialog = new RNBootSplashDialog(activity, themeResId);
    mDialog.show();

    activity.setTheme(R.style.BootSplashNullBackgroundTheme);
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

    if (mTaskToRunOnResume.equals("show")) {
      show();
    } else if (mTaskToRunOnResume.equals("hide")) {
      hide();
    }

    mTaskToRunOnResume = null;
  }

  private void show() {
    if (mDialog != null) {
      if (mPendingPromise != null) {
        mPendingPromise.resolve(null); // The splashscreen is already visible
        mPendingPromise = null;
      }

      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        final Activity activity = getReactApplicationContext().getCurrentActivity();

        if (activity == null || activity.isFinishing()) {
          if (mPendingPromise != null) {
            mPendingPromise.reject("invalid_activity", "Couldn't call show() without a valid Activity");
            mPendingPromise = null;
          }

          return;
        }

        mDialog = new RNBootSplashDialog(activity, mThemeResId);
        final Window window = mDialog.getWindow();

        if (window != null) {
          if (mFadeOption) {
            window.setWindowAnimations(R.style.BootSplashDialogTheme);
          } else {
            window.setWindowAnimations(0);
          }
        }

        mDialog.setOnShowListener(new DialogInterface.OnShowListener() {

          @Override
          public void onShow(DialogInterface dialog) {
            if (window == null || !mFadeOption) {
              if (mPendingPromise != null) {
                mPendingPromise.resolve(null);
                mPendingPromise = null;
              }

              return;
            }

            new Timer().schedule(new TimerTask() {
              @Override
              public void run() {
                if (mPendingPromise != null) {
                  mPendingPromise.resolve(null);
                  mPendingPromise = null;
                }
              }
            }, ANIMATION_DURATION);
          }
        });

        mDialog.show();
      }
    });
  }

  private void hide() {
    if (mDialog == null) {
      if (mPendingPromise != null) {
        mPendingPromise.resolve(null); // The splashscreen is already hidden
        mPendingPromise = null;
      }

      return;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        final Activity activity = mDialog.getOwnerActivity();

        if (activity == null || activity.isFinishing()) {
          if (mPendingPromise != null) {
            mPendingPromise.reject("invalid_activity", "Couldn't call hide() without a valid Activity");
            mPendingPromise = null;
          }

          return;
        }

        final Window window = mDialog.getWindow();

        if (window != null) {
          if (mFadeOption) {
            window.setWindowAnimations(R.style.BootSplashDialogTheme);
          } else {
            window.setWindowAnimations(0);
          }
        }

        mDialog.setOnDismissListener(new DialogInterface.OnDismissListener() {

          @Override
          public void onDismiss(DialogInterface dialog) {
            if (mPendingPromise != null) {
              mPendingPromise.resolve(null);
              mPendingPromise = null;
            }

            mDialog = null;
          }
        });

        if (window == null || !mFadeOption) {
          mDialog.dismiss();
          return;
        }

        mDialog.hide();

        new Timer().schedule(new TimerTask() {
          @Override
          public void run() {
            mDialog.dismiss();
          }
        }, ANIMATION_DURATION);
      }
    });
  }

  @ReactMethod
  public void show(final boolean fade, final Promise promise) {
    if (mThemeResId == -1) {
      promise.reject("uninitialized_module", "react-native-bootsplash has not been initialized");
      return;
    }

    if (mPendingPromise != null) {
      promise.reject("task_already_pending", "A bootsplash task is already pending");
      return;
    }

    mPendingPromise = promise;
    mFadeOption = fade;

    if (mAppPaused) {
      mTaskToRunOnResume = "show";
    } else {
      show();
    }
  }

  @ReactMethod
  public void hide(final boolean fade, final Promise promise) {
    if (mThemeResId == -1) {
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
      hide();
    }
  }

  @ReactMethod
  public void getVisibilityStatus(final Promise promise) {
    if (mPendingPromise != null) {
      promise.resolve("transitioning");
    } else {
      if (mDialog != null) {
        promise.resolve("visible");
      } else {
        promise.resolve("hidden");
      }
    }
  }
}
