package com.zoontek.rnbootsplash

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.os.Build
import android.view.View
import com.facebook.react.bridge.ReactApplicationContext

@SuppressLint("ViewConstructor")
class RNBootSplashDrawMarkerView(
  context: Context,
  private val reactContext: ReactApplicationContext,
) : View(context) {

  var fade: Boolean = false

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
    scheduleBootSplashHide()
  }

  private fun scheduleBootSplashHide() {
    val hide = Runnable { RNBootSplashModuleImpl.hide(reactContext, fade) }

    // Hide once the frame holding this marker has been submitted, or on the next loop iteration
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      viewTreeObserver.registerFrameCommitCallback(hide)
    } else {
      post(hide)
    }
  }
}
