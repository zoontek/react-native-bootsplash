package com.zoontek.rnbootsplash

import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = RNBootSplashModuleImpl.NAME)
class RNBootSplashModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String {
    return RNBootSplashModuleImpl.NAME
  }

  override fun onHostResume() {}

  override fun onHostPause() {}

  override fun onHostDestroy() {
    RNBootSplashModuleImpl.onHostDestroy()
  }

  override fun getConstants(): Map<String, Any> {
    return RNBootSplashModuleImpl.getConstants(reactApplicationContext)
  }

  @ReactMethod
  fun hide(fade: Boolean, promise: Promise) {
    RNBootSplashModuleImpl.hide(reactApplicationContext, fade, promise)
  }

  @ReactMethod
  fun isVisible(promise: Promise) {
    RNBootSplashModuleImpl.isVisible(promise)
  }
}
