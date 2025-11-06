package com.zoontek.rnbootsplash

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class RNBootSplashPackage : TurboReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return when (name) {
      RNBootSplashModuleImpl.NAME -> RNBootSplashModule(reactContext)
      else -> null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      val isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

      val moduleInfo = ReactModuleInfo(
        RNBootSplashModuleImpl.NAME,
        RNBootSplashModuleImpl.NAME,
        false,
        false,
        false,
        isTurboModule
      )

      moduleInfos[RNBootSplashModuleImpl.NAME] = moduleInfo
      moduleInfos
    }
  }
}
