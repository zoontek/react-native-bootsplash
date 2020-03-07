type showConfig;
[@bs.obj] external showConfig: (~duration: float=?) => showConfig = "";

type hideConfig;
[@bs.obj] external hideConfig: (~duration: float=?) => hideConfig = "";

[@bs.module "react-native-bootsplash"] [@bs.scope "default"]
external show: option(showConfig) => unit = "show";

[@bs.module "react-native-bootsplash"] [@bs.scope "default"]
external hide: option(hideConfig) => unit = "hide";

/*
 ## Usage

 ### No options

 ```re
 ReactNativeBootSplash.hide(None);
 ReactNativeBootSplash.show(None);
 ```

 ## With options

 ```re
 ReactNativeBootSplash.(show(Some(showConfig(~duration=1000.))));
 ReactNativeBootSplash.(hide(Some(hideConfig(~duration=1000.))));
 ```

 */
