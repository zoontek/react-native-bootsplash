package com.rnlaunchscreenexample;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.zoontek.rnlaunchscreen.RNLaunchScreen;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript.
   * This is used to schedule rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "RNLaunchScreenExample";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    RNLaunchScreen.show(R.drawable.launch_screen, MainActivity.this);
  }
}
