package com.zoontek.rnbootsplash;

import android.app.Activity;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.LinearLayout.LayoutParams;

import androidx.annotation.NonNull;

public class RNBootSplash {

  private static boolean showHasRunOnce = false;

  public static void show(final int layoutId, @NonNull final Activity activity) {
    if (showHasRunOnce) return;

    activity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        View view = activity.getLayoutInflater().inflate(layoutId, null, false);
        view.setId(R.id.bootsplash_layout_id);

        LayoutParams params = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);

        activity.addContentView(view, params);
        showHasRunOnce = true;
      }
    });
  }
}
