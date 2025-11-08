import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ShieldCheck, ListTodo, User2 } from "lucide-react-native";
import SuperAdminUsers from "../screens/SuperAdminUsers";
import SuperAdminTasks from "../screens/SuperAdminTasks";
import CreateTask from "../screens/CreateTask";
import SuperAdminTeams from "../screens/SuperAdminTeams";
import Profile from "../screens/Profile";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

export default function SuperAdminTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { height: 60 + Math.max(insets.bottom, 8), paddingBottom: Math.max(insets.bottom, 8), backgroundColor: '#0b0d16', borderTopColor: '#1f2233' },
      }}
    >
      <Tab.Screen name="Adminler" component={SuperAdminUsers} options={{ tabBarIcon: ({ color }) => <ShieldCheck color={color} size={22} /> }} />
      <Tab.Screen name="Ekipler" component={SuperAdminTeams} options={{ tabBarIcon: ({ color }) => <ShieldCheck color={color} size={22} /> }} />
      <Tab.Screen name="Görev Oluştur" component={CreateTask} options={{ tabBarIcon: ({ color }) => <ListTodo color={color} size={22} /> }} />
      <Tab.Screen name="Tüm Görevler" component={SuperAdminTasks} options={{ tabBarIcon: ({ color }) => <ListTodo color={color} size={22} /> }} />
      <Tab.Screen name="Profil" component={Profile} options={{ tabBarIcon: ({ color }) => <User2 color={color} size={22} /> }} />
    </Tab.Navigator>
  );
}
