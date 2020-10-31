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

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    try {
      Intent originalIntent = getIntent();
      Intent intent = new Intent(originalIntent);

      intent.setClass(this, getMainActivityClass());
      intent.putExtras(originalIntent);
      intent.setData(originalIntent.getData());
      intent.setAction(originalIntent.getAction());

      startActivity(intent);
      finish();
    } catch (Exception e) {
      e.printStackTrace();
      finishAffinity();
    }
  }
}
