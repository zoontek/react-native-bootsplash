package com.zoontek.rnbootsplash

import android.annotation.SuppressLint
import android.app.Activity
import android.app.Application.ActivityLifecycleCallbacks
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import android.view.ViewTreeObserver.OnPreDrawListener
import androidx.annotation.StyleRes
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.PixelUtil

object RNBootSplashModuleImpl {
  const val NAME = "RNBootSplash"

  private enum class Status {
    HIDDEN,
    HIDING,
    INITIALIZING,
    VISIBLE,
  }

  @StyleRes private var mThemeResId = -1
  private val mPromiseQueue = RNBootSplashQueue<Promise>()
  private var mStatus = Status.HIDDEN
  private var mSplashView: RNBootSplashView? = null

  internal fun init(mainActivity: Activity?, @StyleRes themeResId: Int) {
    if (mThemeResId != -1) {
      return FLog.w(
        ReactConstants.TAG,
        "$NAME: Ignored initialization, module is already initialized."
      )
    }

    mThemeResId = themeResId

    if (mainActivity == null) {
      return FLog.w(
        ReactConstants.TAG,
        "$NAME: Ignored initialization, current activity is null."
      )
    }

    // Apply postBootSplashTheme
    val typedValue = TypedValue()
    val currentTheme = mainActivity.theme

    if (currentTheme.resolveAttribute(R.attr.postBootSplashTheme, typedValue, true)) {
      val finalThemeId = typedValue.resourceId

      if (finalThemeId != 0) {
        mainActivity.setTheme(finalThemeId)
      }
    }

    // Keep the splash screen on-screen until View is shown
    val contentView = mainActivity.findViewById<View>(android.R.id.content)
    mStatus = Status.INITIALIZING

    contentView.viewTreeObserver.addOnPreDrawListener(object : OnPreDrawListener {
      override fun onPreDraw(): Boolean {
        if (mStatus == Status.INITIALIZING) {
          return false
        }

        contentView.viewTreeObserver.removeOnPreDrawListener(this)
        return true
      }
    })

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      // This is not called on Android 12 when activity is started using intent
      // (Android studio / CLI / notification / widget…)
      val splashScreen = mainActivity.splashScreen

      splashScreen.setOnExitAnimationListener { view ->
        view.remove() // Remove it immediately, without animation
        splashScreen.clearOnExitAnimationListener()
      }

      // Mitigates race where splash exit listener may fire after activity stop (not a full fix)
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.TIRAMISU) {
        val application = mainActivity.application

        application.registerActivityLifecycleCallbacks(object : ActivityLifecycleCallbacks {
          override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
          override fun onActivityDestroyed(activity: Activity) {}
          override fun onActivityPaused(activity: Activity) {}
          override fun onActivityResumed(activity: Activity) {}
          override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
          override fun onActivityStarted(activity: Activity) {}

          override fun onActivityStopped(activity: Activity) {
            if (activity == mainActivity) {
              runCatching { splashScreen.clearOnExitAnimationListener() }
              application.unregisterActivityLifecycleCallbacks(this)
            }
          }
        })
      }
    }

    UiThreadUtil.runOnUiThread {
      mSplashView = RNBootSplashView(mainActivity, mThemeResId)
      mStatus = Status.VISIBLE
    }
  }

  private fun clearPromiseQueue() {
    generateSequence { mPromiseQueue.shift() }.forEach { it.resolve(true) }
  }

  private fun hideAndClearPromiseQueue(reactContext: ReactApplicationContext, fade: Boolean) {
    UiThreadUtil.runOnUiThread {
      val activity = reactContext.currentActivity

      if (
        mStatus == Status.INITIALIZING ||
          activity == null ||
          activity.isFinishing ||
          activity.isDestroyed
      ) {
        Handler(Looper.getMainLooper())
          .postDelayed({ hideAndClearPromiseQueue(reactContext, fade) }, 100)
        return@runOnUiThread
      }

      if (mStatus == Status.HIDING) {
        return@runOnUiThread // wait until fade out end for clearPromiseQueue
      }

      if (mStatus == Status.HIDDEN) {
        clearPromiseQueue()
        return@runOnUiThread // view is hidden
      }

      mStatus = Status.HIDING

      val callback = {
        mSplashView = null
        mStatus = Status.HIDDEN
        clearPromiseQueue()
      }

      mSplashView?.remove(fade, callback) ?: callback()
    }
  }

  // From https://stackoverflow.com/a/61062773
  val isSamsungOneUI4: Boolean by lazy {
    runCatching {
      val field = Build.VERSION::class.java.getDeclaredField("SEM_PLATFORM_INT")
      val version = (field.getInt(null) - 90000) / 10000
      version == 4
    }.getOrDefault(false)
  }

  internal fun onHostDestroy() {
    mStatus = Status.HIDDEN
    mThemeResId = -1
    clearPromiseQueue()

    mSplashView?.let { view ->
      view.animate().cancel()
      view.remove(false)
      mSplashView = null
    }
  }

  fun getConstants(reactContext: ReactApplicationContext): Map<String, Any> {
    val resources = reactContext.resources
    val uiMode = reactContext.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK

    @SuppressLint("InternalInsetResource", "DiscouragedApi")
    val statusBarHeightResId =
      resources.getIdentifier("status_bar_height", "dimen", "android")

    @SuppressLint("InternalInsetResource", "DiscouragedApi")
    val navigationBarHeightResId =
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

    return buildMap {
      put("darkModeEnabled", uiMode == Configuration.UI_MODE_NIGHT_YES)
      put("logoSizeRatio", if (isSamsungOneUI4) 0.5 else 1.0)
      put("navigationBarHeight", navigationBarHeight)
      put("statusBarHeight", statusBarHeight)
    }
  }

  fun hide(reactContext: ReactApplicationContext, fade: Boolean, promise: Promise) {
    mPromiseQueue.push(promise)
    hideAndClearPromiseQueue(reactContext, fade)
  }

  fun isVisible(): Boolean {
    return mStatus != Status.HIDDEN
  }
}
