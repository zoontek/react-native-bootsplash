# 🚀 react-native-bootsplash

<a href="https://github.com/sponsors/zoontek">
  <img align="right" width="160" alt="This library helped you? Consider sponsoring!" src=".github/funding-octocat.svg">
</a>

Show a bootsplash during app startup. Hide it when you are ready.<br>
**For migration from the v3, check the [`MIGRATION.md` guide](https://github.com/zoontek/react-native-bootsplash/blob/master/MIGRATION.md).**

[![npm version](https://badge.fury.io/js/react-native-bootsplash.svg)](https://www.npmjs.org/package/react-native-bootsplash)
[![npm](https://img.shields.io/npm/dt/react-native-bootsplash.svg)](https://www.npmjs.org/package/react-native-bootsplash)
[![MIT](https://img.shields.io/dub/l/vibe-d.svg)](https://opensource.org/licenses/MIT)
[![Platform - Android](https://img.shields.io/badge/platform-Android-3ddc84.svg?style=flat&logo=android)](https://www.android.com)
[![Platform - iOS](https://img.shields.io/badge/platform-iOS-000.svg?style=flat&logo=apple)](https://developer.apple.com/ios)

<p>
  <img height="520" src="https://raw.githubusercontent.com/zoontek/react-native-bootsplash/HEAD/docs/ios_demo.gif?raw=true" alt="iOS demo"></img>
  <img height="500" src="https://raw.githubusercontent.com/zoontek/react-native-bootsplash/HEAD/docs/android_demo.gif?raw=true" alt="android demo"></img>
</p>

## Support

| version | react-native version |
| ------- | -------------------- |
| 4.0.0+  | 0.65.0+              |
| 3.0.0+  | 0.63.0+              |

## Installation

```bash
$ npm install --save react-native-bootsplash
# --- or ---
$ yarn add react-native-bootsplash
```

Don't forget going into the `ios` directory to execute a `pod install`.

## 🆘 Manual linking

Because this package targets React Native 0.65.0+, you probably don't need to link it manually. But if you have a special case, follow these additional instructions:

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

ℹ️ For `react-native` < `0.68` documentation, check the [`v4.1.3 README.md`](https://github.com/zoontek/react-native-bootsplash/blob/4.1.3/README.md)

### Assets generation

In order to speed up the setup, we provide a **CLI** to generate assets, create the Android Drawable XML file and the iOS Storyboard file automatically ✨.

```bash
$ npx react-native generate-bootsplash --help
# --- or ---
$ yarn react-native generate-bootsplash --help
```

The command can take multiple arguments:

```bash
yarn react-native generate-bootsplash <logoPath>

Generate a launch screen using an original logo file

Options:
  --background-color <color>  color used as launch screen background (in hexadecimal format) (default: "#fff")
  --logo-width <width>        logo width at @1x (in dp - we recommend approximately ~100) (default: 100)
  --assets-path [path]        path to your static assets directory (useful to require the logo file in JS)
  --flavor <flavor>           [android only] flavor build variant (outputs in an android resource directory other than "main")
  -h, --help                  output usage information
```

#### Full command usage example

```bash
yarn react-native generate-bootsplash assets/bootsplash_logo_original.png \
  --background-color=F5FCFF \
  --logo-width=100 \
  --assets-path=assets \
  --flavor=main
```

#### Using an SVG

You might want to use SVG as input file. For that, you can install a CLI tool to convert your logo first:

```bash
$ brew install librsvg # available on macOS
$ rsvg-convert -w 3000 bootsplash_logo.svg -o bootsplash_logo.png # create a large PNG with generous leeway for 4x Android xxxhdpi devices
$ react-native generate-bootsplash bootsplash_logo.png
$ rm bootsplash_logo.png # optionally, clean up the PNG
```

![](https://raw.githubusercontent.com/zoontek/react-native-bootsplash/master/docs/cli_tool.png?raw=true)

This tool relies on the naming conventions that are used in the `/example` project and will therefore create the following files:

```bash
# Only if --assets-path was specified
assets/bootsplash_logo.png
assets/bootsplash_logo@1,5x.png
assets/bootsplash_logo@2x.png
assets/bootsplash_logo@3x.png
assets/bootsplash_logo@4x.png

android/app/src/main/res/values/colors.xml (creation and edition)
android/app/src/main/res/mipmap-hdpi/bootsplash_logo.png
android/app/src/main/res/mipmap-mdpi/bootsplash_logo.png
android/app/src/main/res/mipmap-xhdpi/bootsplash_logo.png
android/app/src/main/res/mipmap-xxhdpi/bootsplash_logo.png
android/app/src/main/res/mipmap-xxxhdpi/bootsplash_logo.png

ios/YourProjectName/BootSplash.storyboard
ios/YourProjectName/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo.png
ios/YourProjectName/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo@2x.png
ios/YourProjectName/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo@3x.png
```

### iOS

_⚠️ Only `.storyboard` files are supported ([Apple has deprecated other methods in April 2020](https://developer.apple.com/news/?id=01132020b))._

Edit the `ios/YourProjectName/AppDelegate.mm` file:

```obj-c
#import "AppDelegate.h"
#import "RNBootSplash.h" // <- add the header import

// …

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

1. As this library only support Android 6+, you probably have to edit your `android/build.gradle` file:

```gradle
buildscript {
  ext {
    buildToolsVersion = "31.0.0"
    minSdkVersion = 23 // <- AndroidX splashscreen has basic support for 21 (only the background color), so 23 is best
    compileSdkVersion = 31 // <- set at least 31
    targetSdkVersion = 31 // <- set at least 31

    // …
```

2. Then edit your `android/app/build.gradle` file:

```gradle
dependencies {
  // …

  implementation "androidx.swiperefreshlayout:swiperefreshlayout:1.0.0"
  implementation "androidx.core:core-splashscreen:1.0.0-beta01" // Add this line

  // …
```

3. Edit your `android/app/src/main/res/values/styles.xml` file:

```xml
<resources>

  <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
      <!-- Your base theme customization -->
  </style>

  <!-- BootTheme should inherit from Theme.SplashScreen -->
  <style name="BootTheme" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">@color/bootsplash_background</item>
    <item name="windowSplashScreenAnimatedIcon">@mipmap/bootsplash_logo</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
  </style>

</resources>
```

4. Edit your `android/app/src/main/AndroidManifest.xml` file:

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
    android:theme="@style/BootTheme"> <!-- Replace @style/AppTheme with @style/BootTheme -->
    <!-- … -->
  </application>
</manifest>

```

5. Finally edit your `android/app/src/main/java/com/yourprojectname/MainActivity.java` file:

```java
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.zoontek.rnbootsplash.RNBootSplash; // <- add this necessary import

public class MainActivity extends ReactActivity {

  // …

  public static class MainActivityDelegate extends ReactActivityDelegate {

    // …

    @Override
    protected void loadApp(String appKey) {
      RNBootSplash.init(getPlainActivity()); // <- initialize the splash screen
      super.loadApp(appKey);
    }
  }
}
```

## API

### hide()

#### Method type

```ts
type hide = (config?: { fade?: boolean }) => Promise<void>;
```

#### Usage

```js
import RNBootSplash from "react-native-bootsplash";

RNBootSplash.hide(); // immediate
RNBootSplash.hide({ fade: true }); // fade
```

### getVisibilityStatus()

#### Method type

```ts
type VisibilityStatus = "visible" | "hidden" | "transitioning";
type getVisibilityStatus = () => Promise<VisibilityStatus>;
```

#### Usage

```js
import RNBootSplash from "react-native-bootsplash";

RNBootSplash.getVisibilityStatus().then((status) => console.log(status));
```

## Real world example

```js
import React, { useEffect } from "react";
import { Text } from "react-native";
import RNBootSplash from "react-native-bootsplash";

function App() {
  useEffect(() => {
    const init = async () => {
      // …do multiple sync or async tasks
    };

    init().finally(async () => {
      await RNBootSplash.hide({ fade: true });
      console.log("Bootsplash has been hidden successfully");
    });
  }, []);

  return <Text>My awesome app</Text>;
}
```

**🤙 A more complex example is available in the [`/example` folder](example).**

## Using React Navigation

If you are using React Navigation, you can hide the splash screen once the navigation container and all children have finished mounting by using the `onReady` function.

```js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import RNBootSplash from "react-native-bootsplash";

function App() {
  return (
    <NavigationContainer onReady={() => RNBootSplash.hide()}>
      {/* content */}
    </NavigationContainer>
  );
}
```

## Testing with Jest

Testing code which uses this library requires some setup since we need to mock the native methods.

To add the mocks, create a file _jest/setup.js_ (or any other file name) containing the following code:

```js
jest.mock("react-native-bootsplash", () => {
  return {
    hide: jest.fn().mockResolvedValueOnce(),
    getVisibilityStatus: jest.fn().mockResolvedValue("hidden"),
  };
});
```

After that, we need to add the setup file in the jest config. You can add it under [setupFiles](https://jestjs.io/docs/en/configuration.html#setupfiles-array) option in your jest config file:

```json
{
  "setupFiles": ["<rootDir>/jest/setup.js"]
}
```

## 🕵️‍♂️ Comparison with [react-native-splash-screen](https://github.com/crazycodeboy/react-native-splash-screen)

- If `react-native-splash-screen` encourages you to display an image over your application, `react-native-bootsplash` way-to-go is to design your launch screen using platforms tools.
- It should not prevent you from seeing red screen errors.
- Hiding the launch screen is configurable: fade it out or hide it without any animation.
