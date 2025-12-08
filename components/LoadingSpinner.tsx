import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface LoadingSpinnerProps {
    size?: 'small' | 'large';
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'large',
    fullScreen = false,
}) => {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    if (fullScreen) {
        return (
            <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
                <ActivityIndicator size={size} color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={colors.primary} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
