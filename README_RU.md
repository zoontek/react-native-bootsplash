# 🚀 react-native-bootsplash

Покажи bootsplash во время запуска приложения и скрой его, когда приложение готово.<br>
**Для миграции с v3 версии [`MIGRATION.md` руководство по миграции](https://github.com/zoontek/react-native-bootsplash/blob/master/MIGRATION.md).**

[![npm version](https://badge.fury.io/js/react-native-bootsplash.svg)](https://www.npmjs.org/package/react-native-bootsplash)
[![npm](https://img.shields.io/npm/dt/react-native-bootsplash.svg)](https://www.npmjs.org/package/react-native-bootsplash)
[![MIT](https://img.shields.io/dub/l/vibe-d.svg)](https://opensource.org/licenses/MIT)
[![Platform - Android](https://img.shields.io/badge/platform-Android-3ddc84.svg?style=flat&logo=android)](https://www.android.com)
[![Platform - iOS](https://img.shields.io/badge/platform-iOS-000.svg?style=flat&logo=apple)](https://developer.apple.com/ios)

<p>
  <img height="520" src="https://raw.githubusercontent.com/zoontek/react-native-bootsplash/HEAD/docs/ios_demo.gif?raw=true" alt="iOS demo"></img>
  <img height="500" src="https://raw.githubusercontent.com/zoontek/react-native-bootsplash/HEAD/docs/android_demo.gif?raw=true" alt="android demo"></img>
</p>

## Спонсирование проекта

<a href="https://github.com/sponsors/zoontek">
  <img align="right" width="150" alt="Нравится библиотека? Подумайте о спонсорстве!" src=".github/funding-octocat.svg">
</a>

Модуль представлен как есть (**as is**), его поддержка осуществляется в свободное время.

Если Вы являетесь компанией, которая использует эту библиоетку, подумайте о спонсировании проекта 💰. Вы также можете связаться со мной и помочь в исправлении ошибок, доработке функционала и т.д.

## Совместимость

| Версия библиотеки | Версия react-native |
|-------------------|---------------------|
| 4.0.0+            | 0.65.0+             |
| 3.0.0+            | 0.63.0+             |

## Установка

```bash
$ npm install --save react-native-bootsplash
# --- or ---
$ yarn add react-native-bootsplash
```

Не забудьте перейти в папку `ios` и запустить `pod install`.

## 🆘 Ручная привязка

Так как это проект нацелен на версию React Native 0.65.0+, Вам, вероятно, не понадобится ручная привязка. Но если у Вас особый случай, следуйте этим инструкциям:

<details>
  <summary><b>👀 Посмотреть инструкции для ручной привязки</b></summary>

### iOS

Добавьте эту строчку в `ios/Podfile`, затем введите `pod install`.

```bash
target 'YourAwesomeProject' do
  # …
  pod 'RNBootSplash', :path => '../node_modules/react-native-bootsplash'
end
```

### Android

1. Добавьте эти строки в `android/settings.gradle`:

```gradle
include ':react-native-bootsplash'
project(':react-native-bootsplash').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-bootsplash/android')
```

2. Добавьте имплементацию к зависимостям в `android/app/build.gradle`:

```gradle
dependencies {
  // ...
  implementation project(':react-native-bootsplash')
}
```

3. Импортируйте библиотеку и добавьте пакет `RNBootSplashPackage` в `MainApplication.java`:

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

## Установка

ℹ️ Для документации `react-native` < `0.68`, посмотрите [`v4.1.3 README.md`](https://github.com/zoontek/react-native-bootsplash/blob/4.1.3/README.md)

### Генерация bootsplash

Для того чтобы ускорить процесс установки bootsplash мы создали **специальную утилиту** для генерации `Android Drawable XML` и `iOS Storyboard` автоматически ✨.

```bash
$ npx react-native generate-bootsplash --help
# --- or ---
$ yarn react-native generate-bootsplash --help
```

Команда принимает некоторые аргументы:

```bash
yarn react-native generate-bootsplash <logoPath>

Generate a launch screen using an original logo file

Options:
  --background-color <color>  цвет фона (в формате hex) (по умолчанию: "#fff")
  --logo-width <width>        ширина лого в разрешении @1x (in dp - мы рекомендуем ~100) (по умолчанию: 100)
  --assets-path [path]        путь к дирректории assets (пример: src/assets/bootsplash_logo.png)
  --flavor <flavor>           [только для android] кастомный вариант для размещения bootsplash (размещает содержимое в папке отличной от "main")
  -h, --help                  output usage information
```

#### Пример команды

```bash
yarn react-native generate-bootsplash assets/bootsplash_logo_original.png \
  --background-color=F5FCFF \
  --logo-width=100 \
  --assets-path=assets \
  --flavor=main
```

#### Использование SVG

Возможно Вы хотите использовать SVG файлы, для этого установите следующую библиотеку:

```bash
$ brew install librsvg # available on macOS
$ rsvg-convert -w 3000 bootsplash_logo.svg -o bootsplash_logo.png # create a large PNG with generous leeway for 4x Android xxxhdpi devices
$ react-native generate-bootsplash bootsplash_logo.png
$ rm bootsplash_logo.png # optionally, clean up the PNG
```

![](https://raw.githubusercontent.com/zoontek/react-native-bootsplash/master/docs/cli_tool.png?raw=true)

Этот инструмент использует соглашения об именовании, которые используются в проекте `/example`, и поэтому создаст следующие файлы:
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

_⚠️  Поддерживаются только `.storyboard` файлы ([Apple перестала использовать этот формат в апреле 2020](https://developer.apple.com/news/?id=01132020b))._

---

Отредактируйте `ios/YourProjectName/AppDelegate.mm` файл:

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

Выберите `BootSplash.storyboard` как первоначальный экран:

| Перенесите файл                                                                                         | Создайте ссылки                                                                                         | Выберите `BootSplash.storyboard`                                                                        |
|---------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| ![](https://raw.githubusercontent.com/zoontek/react-native-bootsplash/master/docs/xcode-1.png?raw=true) | ![](https://raw.githubusercontent.com/zoontek/react-native-bootsplash/master/docs/xcode-2.png?raw=true) | ![](https://raw.githubusercontent.com/zoontek/react-native-bootsplash/master/docs/xcode-3.png?raw=true) |

### Android

_⚠️  На Android 12, заставка не появится, если Вы запустите приложение через terminal / Android Studio. Чтобы проверить работоспособность начального экрана, закройте приложение и откройте его как обычное приложение (откройте из списка приложений)._

---

1. Так как приложение поодерживает только Android 6+, Вам нужно отредактировать `android/build.gradle` file:

```gradle
buildscript {
  ext {
    buildToolsVersion = "31.0.0"
    minSdkVersion = 23 // <- AndroidX имеет только поддержку фона для sdk v21, v23 будет работать намного лучше
    compileSdkVersion = 31 // <- установите не менее 31
    targetSdkVersion = 31 // <- установите не менее 31

    // …
```

2. Далее отредактируйте `android/app/build.gradle`:

```gradle
dependencies {
  // …

  implementation "androidx.swiperefreshlayout:swiperefreshlayout:1.0.0"
  implementation "androidx.core:core-splashscreen:1.0.0-beta01" // Добавьте эту линию

  // …
```

3. Отредактируйте `android/app/src/main/res/values/styles.xml`:

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

4. Отредактируйте `android/app/src/main/AndroidManifest.xml`:

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
    android:theme="@style/BootTheme"> <!-- Замените @style/AppTheme на @style/BootTheme -->
    <!-- … -->
  </application>
</manifest>

```

5. И наконец, отредактируйте `android/app/src/main/java/com/yourprojectname/MainActivity.java`:

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
      RNBootSplash.init(getPlainActivity()); // <- инициализация splash screen
      super.loadApp(appKey);
    }
  }
}
```

## API

### hide()

#### Тип метода

```ts
type hide = (config?: { fade?: boolean }) => Promise<void>;
```

#### Использование

```js
import RNBootSplash from "react-native-bootsplash";

RNBootSplash.hide(); // немедленное скрытие
RNBootSplash.hide({ fade: true }); // плавное скрытие
```

### getVisibilityStatus()

#### Тип метода

```ts
type VisibilityStatus = "visible" | "hidden" | "transitioning";
type getVisibilityStatus = () => Promise<VisibilityStatus>;
```

#### Использование

```js
import RNBootSplash from "react-native-bootsplash";

RNBootSplash.getVisibilityStatus().then((status) => console.log(status));
```

## Реальный пример

```js
import React, { useEffect } from "react";
import { Text } from "react-native";
import RNBootSplash from "react-native-bootsplash";

function App() {
  useEffect(() => {
    const init = async () => {
      // …подготовительные процедуры для приложения
    };

    init().finally(async () => {
      await RNBootSplash.hide({ fade: true });
      console.log("Bootsplash has been hidden successfully");
    });
  }, []);

  return <Text>My awesome app</Text>;
}
```

**🤙 Другой пример доступен в [папке `/example`](example).**

## Использование React Navigation

Если Вы используете React Navigation, то можете скрыть splash screen после монтирования дочерних элементов используя функцию `onReady`.

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

## Тестирование с Jest

Тестирование кода, использующего эту библиотеку, требует некоторой настройки, поскольку нам нужно имитировать нативные методы.

Чтобы добавить mocks, создайте файл _jest/setup.js_ (или любое другое название файла) содержащий следующий код:

```js
jest.mock("react-native-bootsplash", () => {
  return {
    hide: jest.fn().mockResolvedValueOnce(),
    getVisibilityStatus: jest.fn().mockResolvedValue("hidden"),
  };
});
```

После этого необходимо добавить установочный файл в конфигурацию jest. Вы можете добавить его в разделе [установочные файлы](https://jestjs.io/docs/en/configuration.html#setupfiles-array) в вашем конфигурационном файле jest:

```json
{
  "setupFiles": ["<rootDir>/jest/setup.js"]
}
```

## 🕵️‍♂️ Сравнение с [react-native-splash-screen](https://github.com/crazycodeboy/react-native-splash-screen)

- If `react-native-splash-screen` побуждает Вас отображать изображение поверх вашего приложения, `react-native-bootsplash` позволяет создать splash screen используя нативные возможности обеих платформ.
- `react-native-bootsplash` не мешает видеть ошибки на главном экране
- Скрытие splash screen настроено под Вас: анимация, либо мгновенное скрытие

[Перевёл Михаил Киселёв](https://github.com/ksielyov)
