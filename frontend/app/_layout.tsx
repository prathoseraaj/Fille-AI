import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar"; 

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" hidden={true} />
      <Stack
        screenOptions={{
          headerShown: false, 
          statusBarHidden: true 
        }}
      />
    </>
  );
}