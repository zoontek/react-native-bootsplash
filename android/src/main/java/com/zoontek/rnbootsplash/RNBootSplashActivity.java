package com.zoontek.rnbootsplash;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class RNBootSplashActivity extends AppCompatActivity {

  protected Class<?> getMainActivityClass() throws Exception {
    final Context appContext = getApplicationContext();
    final Package appPackage = appContext.getClass().getPackage();
    assert appPackage != null;
    final String className = appPackage.getName() + ".MainActivity";

    return Class.forName(className);
  }

  protected void forwardIntentToMainActivity(Intent intent) {
    try {
      Intent intentCopy = new Intent(intent);

      intentCopy.setClass(this, getMainActivityClass());
      intentCopy.putExtras(intent);
      intentCopy.setData(intent.getData());
      intentCopy.setAction(intent.getAction());

      String type = intent.getType();

      if (type != null) {
        intentCopy.setType(type);
      }

      startActivity(intentCopy);
      finish();
    } catch (Exception e) {
      e.printStackTrace();
      finishAffinity();
    }
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    forwardIntentToMainActivity(intent);
  }

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    forwardIntentToMainActivity(getIntent());
  }
}
