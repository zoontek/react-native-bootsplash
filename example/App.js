import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import BootSplash from "react-native-bootsplash";

let reactLogo = require("./assets/react_logo.png");
let windowHeight = Dimensions.get("window").height;

let fakeApiCallWithoutBadNetwork = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

let App = () => {
  let [bootSplashIsVisible, setBootSplashIsVisible] = useState(true);
  let [reactLogoIsLoaded, setReactLogoIsLoaded] = useState(false);
  let opacity = useRef(new Animated.Value(1));
  let translateY = useRef(new Animated.Value(0));

  let init = async () => {
    BootSplash.hide();

    // You can uncomment this line to add a delay on app startup
    // let data = await fakeApiCallWithoutBadNetwork(3000);

    let useNativeDriver = true;

    Animated.stagger(250, [
      Animated.spring(translateY.current, { useNativeDriver, toValue: -50 }),
      Animated.spring(translateY.current, {
        useNativeDriver,
        toValue: windowHeight,
      }),
    ]).start();

    Animated.timing(opacity.current, {
      useNativeDriver,
      toValue: 0,
      duration: 150,
      delay: 350,
    }).start(() => {
      setBootSplashIsVisible(false);
    });
  };

  useEffect(() => {
    reactLogoIsLoaded && init();
  }, [reactLogoIsLoaded]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>react-native-bootsplash</Text>

      {bootSplashIsVisible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.bootsplash,
            { opacity: opacity.current },
          ]}
        >
          <Animated.Image
            source={reactLogo}
            fadeDuration={0}
            onLoadEnd={() => setReactLogoIsLoaded(true)}
            style={[
              styles.logo,
              { transform: [{ translateY: translateY.current }] },
            ]}
          />
        </Animated.View>
      )}
    </View>
  );
};

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
  bootsplash: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  logo: {
    height: 100,
    width: 100,
  },
});

export default App;
