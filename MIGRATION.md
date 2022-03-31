# Migration from v3

## What's new

- The drop of Android < 6 and iOS < 11 (Android 5 is _possible_ but only displays the background color)
- A switch to [AndroidX splashscreen library](https://developer.android.com/jetpack/androidx/releases/core#core-splashscreen-1.0.0-beta01) to fully support Android 12
- The removal of the `show` method
- The `hide` method cannot reject anymore
- The switch to `RCTRootView` only on iOS (removed usage of `UIViewController`)
- An integration with [react-native-bars](https://github.com/zoontek/react-native-bars) for fully transparent system bars on Android

## Code modifications

ℹ️ For `react-native` < `0.68` migration guide, check the [`v4.1.3 README.md`](https://github.com/zoontek/react-native-bootsplash/blob/4.1.3/MIGRATION.md)

For `android/build.gradle`:

```diff
buildscript {
  ext {
-   buildToolsVersion = "31.0.0"
-   minSdkVersion = 21
-   compileSdkVersion = 30
-   targetSdkVersion = 30
+   buildToolsVersion = "30.0.2"
+   minSdkVersion = 23
+   compileSdkVersion = 31
+   targetSdkVersion = 31
    ndkVersion = "21.4.7075529"
  }

  // …
```

For `android/app/build.gradle`:

```diff
// …

dependencies {
  // …

  implementation "androidx.swiperefreshlayout:swiperefreshlayout:1.0.0"
+ implementation "androidx.core:core-splashscreen:1.0.0-beta01"
```

For `android/app/src/main/res/values/styles.xml`:

```diff
<resources>

  <!-- … -->

- <!-- BootTheme should inherit from AppTheme -->
- <style name="BootTheme" parent="AppTheme">
-   <!-- set bootsplash.xml as background -->
-   <item name="android:background">@drawable/bootsplash</item>
- </style>

+ <!-- BootTheme should inherit from Theme.SplashScreen -->
+ <style name="BootTheme" parent="Theme.SplashScreen">
+   <item name="windowSplashScreenBackground">@color/bootsplash_background</item>
+   <item name="windowSplashScreenAnimatedIcon">@mipmap/bootsplash_logo</item>
+   <item name="postSplashScreenTheme">@style/AppTheme</item>
+ </style>

</resources>
```

For `android/app/src/main/AndroidManifest.xml`:

```diff
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  package="com.rnbootsplashexample">

  <uses-permission android:name="android.permission.INTERNET" />

  <application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="false"
-   android:theme="@style/AppTheme">
+   android:theme="@style/BootTheme">

    <activity
      android:name=".MainActivity"
      android:label="@string/app_name"
      android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
      android:launchMode="singleTask"
      android:windowSoftInputMode="adjustResize"
      android:exported="true">
+     <intent-filter>
+         <action android:name="android.intent.action.MAIN" />
+         <category android:name="android.intent.category.LAUNCHER" />
+     </intent-filter>
    </activity>

-   <activity
-     android:name="com.zoontek.rnbootsplash.RNBootSplashActivity"
-     android:theme="@style/BootTheme"
-     android:launchMode="singleTask">
-     <intent-filter>
-       <action android:name="android.intent.action.MAIN" />
-       <category android:name="android.intent.category.LAUNCHER" />
-     </intent-filter>
-   </activity>
  </application>
</manifest>
```

For `android/app/src/main/java/com/yourprojectname/MainActivity.java`:

```diff
- import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.zoontek.rnbootsplash.RNBootSplash;

public class MainActivity extends ReactActivity {

  // …

- @Override
- protected void onCreate(Bundle savedInstanceState) {
-   super.onCreate(savedInstanceState);
-   RNBootSplash.init(R.drawable.bootsplash, MainActivity.this);
- }

  public static class MainActivityDelegate extends ReactActivityDelegate {
    public MainActivityDelegate(ReactActivity activity, String mainComponentName) {
      super(activity, mainComponentName);
    }

    @Override
    protected ReactRootView createRootView() {
      ReactRootView reactRootView = new ReactRootView(getContext());
      // If you opted-in for the New Architecture, we enable the Fabric Renderer.
      reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED);
      return reactRootView;
    }

+   @Override
+   protected void loadApp(String appKey) {
+     RNBootSplash.init(getPlainActivity());
+     super.loadApp(appKey);
+   }
  }
}
```

## Generated files

You **must** re-generate your assets.

- You can delete `android/app/src/main/res/drawable/bootsplash.xml` (now unused).
- All Android related assets now include padding.
