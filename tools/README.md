## Tools

## `generateImageAssets`

Automatically updates your project dependencies to use a consistent [`react-native-bootsplash`](https://github.com/zoontek/react-native-bootsplash) compatible icon.

** Be sure to commit your work before executing! **

### Usage

```bash
node ./generateImageAssets.js --projectDir <path/to/project> --icon <path/to/icon>
```

This will update the icons of the React Native project defined at `path-to-project-directory` to the icon specified by `<path-to-icon>`. This tool currently relies on the naming conventions that are used in the [Example Project](https://github.com/zoontek/react-native-bootsplash/tree/master/example); and will therefore create the following files:

```bash
<path/to/project>/assets/react_logo.png (100x100)
<path/to/project>/assets/react_logo@1,5x.png (150x150)
<path/to/project>/assets/react_logo@2x.png (200x200)
<path/to/project>/assets/react_logo@3x.png (300x300)
<path/to/project>/assets/react_logo@4x.png (400x400)
<path/to/project>/android/app/src/main/res/mipmap-hdpi/react_logo.png (150x150)
<path/to/project>/android/app/src/main/res/mipmap-mdpi/react_logo.png (100x100)
<path/to/project>/android/app/src/main/res/mipmap-xhdpi/react_logo.png (200x200)
<path/to/project>/android/app/src/main/res/mipmap-xxhdpi/react_logo.png (300x300)
<path/to/project>/android/app/src/main/res/mipmap-xxxhdpi/react_logo.png (400x400)
<path/to/project>/ios/RNBootSplashExample/Images.xcassets/ReactLogo.imageset/react_logo.png (100x100)
<path/to/project>/ios/RNBootSplashExample/Images.xcassets/ReactLogo.imageset/react_logo@2x.png (200x200)
<path/to/project>/ios/RNBootSplashExample/Images.xcassets/ReactLogo.imageset/react_logo@3x.png (300x300)
```
