package com.zoontek.rnbootsplash;

import android.app.Activity;
import android.content.Context;
import android.view.View;
import android.widget.LinearLayout.LayoutParams;
import android.widget.LinearLayout;
import androidx.annotation.NonNull;

public class RNBootSplash {

  private static boolean showHasRunOnce = false;

  public static void show(final int drawableResId, @NonNull final Activity activity) {
    if (showHasRunOnce) return;

    activity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        Context context = activity.getApplicationContext();
        LinearLayout layout = new LinearLayout(context);
        LayoutParams params = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
        View view = new View(context);

        view.setBackgroundResource(drawableResId);
        layout.setId(R.id.bootsplash_layout_id);
        layout.setLayoutTransition(null);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.addView(view, params);

        activity.addContentView(layout, params);
        showHasRunOnce = true;
      }
    });
  }
}
