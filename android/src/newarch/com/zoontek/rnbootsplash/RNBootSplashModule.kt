package com.zoontek.rnbootsplash

import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = RNBootSplashModuleImpl.NAME)
class RNBootSplashModule(reactContext: ReactApplicationContext) :
  NativeRNBootSplashSpec(reactContext), LifecycleEventListener {

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

  override fun getTypedExportedConstants(): Map<String, Any> {
    return RNBootSplashModuleImpl.getConstants(reactApplicationContext)
  }

  override fun hide(fade: Boolean, promise: Promise) {
    RNBootSplashModuleImpl.hide(reactApplicationContext, fade, promise)
  }

  override fun isVisible(promise: Promise) {
    RNBootSplashModuleImpl.isVisible(promise)
  }
}
