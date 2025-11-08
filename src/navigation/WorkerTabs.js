import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ListTodo, User2 } from "lucide-react-native";
import WorkerStack from "./WorkerStack";
import Profile from "../screens/Profile";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

export default function WorkerTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { height: 60 + Math.max(insets.bottom, 8), paddingBottom: Math.max(insets.bottom, 8), backgroundColor: '#0b0d16', borderTopColor: '#1f2233' },
      }}
    >
      <Tab.Screen name="Görevler" component={WorkerStack} options={{ tabBarIcon: ({ color }) => <ListTodo color={color} size={22} /> }} />
      <Tab.Screen name="Profil" component={Profile} options={{ tabBarIcon: ({ color }) => <User2 color={color} size={22} /> }} />
    </Tab.Navigator>
  );
}
