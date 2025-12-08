import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    message,
    actionLabel,
    onAction,
}) => {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.iconContainer,
                    { backgroundColor: colors.backgroundSecondary },
                ]}
            >
                <Ionicons name={icon} size={48} color={colors.textTertiary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
                {message}
            </Text>
            {actionLabel && onAction && (
                <Button
                    title={actionLabel}
                    onPress={onAction}
                    variant="primary"
                    size="md"
                    style={styles.button}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing['2xl'],
        paddingVertical: Spacing['3xl'],
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: Typography.fontSize.base,
        textAlign: 'center',
        lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
        marginBottom: Spacing.xl,
    },
    button: {
        minWidth: 150,
    },
});
