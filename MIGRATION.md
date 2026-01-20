# Migration from v6

## What's new

- The library is now edge-to-edge by default on Android
- The Expo plugin now generates assets at prebuild (no need to run the CLI first)
- `isVisible()` is now synchronous
- A new `--plist` CLI option to specify a custom `Info.plist` file path

## Breaking changes

### Requirements

- React Native **0.80+**
- Node.js **20+**
- Expo SDK **54+**

### CLI changes

- The `--project-type` option has been removed
- The `npx react-native generate-bootsplash` command has been removed. Use `npx react-native-bootsplash generate` instead

### Expo plugin changes

- The plugin now generates assets at prebuild (no need to run the CLI first)
- The `assetsDir` option has been renamed to `assetsOutput`
- The `android.parentTheme` option has been removed (the default theme is now edge-to-edge)

New plugin options for asset generation:

```ts
type PluginOptions = {
  android?: {
    darkContentBarsStyle?: boolean; // Enforce system bars style (default: undefined)
  };

  logo: string; // Logo file path (PNG or SVG) - required
  background?: string; // Background color (in hexadecimal format) (default: "#fff")
  logoWidth?: number; // Logo width at @1x (in dp - we recommend approximately ~100) (default: 100)
  assetsOutput?: string; // Assets output directory path (default: "assets/bootsplash")

  // Addon options
  licenseKey?: string; // License key to enable brand and dark mode assets generation
  brand?: string; // Brand file path (PNG or SVG)
  brandWidth?: number; // Brand width at @1x (in dp - we recommend approximately ~80) (default: 80)
  darkBackground?: string; // [dark mode] Background color (in hexadecimal format)
  darkLogo?: string; // [dark mode] Logo file path (PNG or SVG)
  darkBrand?: string; // [dark mode] Brand file path (PNG or SVG)
};
```

```diff
// app.json
{
  "expo": {
+   "platforms": ["android", "ios", "web"], // must be explicit
    "plugins": [
-     ["react-native-bootsplash", { "assetsDir": "./assets/bootsplash" }],
+     [
+       "react-native-bootsplash",
+       {
+         "logo": "./assets/logo.png",
+         "background": "#f5fcff",
+         "logoWidth": 100,
+         "assetsOutput": "./assets/bootsplash"
+         // …
+       }
+     ]
    ]
  }
}
```

### Android theme changes

- `Theme.BootSplash` is now edge-to-edge by default
- `Theme.BootSplash.EdgeToEdge` and `Theme.BootSplash.TransparentStatus` have been removed

If you were using `Theme.BootSplash.EdgeToEdge` or `Theme.BootSplash.TransparentStatus`, simply switch to `Theme.BootSplash`:

```diff
<!-- values/styles.xml -->
- <style name="BootTheme" parent="Theme.BootSplash.EdgeToEdge">
+ <style name="BootTheme" parent="Theme.BootSplash">
```

### API changes

The `isVisible()` method is now synchronous:

```diff
- BootSplash.isVisible().then((value) => console.log(value));

+ if (BootSplash.isVisible()) {
+   // Do something
+ }
```

## How to update

1. Update your `package.json` to use `react-native-bootsplash@^7.0.0`
2. If using Expo, update your plugin config accordingly
3. If you were using `Theme.BootSplash.TransparentStatus` or `Theme.BootSplash.EdgeToEdge`, switch to `Theme.BootSplash`
4. Update any `isVisible()` calls to use the new synchronous API
5. Replace `npx react-native generate-bootsplash` with `npx react-native-bootsplash generate` in your scripts
6. Run the CLI to regenerate assets
