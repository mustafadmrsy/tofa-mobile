import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';

export default function AuthLayout() {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
        </Stack>
    );
}
