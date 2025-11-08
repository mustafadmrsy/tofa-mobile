import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ShieldCheck, ListTodo, User2 } from "lucide-react-native";
import SuperAdminDashboard from "../screens/Dashboard/SuperAdminDashboard";
import TaskDetails from "../screens/TaskDetails";
import Profile from "../screens/Profile";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

export default function SuperAdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { height: 60 },
      }}
    >
      <Tab.Screen name="Adminler" component={SuperAdminDashboard} options={{ tabBarIcon: ({ color }) => <ShieldCheck color={color} size={22} /> }} />
      <Tab.Screen name="Tüm Görevler" component={TaskDetails} options={{ tabBarIcon: ({ color }) => <ListTodo color={color} size={22} /> }} />
      <Tab.Screen name="Profil" component={Profile} options={{ tabBarIcon: ({ color }) => <User2 color={color} size={22} /> }} />
    </Tab.Navigator>
  );
}
