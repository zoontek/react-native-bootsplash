type config = {fade: bool};

[@bs.module "react-native-bootsplash"] [@bs.scope "default"]
external hide: config => unit = "hide";

[@bs.module "react-native-bootsplash"] [@bs.scope "default"]
external show: config => unit = "show";

/*
 ## Usage

 ```re
 ReactNativeBootSplash.hide({fade: true});
 ReactNativeBootSplash.show({fade: false});
 ```
 */
