import { BorderRadius, Colors, ShadowsEnhanced, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
    children: ReactNode;
    style?: ViewStyle;
    noPadding?: boolean;
    noShadow?: boolean;
    glassmorphism?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    noPadding = false,
    noShadow = false,
    glassmorphism = false,
}) => {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const cardStyle: ViewStyle = {
        backgroundColor: glassmorphism
            ? colorScheme === 'dark'
                ? 'rgba(30, 41, 59, 0.7)' // Semi-transparent dark
                : 'rgba(255, 255, 255, 0.7)' // Semi-transparent light
            : colors.card,
        padding: noPadding ? 0 : Spacing.lg,
    };

    if (glassmorphism) {
        cardStyle.borderWidth = 1;
        cardStyle.borderColor = colorScheme === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)';
    }

    return (
        <View
            style={[
                styles.card,
                cardStyle,
                !noShadow && ShadowsEnhanced.md[colorScheme],
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
});
