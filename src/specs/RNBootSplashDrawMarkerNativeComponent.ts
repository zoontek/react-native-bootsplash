import type { HostComponent, ViewProps } from "react-native";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";
import type {
  DirectEventHandler,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";

export interface NativeProps extends ViewProps {
  autoHide?: WithDefault<boolean, true>;
  fade?: WithDefault<boolean, false>;
  onDrawn?: DirectEventHandler<null>;
}

export default codegenNativeComponent<NativeProps>(
  "RNBootSplashDrawMarker",
) as HostComponent<NativeProps>;
