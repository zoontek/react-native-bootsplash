type config = {fade: bool}

@bs.module("react-native-bootsplash") @bs.scope("default")
external hide: config => Js.Promise.t<unit> = "hide"

@bs.module("react-native-bootsplash") @bs.scope("default")
external show: config => Js.Promise.t<unit> = "show"

// Note that this binding requires BuckleScript >= 8.2.0
type visibilityStatus = [#visible | #hidden | #transitioning]

@bs.module("react-native-bootsplash") @bs.scope("default")
external getVisibilityStatus: unit => Js.Promise.t<visibilityStatus> = "getVisibilityStatus"
/*
## Usage

```rescript
 ReactNativeBootsplash.hide({fade: true})->ignore
 ReactNativeBootSplash.show({fade: false})->ignore
```

Or

 ```rescript
ReactNativeBootsplash.hide({fade: true})->Js.Promise.then_(() => {
  Js.log("RN BootSplash: fading is over")
  Js.Promise.resolve()
}, _)->Js.Promise.catch(error => {
  Js.log(("RN BootSplash: cannot hide splash", error))
  Js.Promise.resolve()
}, _)->ignore
```
*/
