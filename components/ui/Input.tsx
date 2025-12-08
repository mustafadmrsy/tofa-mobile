import { Animations, BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    secureTextEntry,
    style,
    ...props
}) => {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    // Animation values
    const borderAnimation = useRef(new Animated.Value(0)).current;
    const labelAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate border and label on focus
        Animated.parallel([
            Animated.timing(borderAnimation, {
                toValue: isFocused ? 1 : 0,
                duration: Animations.duration.fast,
                useNativeDriver: false,
            }),
            Animated.spring(labelAnimation, {
                toValue: isFocused ? 1 : 0,
                useNativeDriver: true,
                friction: 4,
            }),
        ]).start();
    }, [isFocused]);

    const toggleSecure = () => {
        setIsSecure(!isSecure);
    };

    const borderColor = borderAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [error ? colors.error : colors.border, error ? colors.error : colors.primary],
    });

    const labelScale = labelAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05],
    });

    return (
        <View style={styles.container}>
            {label && (
                <Animated.View style={{ transform: [{ scale: labelScale }] }}>
                    <Text
                        style={[
                            styles.label,
                            {
                                color: error ? colors.error : isFocused ? colors.primary : colors.text
                            }
                        ]}
                    >
                        {label}
                    </Text>
                </Animated.View>
            )}
            <Animated.View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: borderColor,
                    },
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={22}
                        color={isFocused ? colors.primary : colors.textTertiary}
                        style={styles.leftIcon}
                    />
                )}
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: colors.text,
                            flex: 1,
                        },
                        style,
                    ]}
                    placeholderTextColor={colors.textTertiary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isSecure}
                    {...props}
                />
                {secureTextEntry && (
                    <TouchableOpacity onPress={toggleSecure} style={styles.rightIcon} activeOpacity={0.6}>
                        <Ionicons
                            name={isSecure ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color={colors.textTertiary}
                        />
                    </TouchableOpacity>
                )}
                {!secureTextEntry && rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon} activeOpacity={0.6}>
                        <Ionicons name={rightIcon} size={22} color={colors.textTertiary} />
                    </TouchableOpacity>
                )}
            </Animated.View>
            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color={colors.error} />
                    <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        paddingHorizontal: Spacing.md,
        minHeight: 54,
    },
    input: {
        fontSize: Typography.fontSize.base,
        paddingVertical: Spacing.md,
        fontWeight: Typography.fontWeight.medium,
    },
    leftIcon: {
        marginRight: Spacing.sm,
    },
    rightIcon: {
        marginLeft: Spacing.sm,
        padding: Spacing.xs,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    error: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
});
