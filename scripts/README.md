## Tools

## `generateImageAssets`

Automatically updates your project dependencies to use a consistent [`react-native-bootsplash`](https://github.com/zoontek/react-native-bootsplash) compatible icon.

**Be sure to commit your work before executing!**

### Usage

```bash
npx generate-bootsplash-assets <path/to/icon>
```

This will update the icons of the React Native project defined at `path-to-project-directory` to the icon specified by `<path/to/icon>`. This tool currently relies on the naming conventions that are used in the [Example project](https://github.com/zoontek/react-native-bootsplash/tree/master/example); and will therefore create the following files:

```
<path/to/project>/assets/bootsplash_logo.png (100x100)
<path/to/project>/assets/bootsplash_logo@1,5x.png (150x150)
<path/to/project>/assets/bootsplash_logo@2x.png (200x200)
<path/to/project>/assets/bootsplash_logo@3x.png (300x300)
<path/to/project>/assets/bootsplash_logo@4x.png (400x400)

<path/to/project>/android/app/src/main/res/mipmap-hdpi/bootsplash_logo.png (150x150)
<path/to/project>/android/app/src/main/res/mipmap-mdpi/bootsplash_logo.png (100x100)
<path/to/project>/android/app/src/main/res/mipmap-xhdpi/bootsplash_logo.png (200x200)
<path/to/project>/android/app/src/main/res/mipmap-xxhdpi/bootsplash_logo.png (300x300)
<path/to/project>/android/app/src/main/res/mipmap-xxxhdpi/bootsplash_logo.png (400x400)

<path/to/project>/ios/RNBootSplashExample/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo.png (100x100)
<path/to/project>/ios/RNBootSplashExample/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo@2x.png (200x200)
<path/to/project>/ios/RNBootSplashExample/Images.xcassets/BootSplashLogo.imageset/bootsplash_logo@3x.png (300x300)
```
