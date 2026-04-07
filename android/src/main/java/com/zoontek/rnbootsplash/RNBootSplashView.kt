package com.zoontek.rnbootsplash

import android.annotation.SuppressLint
import android.app.Activity
import android.view.View
import android.view.ViewGroup
import android.view.animation.AccelerateInterpolator
import androidx.annotation.StyleRes
import androidx.appcompat.view.ContextThemeWrapper

@SuppressLint("ViewConstructor")
class RNBootSplashView(activity: Activity, @StyleRes themeResId: Int) :
  View(ContextThemeWrapper(activity, themeResId)) {

  init {
    setBackgroundResource(
      if (RNBootSplashModuleImpl.isSamsungOneUI4) R.drawable.compat_splash_screen_oneui_4
      else R.drawable.compat_splash_screen
    )

    layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    )

    val decorView = activity.window.decorView as? ViewGroup
    decorView?.addView(this)
  }

  fun remove(fade: Boolean, callback: () -> Unit) {
    val parent = parent as? ViewGroup

    if (parent == null) {
      callback()
    } else if (fade) {
      animate()
        .alpha(0f)
        .setDuration(250)
        .setInterpolator(AccelerateInterpolator(2f))
        .withEndAction {
          parent.removeView(this)
          callback()
        }
        .start()
    } else {
      parent.removeView(this)
      callback()
    }
  }
}
