import { NavigationContainer } from "@react-navigation/native";
import {
  NativeStackScreenProps,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  Button,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

type StackParamList = {
  First: undefined;
  Second: undefined;
};

const FirstScreen = ({
  navigation,
}: NativeStackScreenProps<StackParamList, "First">) => (
  <View style={styles.container}>
    <Button
      title="Go to second screen"
      onPress={() => {
        navigation.navigate("Second");
      }}
    />
  </View>
);

const SecondScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Hello, Dave.</Text>
  </View>
);

const Stack = createNativeStackNavigator<StackParamList>();

export const App = () => {
  const [bootSplashState, setBootSplashState] = useState<
    "visible" | "hiding" | "hidden"
  >("visible");

  useEffect(() => {
    // set transparent status bar
    StatusBar.setBarStyle("dark-content");

    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
    }
  }, []);

  return (
    <>
      <NavigationContainer
        onReady={() => {
          setBootSplashState("hiding");
        }}
      >
        <Stack.Navigator initialRouteName="First">
          <Stack.Screen name="First" component={FirstScreen} />
          <Stack.Screen name="Second" component={SecondScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {bootSplashState === "hiding" && (
        <AnimatedBootSplash
          onAnimationEnd={() => {
            setBootSplashState("hidden");
          }}
        />
      )}
    </>
  );
};
