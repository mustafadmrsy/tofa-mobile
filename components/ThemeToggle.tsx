import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';

export const ThemeToggle = () => {
    const { colorScheme, toggleTheme } = useTheme();
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={styles.iconContainer}>
                <Ionicons
                    name={colorScheme === 'dark' ? 'moon' : 'sunny'}
                    size={20}
                    color={colors.textSecondary}
                />
            </View>
            <Switch
                value={colorScheme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{
                    false: colors.border,
                    true: colors.primary
                }}
                thumbColor={colors.background}
                ios_backgroundColor={colors.border}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: 20,
        gap: Spacing.sm,
    },
    iconContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
