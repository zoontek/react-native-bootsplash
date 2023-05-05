type config = {fade: bool}

@module("react-native-bootsplash") @scope("default")
external hide: config => Js.Promise.t<unit> = "hide"

// Note that this binding requires BuckleScript >= 8.2.0
type visibilityStatus = [#visible | #hidden | #transitioning]

@module("react-native-bootsplash") @scope("default")
external getVisibilityStatus: unit => Js.Promise.t<visibilityStatus> = "getVisibilityStatus"
/*
## Usage

```rescript
 RNBootSplash.hide({fade: true})->ignore
```

Or

 ```rescript
RNBootSplash.hide({fade: true})->Js.Promise.then_(() => {
  Js.log("RN BootSplash: fading is over")
  Js.Promise.resolve()
}, _)->Js.Promise.catch(error => {
  Js.log(("RN BootSplash: cannot hide splash", error))
  Js.Promise.resolve()
}, _)->ignore
```
*/
