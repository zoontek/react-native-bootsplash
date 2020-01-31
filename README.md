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

_⚠️ This library does not support `react-native-navigation` and it's a non-goal for now._

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

#### iOS

_⚠️ Currently, only `.xib` are supported (no `.storyboard` or `.launchImages`)._

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

1. Create a `bootsplash.xml` file in `android/app/src/main/res/layout` (create the folder if necessary). You can customize this as you want.

```<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:orientation="vertical" android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:gravity="center_vertical"
    android:background="@android:color/white"
    >

    <ImageView
        android:id="@+id/imageView"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        app:srcCompat="@mipmap/ic_launcher" /> 
        <!--   Change "@mipmap/ic_launcher" to "@mipmap/bootsplash_logo" if you have used the image asset generator -->


</LinearLayout>
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
    RNBootSplash.show(R.layout.bootsplash, MainActivity.this); // <- display the "bootsplash" xml view over our MainActivity
  }
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

## Guides

### Generate image assets

You can automatically updates your project assets to use a consistent looking icon!

![](https://raw.githubusercontent.com/zoontek/react-native-bootsplash/HEAD/scripts/screenshot.png?raw=true)

```bash
$ npx generate-bootsplash-assets
# --- or ---
$ yarn generate-bootsplash-assets
```

This tool currently relies on the naming conventions that are used in the `/example` project, and will therefore create the following files:

```bash
<path/to/project>/assets/bootsplash_logo.png
<path/to/project>/assets/bootsplash_logo@1,5x.png
<path/to/project>/assets/bootsplash_logo@2x.png
<path/to/project>/assets/bootsplash_logo@3x.png
<path/to/project>/assets/bootsplash_logo@4x.png

<path/to/project>/android/app/src/main/res/mipmap-mdpi/bootsplash_logo.png
<path/to/project>/android/app/src/main/res/mipmap-hdpi/bootsplash_logo.png
<path/to/project>/android/app/src/main/res/mipmap-xhdpi/bootsplash_logo.png
<path/to/project>/android/app/src/main/res/mipmap-xxhdpi/bootsplash_logo.png
<path/to/project>/android/app/src/main/res/mipmap-xxxhdpi/bootsplash_logo.png

<path/to/project>/ios/RNBootSplashExample/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo.png
<path/to/project>/ios/RNBootSplashExample/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo@2x.png
<path/to/project>/ios/RNBootSplashExample/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo@3x.png
```

## 🕵️‍♂️ Comparison with [react-native-splash-screen](https://github.com/crazycodeboy/react-native-splash-screen)

- If `react-native-splash-screen` encourages you to display an image over your application, `react-native-bootsplash` way-to-go is to design your launch screen using platforms tools ([Xcode layout editor](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/AutolayoutPG/) and [Android drawable resource](https://developer.android.com/guide/topics/resources/drawable-resource)).

- Instead of displaying the launch screen over the main `UIView` / `Activity`, it will be displayed inside it. This prevents "jump" during transition (like in the example: horizontal & vertical centering using iOS auto layout or android gravity params will match perfectly the mounted component which uses `{ alignItems: "center"; justifyContent: "center" }` to center its logo).

- It should not prevents you from seeing red screen errors.

- Hiding the launch screen is configurable: fade it out with a custom duration or hide it without any animation at all (no fade needed if you want to animate it out!).
