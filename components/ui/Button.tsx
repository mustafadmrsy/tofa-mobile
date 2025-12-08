import { Animations, BorderRadius, Colors, ShadowsEnhanced, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    ViewStyle
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    onPress,
    style,
    ...props
}) => {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [scaleValue] = useState(new Animated.Value(1));

    const handlePressIn = () => {
        Animated.spring(scaleValue, {
            toValue: Animations.scale.press,
            useNativeDriver: true,
            friction: 3,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            friction: 3,
        }).start();
    };

    const handlePress = (event: any) => {
        // Stronger haptic feedback for premium feel
        if (variant === 'primary' || variant === 'danger') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(event);
    };

    const getButtonStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            borderRadius: BorderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            overflow: 'hidden',
        };

        // Size with better padding
        switch (size) {
            case 'sm':
                baseStyle.paddingVertical = Spacing.sm;
                baseStyle.paddingHorizontal = Spacing.lg;
                break;
            case 'lg':
                baseStyle.paddingVertical = Spacing.lg + 4;
                baseStyle.paddingHorizontal = Spacing.xl + 8;
                break;
            default:
                baseStyle.paddingVertical = Spacing.md + 2;
                baseStyle.paddingHorizontal = Spacing.xl;
        }

        // Variant with enhanced styling
        switch (variant) {
            case 'primary':
                baseStyle.backgroundColor = colors.primary;
                // Add shadow for primary buttons
                Object.assign(baseStyle, ShadowsEnhanced.md[colorScheme]);
                break;
            case 'danger':
                baseStyle.backgroundColor = colors.error;
                Object.assign(baseStyle, ShadowsEnhanced.md[colorScheme]);
                break;
            case 'secondary':
                baseStyle.backgroundColor = colors.backgroundSecondary;
                baseStyle.borderWidth = 1;
                baseStyle.borderColor = colors.border;
                break;
            case 'outline':
                baseStyle.backgroundColor = 'transparent';
                baseStyle.borderWidth = 2;
                baseStyle.borderColor = colors.primary;
                break;
            case 'ghost':
                baseStyle.backgroundColor = colors.primary + '15';
                break;
        }

        if (disabled || loading) {
            baseStyle.opacity = 0.5;
        }

        if (fullWidth) {
            baseStyle.width = '100%';
        }

        return baseStyle;
    };

    const getTextStyle = (): TextStyle => {
        const baseStyle: TextStyle = {
            fontWeight: Typography.fontWeight.bold,
        };

        // Size
        switch (size) {
            case 'sm':
                baseStyle.fontSize = Typography.fontSize.sm;
                break;
            case 'lg':
                baseStyle.fontSize = Typography.fontSize.lg;
                break;
            default:
                baseStyle.fontSize = Typography.fontSize.base;
        }

        // Variant
        switch (variant) {
            case 'primary':
            case 'danger':
                baseStyle.color = '#FFFFFF';
                break;
            case 'secondary':
                baseStyle.color = colors.text;
                break;
            case 'outline':
            case 'ghost':
                baseStyle.color = colors.primary;
                break;
        }

        return baseStyle;
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <TouchableOpacity
                style={[getButtonStyle(), style]}
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.85}
                {...props}
            >
                {loading ? (
                    <ActivityIndicator
                        size="small"
                        color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary}
                    />
                ) : (
                    <Text style={getTextStyle()}>{title}</Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};
