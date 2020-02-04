package com.zoontek.rnbootsplash;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.app.Activity;
import android.view.ViewGroup;
import android.view.animation.AccelerateInterpolator;
import android.widget.LinearLayout;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = RNBootSplashModule.MODULE_NAME)
public class RNBootSplashModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  public static final String MODULE_NAME = "RNBootSplash";

  private boolean hideHasRun = false;
  private boolean hideOnAppResume = false;

  public RNBootSplashModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  @Override
  public void onHostResume() {
    if (hideOnAppResume) {
      hide(0.0f);
      hideOnAppResume = false;
    }
  }

  @Override
  public void onHostPause() {}

  @Override
  public void onHostDestroy() {}

  @ReactMethod
  public void hide(final Float duration) {
    if (hideHasRun) return;

    Activity activity = getReactApplicationContext().getCurrentActivity();

    if (activity == null) {
      hideOnAppResume = true;
      return;
    }

    final LinearLayout layout = activity.findViewById(R.id.bootsplash_layout_id);
    if (layout == null) return;

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        hideHasRun = true;

        final ViewGroup parent = (ViewGroup) layout.getParent();
        int roundedDuration = duration.intValue();

        if (roundedDuration <= 0) {
          parent.removeView(layout);
          return;
        }

        layout
            .animate()
            .setDuration(roundedDuration)
            .alpha(0.0f)
            .setInterpolator(new AccelerateInterpolator())
            .setListener(new AnimatorListenerAdapter() {
              @Override
              public void onAnimationEnd(Animator animation) {
                super.onAnimationEnd(animation);
                parent.removeView(layout);
                hideHasRun = false;
              }
            }).start();
      }
    });
  }
}
