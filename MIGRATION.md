# Migration from v2

Even if a lot of changes landed, switching from v2 to v3 is actually quite easy 😎

## What's new

- A switch to react-native CLI (`npx react-native generate-bootsplash` instead of `npx generate-bootsplash` to generate assets, please follow the `README`)
- A complete rewriting in TS
- A Promise based API and UI thread pause handling (`hide` / `show` promises will be resolved only when the app has focus)
- A new `getVisibilityStatus()` method

## Code modifications

```diff
import React, { useEffect } from "react";
import { Text } from "react-native";
import RNBootSplash from "react-native-bootsplash";

function App() {
  useEffect(() => {
-   RNBootSplash.hide({ duration: 250 });

+   RNBootSplash.hide({ fade: true }).then(() => {
+     console.log("bootsplash hidden!");
+   });
  }, []);

  return <Text>My awesome app</Text>;
}
```

## Generated files

The generated `BootSplash.storyboard` has been modified.<br />
⚠️ We recommend re-run the generator it you use the default design (a centered logo).
