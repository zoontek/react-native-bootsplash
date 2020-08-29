# Migration from v2

Even if a lot of changes landed, switching from v2 to v3 is actually quite easy 😎

## What's new

- A switch to react-native CLI (`npx react-native generate-bootsplash` instead of `npx generate-bootsplash` to generate assets, please follow the `README`)
- A complete rewriting in TS
- A Promise based API and UI thread pause handling (`hide` / `show` promises will be resolved only when the app has focus)
- A new `getVisibilityStatus()` method
- An easier setup on Android (no more `SplashScreenActivity` needed)

## File modifications

⚠️ Every file **not** in this list doesn't have to be changed.

1. `android/app/src/main/java/com/yourprojectname/MainActivity.java`

```diff
import android.os.Bundle; // <- add this necessary import

import com.facebook.react.ReactActivity;
import com.zoontek.rnbootsplash.RNBootSplash; // <- add this necessary import

public class MainActivity extends ReactActivity {

  // …

  @Override
  protected void onCreate(Bundle savedInstanceState) {
+   RNBootSplash.init(this, R.style.AppTheme);
    super.onCreate(savedInstanceState);
-   RNBootSplash.init(R.drawable.bootsplash, MainActivity.this);
  }
```

2. `android/app/src/main/res/values/styles.xml`

```diff
<resources>

  <!-- Base application theme -->
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <!-- Your base theme customization -->
    <!-- … -->
+   <item name="android:background">@drawable/bootsplash</item>
  </style>

- <!-- BootTheme should inherit from AppTheme -->
- <style name="BootTheme" parent="AppTheme">
-   <item name="android:background">@drawable/bootsplash</item>
- </style>

</resources>
```

3. `android/app/src/main/AndroidManifest.xml`

👀 As **not a single change is needed in this file anymore**, we restore it as it was originally.<br />
If you did handle deep linking in `RNBootSplashActivity`, move it back to `MainActivity` too!

```diff
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  package="com.rnbootsplashexample">

  <!-- … -->

  <application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="false"
    android:theme="@style/AppTheme">

    <activity
      android:name=".MainActivity"
      android:label="@string/app_name"
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
      android:launchMode="singleTask"
      android:windowSoftInputMode="adjustResize">
+     <intent-filter>
+       <action android:name="android.intent.action.MAIN" />
+       <category android:name="android.intent.category.LAUNCHER" />
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

    <!-- … -->

  </application>

</manifest>
```

4. **In your code**

```diff
import React, { useEffect } from "react";
import { Text } from "react-native";
import RNBootSplash from "react-native-bootsplash";

function App() {
  useEffect(() => {
-   RNBootSplash.hide({ duration: 250 });

+   RNBootSplash.hide({ fade: true }).then(() => {
+     console.log("bootsplash hidden!");
+   });
  }, []);

  return <Text>My awesome app</Text>;
}
```

## Generated files

No generated asset will be modified by the new CLI tool except `BootSplash.storyboard`.<br />
⚠️ We recommend doing it if you kept the base design with a centered logo.
