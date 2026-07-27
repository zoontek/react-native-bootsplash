import { useEffect } from "react";
import { Platform, StatusBar, StyleSheet, Text, View } from "react-native";
import BootSplash from "react-native-bootsplash";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  text: {
    fontSize: 24,
    fontWeight: "700",
    margin: 20,
    lineHeight: 30,
    color: "#333",
    textAlign: "center",
  },
});

export const App = () => {
  useEffect(() => {
    // set transparent status bar
    StatusBar.setBarStyle("dark-content");

    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello, Dave.</Text>

      <BootSplash.HideOnDraw fade />
    </View>
  );
};
