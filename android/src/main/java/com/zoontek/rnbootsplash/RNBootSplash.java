package com.zoontek.rnbootsplash;

import android.app.Activity;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.LinearLayout;
import androidx.annotation.NonNull;

public class RNBootSplash {

  private static boolean showHasRunOnce = false;

  public static void show(final int layoutId, @NonNull final Activity activity) {
    if (showHasRunOnce) return;

    activity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        Context context = activity.getApplicationContext();
        LinearLayout layout = new LinearLayout(context);

        LayoutInflater inflater = activity.getLayoutInflater();
        View view = inflater.inflate(layoutId, layout, false);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT);
        view.setId(R.id.bootsplash_layout_id);

        activity.addContentView(view, params);
        showHasRunOnce = true;
      }
    });
  }
}
