# Migration from v4

## What's new

- Brand image support
- Dark mode support 🌚
- A new hook, `useHideAnimation`, allowing you to easily animate all splash screen elements using `Animated` or `react-native-reanimated`. Create something nicer than a simple fade 🚀
- An improved CLI generator, now able to edit / output **57** files (light and dark logos + light and dark brand images, config files…for all pixel densities!). Note that the new options require a [license key 🔑](https://zoontek.gumroad.com/l/bootsplash-generator)

## What else?

- [AndroidX SplashScreen library](https://developer.android.com/jetpack/androidx/releases/core#core-splashscreen-1.0.0) has been replaced in order to solve a lot of known issues with it ([#381](https://github.com/zoontek/react-native-bootsplash/issues/381), [#418](https://github.com/zoontek/react-native-bootsplash/issues/418), [#440](https://github.com/zoontek/react-native-bootsplash/issues/440), [#456](https://github.com/zoontek/react-native-bootsplash/issues/456), etc). `react-native-bootsplash` now uses its own polyfill, compatible with Android 5+ (without any degraded mode).
- Android generated assets has been migrated from `mipmap-*` directories to `drawable-*` ones.
- To avoid conflicts, Android provided theme / properties has been renamed `Theme.BootSplash` / `Theme.BootSplash.EdgeToEdge`, `bootSplashBackground`, `bootSplashLogo`, `bootSplashBrand` and `postBootSplashTheme`.
- The `duration` argument has been removed from `fade()` options.
- `getVisibilityStatus()` has been replaced with `isVisible()` (which returns a `Promise<boolean>`). The `transitioning` does not exists anymore (when the splash screen is fading, it stays `visible` until complete disappearance).
- The CLI now output a `bootsplash_manifest.json` file to share image sizes + colors with the JS thread (used by `useHideAnimation`).
- `--assets-path` CLI option has been renamed `--assets-output`.
- React native < 0.70 support has been dropped, iOS < 12.4 support too.
- ReScript support has been removed as I don't know how to write bindings for it. Feels free to open a PR to add it back.

## How to update

👉 First, run the CLI to generate assets in updated locations!<br>
It will also update your `BootSplash.storyboard`, the only change to perform on iOS.

### Android

1. Delete all `android/app/src/main/res/mipmap-*/bootsplash_logo.png` files.

2. Edit your `android/app/build.gradle` file:

```diff
// …

dependencies {
  // The version of react-native is set by the React Native Gradle Plugin
  implementation("com.facebook.react:react-android")
- implementation("androidx.core:core-splashscreen:1.0.0")
```

3. Edit your `values/styles.xml` file:

```diff
- <!-- BootTheme should inherit from Theme.SplashScreen -->
+ <!-- BootTheme should inherit from Theme.BootSplash or Theme.BootSplash.EdgeToEdge -->
- <style name="BootTheme" parent="Theme.SplashScreen">
+ <style name="BootTheme" parent="Theme.BootSplash">
-   <item name="windowSplashScreenBackground">@color/bootsplash_background</item>
+   <item name="bootSplashBackground">@color/bootsplash_background</item>
-   <item name="windowSplashScreenAnimatedIcon">@mipmap/bootsplash_logo</item>
+   <item name="bootSplashLogo">@drawable/bootsplash_logo</item>
-   <item name="postSplashScreenTheme">@style/AppTheme</item>
+   <item name="postBootSplashTheme">@style/AppTheme</item>
  </style>
```

4. Edit your `MainActivity.java` file:

```diff
  @Override
  protected void onCreate(Bundle savedInstanceState) {
-   RNBootSplash.init(this);
+   RNBootSplash.init(this, R.style.BootTheme);
    super.onCreate(savedInstanceState);
  }
```
