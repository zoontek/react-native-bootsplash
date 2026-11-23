package com.zoontek.rnbootsplash

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

internal class RNBootSplashDrawnEvent(surfaceId: Int, viewTag: Int) :
  Event<RNBootSplashDrawnEvent>(surfaceId, viewTag) {

  override fun getEventName() = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topDrawn"
  }
}
