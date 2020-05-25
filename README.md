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

Don't forget going into the `ios` directory to execute a `pod install`.

## 🆘 Manual linking

Because this package targets React Native 0.60.0+, you will probably don't need to link it manually. Otherwise if it's not the case, follow this additional instructions:

<details>
  <summary><b>👀 See manual linking instructions</b></summary>

### iOS

Add this line to your `ios/Podfile` file, then run `pod install`.

```bash
target 'YourAwesomeProject' do
  # …
  pod 'RNBootSplash', :path => '../node_modules/react-native-bootsplash'
end
```

### Android

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

</details>

## Setup

### Assets generation

In order to speed up the setup, we provide a **CLI** to resize assets, create the Android Drawable XML file and the iOS Storyboard file automatically ✨.

```bash
$ npx generate-bootsplash
# --- or ---
$ yarn generate-bootsplash
```

![](https://raw.githubusercontent.com/zoontek/react-native-bootsplash/master/scripts/screenshot.png?raw=true)

This tool relies on the naming conventions that are used in the `/example` project and will therefore create the following files:

```bash
<PROJECT_ROOT>/assets/bootsplash_logo.png
<PROJECT_ROOT>/assets/bootsplash_logo@1,5x.png
<PROJECT_ROOT>/assets/bootsplash_logo@2x.png
<PROJECT_ROOT>/assets/bootsplash_logo@3x.png
<PROJECT_ROOT>/assets/bootsplash_logo@4x.png

<PROJECT_ROOT>/android/app/src/main/res/drawable/bootsplash.xml
<PROJECT_ROOT>/android/app/src/main/res/values/colors.xml (creation and edition)
<PROJECT_ROOT>/android/app/src/main/res/mipmap-hdpi/bootsplash_logo.png
<PROJECT_ROOT>/android/app/src/main/res/mipmap-mdpi/bootsplash_logo.png
<PROJECT_ROOT>/android/app/src/main/res/mipmap-xhdpi/bootsplash_logo.png
<PROJECT_ROOT>/android/app/src/main/res/mipmap-xxhdpi/bootsplash_logo.png
<PROJECT_ROOT>/android/app/src/main/res/mipmap-xxxhdpi/bootsplash_logo.png

<PROJECT_ROOT>/ios/RNBootSplashExample/BootSplash.storyboard
<PROJECT_ROOT>/ios/RNBootSplashExample/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo.png
<PROJECT_ROOT>/ios/RNBootSplashExample/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo@2x.png
<PROJECT_ROOT>/ios/RNBootSplashExample/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo@3x.png
```

### iOS

_⚠️ Only `.storyboard` are supported ([Apple will deprecate other methods in April 2020](https://developer.apple.com/news/?id=01132020b))._

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
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  [RNBootSplash initWithStoryboard:@"BootSplash" rootView:rootView]; // <- initialization using the storyboard file name

  return YES;
}
```

Set the `BootSplash.storyboard` as launch screen file:

| Drag and drop the file                                                                                  | Create folder reference                                                                                 | Set as Launch Screen File                                                                               |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| ![](https://raw.githubusercontent.com/zoontek/react-native-bootsplash/master/docs/xcode-1.png?raw=true) | ![](https://raw.githubusercontent.com/zoontek/react-native-bootsplash/master/docs/xcode-2.png?raw=true) | ![](https://raw.githubusercontent.com/zoontek/react-native-bootsplash/master/docs/xcode-3.png?raw=true) |

### Android

1. Edit the `android/app/src/main/java/com/yourprojectname/MainActivity.java` file:

```java
import android.os.Bundle; // <- add this necessary import

import com.facebook.react.ReactActivity;
import com.zoontek.rnbootsplash.RNBootSplash; // <- add this necessary import

public class MainActivity extends ReactActivity {

  // …

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    RNBootSplash.init(R.drawable.bootsplash, MainActivity.this); // <- display the generated bootsplash.xml drawable over our MainActivity
  }
```

As Android will not create our main activity before launching the app, we need to display a different activity at start, then switch to our main one.

2. Edit the `android/app/src/main/res/values/styles.xml` file:

```xml
<resources>

  <!-- Base application theme -->
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <!-- Your base theme customization -->
  </style>

  <!-- Add the following lines -->
  <!-- BootTheme should inherit from AppTheme -->
  <style name="BootTheme" parent="AppTheme">
    <!-- set the generated bootsplash.xml drawable as activity background -->
    <item name="android:background">@drawable/bootsplash</item>
  </style>

</resources>
```

3. Edit the `android/app/src/main/AndroidManifest.xml` file:

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

    <!-- set android:launchMode="singleTask", set android:exported="true" -->
    <activity
      android:name=".MainActivity"
      android:label="@string/app_name"
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
      android:launchMode="singleTask"
      android:windowSoftInputMode="adjustResize"
      android:exported="true">
      <!-- ⚠️ remove the intent-filter from MainActivity -->
    </activity>

    <!-- add the following lines (use the theme you created at step 3) -->
    <activity
      android:name="com.zoontek.rnbootsplash.RNBootSplashActivity"
      android:theme="@style/BootTheme"
      android:launchMode="singleTask">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>

    <!-- … -->

  </application>

</manifest>
```

## API

### hide()

#### Method type

```ts
type hide = (config?: { duration?: number }) => void;
```

#### Usage

```js
import RNBootSplash from "react-native-bootsplash";

RNBootSplash.hide(); // immediate
RNBootSplash.hide({ duration: 250 }); // fade
```

---

### show()

#### Method type

```ts
type show = (config?: { duration?: number }) => void;
```

#### Usage

```js
import RNBootSplash from "react-native-bootsplash";

RNBootSplash.show(); // immediate
RNBootSplash.show({ duration: 250 }); // fade
```

## Real world example

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
      RNBootSplash.hide({ duration: 250 });
    });
  }, []);

  return <Text>My awesome app</Text>;
}
```

**🤙 A more complex example is available in the [`/example` folder](example).**

## Guides

### Handle deep linking (on Android)

If you want to correctly handle [deep linking](https://developer.android.com/training/app-links/deep-linking) with this package, you should edit the `android/app/src/main/AndroidManifest.xml` file like this:

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

    <!-- set android:launchMode="singleTask" and android:exported="true" -->
    <activity
      android:name=".MainActivity"
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
      android:label="@string/app_name"
      android:windowSoftInputMode="adjustResize"
      android:exported="true"
      android:launchMode="singleTask" />

    <activity
      android:name="com.zoontek.rnbootsplash.RNBootSplashActivity"
      android:theme="@style/BootTheme"
      android:launchMode="singleTask">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>

      <!-- add your deep linking instructions inside the RNBootSplashActivity declaration -->
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="YOUR APP SCHEME" /> <!-- replace this with your custom scheme -->
      </intent-filter>
    </activity>

    <!-- … -->

  </application>

</manifest>
```

## 🕵️‍♂️ Comparison with [react-native-splash-screen](https://github.com/crazycodeboy/react-native-splash-screen)

- If `react-native-splash-screen` encourages you to display an image over your application, `react-native-bootsplash` way-to-go is to design your launch screen using platforms tools ([Xcode layout editor](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/AutolayoutPG/) and [Android drawable resource](https://developer.android.com/guide/topics/resources/drawable-resource)).

- Instead of displaying the launch screen over the main `UIView` / `Activity`, it will be displayed inside it. This prevents "jump" during transition (like in the example: horizontal & vertical centering using iOS auto layout or android gravity params will match perfectly the mounted component which uses `{ alignItems: "center"; justifyContent: "center" }` to center its logo).

- It should not prevent you from seeing red screen errors.

- Hiding the launch screen is configurable: fade it out with a custom duration or hide it without any animation at all (no fade needed if you want to animate it out!).
