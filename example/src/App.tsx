import { useState } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { AnimatedBootSplash } from "./AnimatedBootSplash";

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
  const [visible, setVisible] = useState(true);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <View style={styles.container}>
        <Text style={styles.text}>Hello, Dave.</Text>

        {visible && (
          <AnimatedBootSplash
            onAnimationEnd={() => {
              setVisible(false);
            }}
          />
        )}
      </View>
    </>
  );
};
