# 🚀 react-native-launch-screen

[![npm version](https://badge.fury.io/js/react-native-launch-screen.svg)](https://badge.fury.io/js/react-native-launch-screen) [![npm](https://img.shields.io/npm/dt/react-native-launch-screen.svg)](https://www.npmjs.org/package/react-native-launch-screen) ![Platform - Android and iOS](https://img.shields.io/badge/platform-Android%20%7C%20iOS-yellow.svg) ![MIT](https://img.shields.io/dub/l/vibe-d.svg) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Display a launch screen on your app starts. Hide it when you want.

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
$ npm install --save react-native-launch-screen
# --- or ---
$ yarn add react-native-launch-screen
```

## Setup

#### iOS

Edit the `ios/YourProjectName/AppDelegate.m` file:

```obj-c
#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import "RNLaunchScreen.h" // <- add the header import

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // …

  [self.window makeKeyAndVisible];
  [RNLaunchScreen show:@"LaunchScreen" inView:rootView]; // <- display the "LaunchScreen" xib view over our rootView
  return YES;
}
```

#### Android

1. Create a `launch_screen.xml` file in `android/app/src/main/res/drawable` (create the folder if necessary). You can customize this as you want.

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
import com.zoontek.rnlaunchscreen.RNLaunchScreen; // <- add necessary import

public class MainActivity extends ReactActivity {

  // …

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    RNLaunchScreen.show(R.drawable.launch_screen, MainActivity.this); // <- display the "launch_screen" xml view over our MainActivity
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
  <!-- LaunchTheme should inherit from AppTheme -->
  <style name="LaunchTheme" parent="AppTheme">
    <!-- set launch_screen.xml as activity background -->
    <item name="android:background">@drawable/launch_screen</item>
  </style>

</resources>
```

4. Edit the `android/app/src/main/AndroidManifest.xml` file:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  package="com.rnlaunchscreenexample">

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
      android:name="com.zoontek.rnlaunchscreen.RNLaunchScreenActivity"
      android:theme="@style/LaunchTheme"> <!-- apply the theme you created at step 3. -->
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
import RNLaunchScreen from "react-native-launch-screen";

function App() {
  let init = async () => {
    // …do multiple async tasks
  };

  useEffect(() => {
    init().finally(() => {
      // without fadeout: RNLaunchScreen.hide()
      RNLaunchScreen.hide({ duration: 250 });
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
  pod 'RNLaunchScreen', :path => '../node_modules/react-native-launch-screen'
end
```

#### Android

1. Add the following lines to `android/settings.gradle`:

```gradle
include ':react-native-launch-screen'
project(':react-native-launch-screen').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-launch-screen/android')
```

2. Add the implementation line to the dependencies in `android/app/build.gradle`:

```gradle
dependencies {
  // ...
  implementation project(':react-native-launch-screen')
}
```

3. Add the import and link the package in `MainApplication.java`:

```java
import com.zoontek.rnlaunchscreen.RNLaunchScreenPackage; // <- add the RNLaunchScreenPackage import

public class MainApplication extends Application implements ReactApplication {

  // …

  @Override
  protected List<ReactPackage> getPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    // …
    packages.add(new RNLaunchScreenPackage());
    return packages;
  }

  // …
}
```
