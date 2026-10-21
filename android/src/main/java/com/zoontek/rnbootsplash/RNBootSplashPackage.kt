package com.zoontek.rnbootsplash

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class RNBootSplashPackage : TurboReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == RNBootSplashModuleImpl.NAME) RNBootSplashModule(reactContext) else null
  }

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> = listOf(RNBootSplashDrawMarkerManager())

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      RNBootSplashModuleImpl.NAME to ReactModuleInfo(
        RNBootSplashModuleImpl.NAME,
        RNBootSplashModuleImpl.NAME,
        false,
        false,
        false,
        BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      )
    )
  }
}
