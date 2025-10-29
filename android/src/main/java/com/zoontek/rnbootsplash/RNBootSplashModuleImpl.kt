package com.zoontek.rnbootsplash

import android.annotation.SuppressLint
import android.app.Activity
import android.content.res.Configuration
import android.os.Build
import android.util.TypedValue
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewTreeObserver.OnPreDrawListener

import androidx.annotation.StyleRes

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.PixelUtil

import java.util.Timer
import java.util.TimerTask

object RNBootSplashModuleImpl {
  const val NAME = "RNBootSplash"

  private enum class Status {
    HIDDEN,
    HIDING,
    INITIALIZING,
    VISIBLE,
  }

  private val mPromiseQueue = RNBootSplashQueue<Promise>()
  private var mStatus = Status.HIDDEN

  @StyleRes
  private var mThemeResId = -1

  private var mInitialDialog: RNBootSplashDialog? = null
  private var mFadeOutDialog: RNBootSplashDialog? = null

  internal fun init(activity: Activity?, @StyleRes themeResId: Int) {
    if (mThemeResId != -1) {
      return FLog.w(
        ReactConstants.TAG,
        "$NAME: Ignored initialization, module is already initialized."
      )
    }

    mThemeResId = themeResId

    if (activity == null) {
      return FLog.w(
        ReactConstants.TAG,
        "$NAME: Ignored initialization, current activity is null."
      )
    }

    // Apply postBootSplashTheme
    val typedValue = TypedValue()
    val currentTheme = activity.theme

    if (currentTheme.resolveAttribute(R.attr.postBootSplashTheme, typedValue, true)) {
      val finalThemeId = typedValue.resourceId

      if (finalThemeId != 0) {
        activity.setTheme(finalThemeId)
      }
    }

    // Keep the splash screen on-screen until Dialog is shown
    val contentView = activity.findViewById<View>(android.R.id.content)
    mStatus = Status.INITIALIZING

    contentView
      .viewTreeObserver
      .addOnPreDrawListener(object : OnPreDrawListener {
        override fun onPreDraw(): Boolean {
          if (mStatus == Status.INITIALIZING) {
            return false
          }

          contentView
            .viewTreeObserver
            .removeOnPreDrawListener(this)

          return true
        }
      })

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      // This is not called on Android 12 when activity is started using intent
      // (Android studio / CLI / notification / widget…)
      activity
        .splashScreen
        .setOnExitAnimationListener { view ->
          view.remove() // Remove it immediately, without animation

          activity
            .splashScreen
            .clearOnExitAnimationListener()
        }
    }

    mInitialDialog = RNBootSplashDialog(activity, mThemeResId, false)

    UiThreadUtil.runOnUiThread {
      mInitialDialog?.show { mStatus = Status.VISIBLE }
    }
  }

  private fun clearPromiseQueue() {
    while (!mPromiseQueue.isEmpty()) {
      mPromiseQueue.shift()?.resolve(true)
    }
  }

  private fun hideAndClearPromiseQueue(reactContext: ReactApplicationContext, fade: Boolean) {
    UiThreadUtil.runOnUiThread {
      val activity = reactContext.currentActivity

      if (mStatus == Status.INITIALIZING
        || activity == null
        || activity.isFinishing
        || activity.isDestroyed
      ) {
        val timer = Timer()

        timer.schedule(object : TimerTask() {
          override fun run() {
            timer.cancel()
            hideAndClearPromiseQueue(reactContext, fade)
          }
        }, 100)

        return@runOnUiThread
      }

      if (mStatus == Status.HIDING) {
        return@runOnUiThread // wait until fade out end for clearPromiseQueue
      }

      if (mStatus == Status.HIDDEN) {
        clearPromiseQueue()
        return@runOnUiThread // both initial and fade out dialog are hidden
      }

      mStatus = Status.HIDING

      val hideSequence = {
        val fadeOutDialogDismiss = {
          mFadeOutDialog = null
          mStatus = Status.HIDDEN
          clearPromiseQueue()
        }

        val initialDialogDismiss = {
          mInitialDialog = null
          mFadeOutDialog?.dismiss(fadeOutDialogDismiss) ?: fadeOutDialogDismiss()
        }

        mInitialDialog?.dismiss(initialDialogDismiss) ?: initialDialogDismiss()
      }

      if (fade) {
        // Create a new Dialog instance with fade out animation
        mFadeOutDialog = RNBootSplashDialog(activity, mThemeResId, true)
        mFadeOutDialog?.show(hideSequence)
      } else {
        mInitialDialog?.dismiss(hideSequence) ?: hideSequence()
      }
    }
  }

  // From https://stackoverflow.com/a/61062773
  fun isSamsungOneUI4(): Boolean {
    return runCatching {
      val field = Build.VERSION::class.java.getDeclaredField("SEM_PLATFORM_INT")
      val version = (field.getInt(null) - 90000) / 10000
      version == 4
    }.getOrDefault(false)
  }

  internal fun onHostDestroy() {
    mStatus = Status.HIDDEN
    mThemeResId = -1
    clearPromiseQueue()

    mInitialDialog?.apply {
      dismiss()
      mInitialDialog = null
    }

    mFadeOutDialog?.apply {
      dismiss()
      mFadeOutDialog = null
    }
  }

  fun getConstants(reactContext: ReactApplicationContext): Map<String, Any> {
    val resources = reactContext.resources
    val constants = HashMap<String, Any>()

    val uiMode =
      reactContext.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK

    @SuppressLint("InternalInsetResource", "DiscouragedApi") val statusBarHeightResId =
      resources.getIdentifier("status_bar_height", "dimen", "android")

    @SuppressLint("InternalInsetResource", "DiscouragedApi") val navigationBarHeightResId =
      resources.getIdentifier("navigation_bar_height", "dimen", "android")

    val statusBarHeight = when {
      statusBarHeightResId > 0 ->
        PixelUtil.toDIPFromPixel(resources.getDimensionPixelSize(statusBarHeightResId).toFloat())
      else -> 0f
    }

    val navigationBarHeight = when {
      navigationBarHeightResId > 0 && !ViewConfiguration.get(reactContext).hasPermanentMenuKey() ->
        PixelUtil.toDIPFromPixel(resources.getDimensionPixelSize(navigationBarHeightResId).toFloat())
      else -> 0f
    }

    constants["darkModeEnabled"] = uiMode == Configuration.UI_MODE_NIGHT_YES
    constants["logoSizeRatio"] = if (isSamsungOneUI4()) 0.5 else 1.0
    constants["navigationBarHeight"] = navigationBarHeight
    constants["statusBarHeight"] = statusBarHeight

    return constants
  }

  fun hide(reactContext: ReactApplicationContext, fade: Boolean, promise: Promise) {
    mPromiseQueue.push(promise)
    hideAndClearPromiseQueue(reactContext, fade)
  }

  fun isVisible(): Boolean {
    return mStatus != Status.HIDDEN
  }
}
