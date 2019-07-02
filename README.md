# 🚀 react-native-bootsplash

[![npm version](https://badge.fury.io/js/react-native-bootsplash.svg)](https://badge.fury.io/js/react-native-bootsplash) [![npm](https://img.shields.io/npm/dt/react-native-bootsplash.svg)](https://www.npmjs.org/package/react-native-bootsplash) ![Platform - Android and iOS](https://img.shields.io/badge/platform-Android%20%7C%20iOS-yellow.svg) ![MIT](https://img.shields.io/dub/l/vibe-d.svg) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Show a bootsplash during app startup, hide it when you are ready. Hide it when you want.

<p>
  <img height="520" src="docs/ios_demo.gif?raw=true" alt="iOS demo"></img>
  <img width="300" src="docs/android_demo.gif?raw=true" alt="android demo"></img>
</p>

## Support

| version | react-native version |
| ------- | -------------------- |
| 0.1.0+  | 0.60.0+              |

## Setup

```bash
$ npm install --save react-native-bootsplash
# --- or ---
$ yarn add react-native-bootsplash
```

## Setup

#### iOS

Edit the `ios/YourProjectName/AppDelegate.m` file:

```obj-c
#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import "RNBootSplash.h" // <- add the header import

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // …

  [self.window makeKeyAndVisible];
  [RNBootSplash show:@"LaunchScreen" inView:rootView]; // <- display the "LaunchScreen" xib view over our rootView
  return YES;
}
```

#### Android

1. Create a `bootsplash.xml` file in `android/app/src/main/res/drawable` (create the folder if necessary). You can customize this as you want.

```xml
<?xml version="1.0" encoding="utf-8"?>

<layer-list xmlns:android="http://schemas.android.com/apk/res/android" android:opacity="opaque">
  <!-- the background color. it can be a system color or a custom one defined in colors.xml -->
  <item android:drawable="@android:color/white" />

  <item android:gravity="center">
    <!-- the app logo, centered horizontally and vertically -->
    <bitmap android:src="@mipmap/ic_launcher" />
  </item>
</layer-list>
```

2. Edit the `android/app/src/main/java/com/yourprojectname/MainActivity.java` file:

```java
import android.os.Bundle; // <- add necessary import

import com.facebook.react.ReactActivity;
import com.zoontek.rnbootsplash.RNBootSplash; // <- add necessary import

public class MainActivity extends ReactActivity {

  // …

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    RNBootSplash.show(R.drawable.bootsplash, MainActivity.this); // <- display the "bootsplash" xml view over our MainActivity
  }
```

As Android will not create our main activity before launching the app, we need to display a different activity at start, then switch to our main one.

3. Edit the `android/app/src/main/res/values/styles.xml` file:

```xml
<resources>

  <!-- Base application theme -->
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <!-- Your base theme customization -->
  </style>

  <!-- Add the following lines -->
  <!-- BootTheme should inherit from AppTheme -->
  <style name="BootTheme" parent="AppTheme">
    <!-- set bootsplash.xml as activity background -->
    <item name="android:background">@drawable/bootsplash</item>
  </style>

</resources>
```

4. Edit the `android/app/src/main/AndroidManifest.xml` file:

```xml
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
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
      android:windowSoftInputMode="adjustResize">
      <!-- remove the intent-filter from MainActivity -->
    </activity>

    <!-- add the following lines -->
    <activity
      android:name="com.zoontek.rnbootsplash.RNBootSplashActivity"
      android:theme="@style/BootTheme"> <!-- apply the theme you created at step 3. -->
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>

    <!-- … -->
  </application>

</manifest>

```

## Usage

```js
import React, { useEffect } from "react";
import { Text } from "react-native";
import RNBootSplash from "react-native-bootsplash";

function App() {
  let init = async () => {
    // …do multiple async tasks
  };

  useEffect(() => {
    init().finally(() => {
      // without fadeout: RNBootSplash.hide()
      RNBootSplash.hide({ duration: 250 });
    });
  }, []);

  return <Text>My awesome app</Text>;
}
```

**🤙 A more complex example is available in the [`/example` folder](example).**

## 🆘 Manual linking

Because this package targets React Native 0.60+, you will probably don't need to link it. Otherwise if you follow all the previous steps and it still doesn't work, try to link this library manually:

#### iOS

Add this line to your `ios/Podfile` file, then run `pod install`.

```bash
target 'YourAwesomeProject' do
  # …
  pod 'RNBootSplash', :path => '../node_modules/react-native-bootsplash'
end
```

#### Android

1. Add the following lines to `android/settings.gradle`:

```gradle
include ':react-native-bootsplash'
project(':react-native-bootsplash').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-bootsplash/android')
```

2. Add the implementation line to the dependencies in `android/app/build.gradle`:

```gradle
dependencies {
  // ...
  implementation project(':react-native-bootsplash')
}
```

3. Add the import and link the package in `MainApplication.java`:

```java
import com.zoontek.rnbootsplash.RNBootSplashPackage; // <- add the RNBootSplashPackage import

public class MainApplication extends Application implements ReactApplication {

  // …

  @Override
  protected List<ReactPackage> getPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    // …
    packages.add(new RNBootSplashPackage());
    return packages;
  }

  // …
}
```
