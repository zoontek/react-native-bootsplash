type config = {fade: bool}

@bs.module("react-native-bootsplash") @bs.scope("default")
external hide: config => unit = "hide"

@bs.module("react-native-bootsplash") @bs.scope("default")
external show: config => unit = "show"

// Note that this binding requires BuckleScript >= 8.2.0
type visibilityStatus = [#visible | #hidden | #transitioning]

@bs.module("react-native-bootsplash") @bs.scope("default")
external getVisibilityStatus: unit => Js.Promise.t<visibilityStatus> = "getVisibilityStatus"
/*
 ## Usage

 ```re
 ReactNativeBootSplash.hide({fade: true});
 ReactNativeBootSplash.show({fade: false});
 ```
 */
