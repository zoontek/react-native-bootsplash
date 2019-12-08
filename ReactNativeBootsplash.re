type hideOptions;
[@bs.obj] external hideOptions: (~duration: float=?) => hideOptions = "";

[@bs.module "react-native-bootsplash"] [@bs.scope "default"]
external hide: option(hideOptions) => unit = "hide";

/*
 ## Usage

 ### No options

 ```re
 ReactNativeBootsplash.hide(None);
 ```

 ## With options

 ```re
 ReactNativeBootsplash.(hide(Some(hideOptions(~duration=1000.))));
 ```

 */
