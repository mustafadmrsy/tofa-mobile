import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WorkerDashboard from "../screens/Dashboard/WorkerDashboard";
import TaskDetail from "../screens/TaskDetail";

const Stack = createNativeStackNavigator();

export default function WorkerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="WorkerDashboard" component={WorkerDashboard} />
      <Stack.Screen name="TaskDetail" component={TaskDetail} />
    </Stack.Navigator>
  );
}
