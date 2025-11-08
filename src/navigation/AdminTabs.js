import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { House, PlusCircle, Users, User2 } from "lucide-react-native";
import AdminDashboard from "../screens/Dashboard/AdminDashboard";
import CreateTask from "../screens/CreateTask";
import TeamManagement from "../screens/TeamManagement";
import Profile from "../screens/Profile";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TaskDetail from "../screens/TaskDetail";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="TaskDetail" component={TaskDetail} />
    </Stack.Navigator>
  );
}

export default function AdminTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { height: 60 + Math.max(insets.bottom, 8), paddingBottom: Math.max(insets.bottom, 8), backgroundColor: '#0b0d16', borderTopColor: '#1f2233' },
      }}
    >
      <Tab.Screen name="Görevlerim" component={AdminHomeStack} options={{ tabBarIcon: ({ color }) => <House color={color} size={22} /> }} />
      <Tab.Screen name="Görev Oluştur" component={CreateTask} options={{ tabBarIcon: ({ color }) => <PlusCircle color={color} size={22} /> }} />
      <Tab.Screen name="Ekibim" component={TeamManagement} options={{ tabBarIcon: ({ color }) => <Users color={color} size={22} /> }} />
      <Tab.Screen name="Profil" component={Profile} options={{ tabBarIcon: ({ color }) => <User2 color={color} size={22} /> }} />
    </Tab.Navigator>
  );
}
