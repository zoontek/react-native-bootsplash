package com.zoontek.rnbootsplash;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class RNBootSplashActivity extends AppCompatActivity {

  private Class<?> getMainActivityClass() throws Exception {
    final Context appContext = getApplicationContext();
    String packageName = appContext.getPackageName();
    assert packageName != null;
    final String className = packageName + ".MainActivity";

    return Class.forName(className);
  }

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    try {
      Intent intent = new Intent(this, getMainActivityClass());
      Bundle extras = getIntent().getExtras();
      String action = getIntent().getAction();

      if (extras != null) {
        intent.putExtras(extras);
      }
      if (Intent.ACTION_VIEW.equals(action)) {
        intent.setAction(action);
        intent.setData(getIntent().getData());
      }

      startActivity(intent);
      finish();
    } catch (Exception e) {
      e.printStackTrace();
      finishAffinity();
    }
  }
}
