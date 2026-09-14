package com.zoontek.rnbootsplash

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.RNBootSplashDrawMarkerManagerDelegate
import com.facebook.react.viewmanagers.RNBootSplashDrawMarkerManagerInterface

class RNBootSplashDrawMarkerManager :
  SimpleViewManager<RNBootSplashDrawMarkerView>(),
  RNBootSplashDrawMarkerManagerInterface<RNBootSplashDrawMarkerView> {

  private val mDelegate = RNBootSplashDrawMarkerManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<RNBootSplashDrawMarkerView> = mDelegate

  override fun getName(): String = NAME

  override fun createViewInstance(
    reactContext: ThemedReactContext
  ): RNBootSplashDrawMarkerView =
    RNBootSplashDrawMarkerView(reactContext, reactContext.reactApplicationContext)

  override fun getExportedCustomDirectEventTypeConstants() =
    mutableMapOf(
      RNBootSplashDrawnEvent.EVENT_NAME to mutableMapOf("registrationName" to "onDrawn"))

  override fun addEventEmitters(
    reactContext: ThemedReactContext,
    view: RNBootSplashDrawMarkerView
  ) {
    super.addEventEmitters(reactContext, view)

    view.onDrawn = {
      UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
        ?.dispatchEvent(RNBootSplashDrawnEvent(UIManagerHelper.getSurfaceId(view), view.id))
    }
  }

  override fun setAutoHide(view: RNBootSplashDrawMarkerView, value: Boolean) {
    view.autoHide = value
  }

  override fun setFade(view: RNBootSplashDrawMarkerView, value: Boolean) {
    view.fade = value
  }

  companion object {
    const val NAME = "RNBootSplashDrawMarker"
  }
}
