package com.rnbootsplashexample;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.zoontek.rnbootsplash.RNBootSplash;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "RNBootSplashExample";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    RNBootSplash.init(R.drawable.bootsplash, MainActivity.this);
    /**
    * RNBootSplash.initLayout(R.layout.splash_layout, R.id.splash_id, MainActivity.this);
    * You can use this example if you want to implement a custom layout instead of a drawable.
    */
  }
}
