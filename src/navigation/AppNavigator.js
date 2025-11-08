import React from "react";
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthNavigator from "./AuthNavigator";
import AdminTabs from "./AdminTabs";
import WorkerTabs from "./WorkerTabs";
import SuperAdminTabs from "./SuperAdminTabs";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, role, loading } = useAuth();

  if (loading) return <Loader />;

  const navTheme = {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      background: 'transparent',
      card: 'transparent',
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : role === "admin" ? (
          <Stack.Screen name="Admin" component={AdminTabs} />
        ) : role === "superadmin" ? (
          <Stack.Screen name="SuperAdmin" component={SuperAdminTabs} />
        ) : (
          <Stack.Screen name="Worker" component={WorkerTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
