package com.zoontek.rnbootsplash;

import android.content.Intent;
import android.os.Bundle;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class RNBootSplashActivity extends AppCompatActivity {

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    try {
      startActivity(new Intent(this, Class.forName(getApplicationContext()
          .getPackageName() + ".MainActivity")));

      finish();
    } catch (ClassNotFoundException e) {
      e.printStackTrace();
    }
  }
}
