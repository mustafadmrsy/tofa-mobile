import { Colors, Shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface FloatingActionButtonProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    size?: number;
    style?: ViewStyle;
}

export function FloatingActionButton({
    onPress,
    icon = 'add',
    size = 56,
    style,
}: FloatingActionButtonProps) {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <TouchableOpacity
            style={[
                styles.fab,
                {
                    backgroundColor: colors.primary,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                },
                Shadows.lg,
                style,
            ]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <Ionicons name={icon} size={size * 0.5} color="#FFFFFF" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
});
