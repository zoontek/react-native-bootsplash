import type { HostComponent, ViewProps } from "react-native";
import type { DirectEventHandler } from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

export interface NativeProps extends ViewProps {
  onDrawn?: DirectEventHandler<null>;
}

export default codegenNativeComponent<NativeProps>(
  "RNBootSplashDrawMarker",
) as HostComponent<NativeProps>;
