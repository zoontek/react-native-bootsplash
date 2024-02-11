// Required until @expo/config-plugins is shipped with xcode module types
declare module "xcode" {
  export type XcodeProject = {
    writeSync: () => string;
  };
}
