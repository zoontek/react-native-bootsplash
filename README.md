# 🚀 react-native-bootsplash

[![npm version](https://badge.fury.io/js/react-native-bootsplash.svg)](https://badge.fury.io/js/react-native-bootsplash) [![npm](https://img.shields.io/npm/dt/react-native-bootsplash.svg)](https://www.npmjs.org/package/react-native-bootsplash) ![Platform - Android and iOS](https://img.shields.io/badge/platform-Android%20%7C%20iOS-yellow.svg) ![MIT](https://img.shields.io/dub/l/vibe-d.svg) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Show a bootsplash during app startup. Hide it when you are ready.

<p>
  <img height="520" src="https://raw.githubusercontent.com/zoontek/react-native-bootsplash/HEAD/docs/ios_demo.gif?raw=true" alt="iOS demo"></img>
  <img width="300" src="https://raw.githubusercontent.com/zoontek/react-native-bootsplash/HEAD/docs/android_demo.gif?raw=true" alt="android demo"></img>
</p>

## Support

| version | react-native version |
| ------- | -------------------- |
| 1.0.0+  | 0.60.0+              |

For 0.59-, you should use [`jetify -r`](https://github.com/mikehardy/jetifier/blob/master/README.md#to-reverse-jetify--convert-node_modules-dependencies-to-support-libraries)

## Installation

```bash
$ npm install --save react-native-bootsplash
# --- or ---
$ yarn add react-native-bootsplash
```

## Setup

#### iOS

⚠️ Currently, only `.xib` are supported (no `.storyboard` or `.launchImages`).

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

For wix/react-native-navigation
```obj-c
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // …

  [ReactNativeNavigation bootstrap:[self sourceURLForBridge: bridge] launchOptions:launchOptions];
  
  [RNBootSplash show:@"LaunchScreen"];
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

  <item>
    <!-- the app logo, centered horizontally and vertically -->
    <bitmap
      android:src="@mipmap/ic_launcher"
      android:gravity="center" />
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

For wix/react-native-navigation
```java
import android.os.Bundle;
import androidx.annotation.Nullable;
import com.reactnativenavigation.NavigationActivity;
import com.zoontek.rnbootsplash.RNBootSplash;

public class MainActivity extends NavigationActivity {

    @Override
    public void onPostCreate(@Nullable Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);

        RNBootSplash.showCustom(com.project.R.drawable.splashscreen, com.project.R.color.splashprimary,this);
    }
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

For wix/react-native-navigation (this is last step, SKIP 4 step!!!)

Add to AppTheme:
```xml
        <item name="android:windowBackground">@drawable/bootsplash</item>
        <item name="android:windowTranslucentStatus">true</item>
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
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
      android:label="@string/app_name"
      android:windowSoftInputMode="adjustResize"
      android:exported="true"><!-- add this line -->
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

## 🕵️‍♂️ Comparison with [react-native-splash-screen](https://github.com/crazycodeboy/react-native-splash-screen)

- If `react-native-splash-screen` encourages you to display an image over your application, `react-native-bootsplash` way-to-go is to design your launch screen using platforms tools ([Xcode layout editor](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/AutolayoutPG/) and [Android drawable resource](https://developer.android.com/guide/topics/resources/drawable-resource)).

- Instead of displaying the launch screen over the main `UIView` / `Activity`, it will be displayed inside it. This prevents "jump" during transition (like in the example: horizontal & vertical centering using iOS auto layout or android gravity params will match perfectly the mounted component which uses `{ alignItems: "center"; justifyContent: "center" }` to center its logo).

- It should not prevents you from seeing red screen errors.

- Hiding the launch screen is configurable: fade it out with a custom duration or hide it without any animation at all (no fade needed if you want to animate it out!).
