package com.zoontek.rnbootsplash

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.os.Build
import android.view.View

@SuppressLint("ViewConstructor")
class RNBootSplashDrawMarkerView(context: Context) : View(context) {

  var onDrawn: (() -> Unit)? = null

  private var hasDrawn = false

  init {
    setWillNotDraw(false)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    invalidate()
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)

    if (hasDrawn) {
      return
    }

    hasDrawn = true
    scheduleDrawn()
  }

  private fun scheduleDrawn() {
    val drawn = Runnable { onDrawn?.invoke() }

    // Run once the frame holding this marker has been submitted, or on the next loop iteration
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      viewTreeObserver.registerFrameCommitCallback(drawn)
    } else {
      post(drawn)
    }
  }
}
