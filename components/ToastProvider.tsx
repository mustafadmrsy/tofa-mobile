import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

/**
 * Premium Toast Provider with glassmorphism and smooth animations
 * Replaces Alert.alert with elegant toast notifications
 */

const toastConfig = {
    success: (props: any) => (
        <BaseToast
            {...props}
            style={[
                styles.baseToast,
                {
                    backgroundColor: 'rgba(16, 185, 129, 0.95)',
                    borderLeftColor: '#10B981',
                }
            ]}
            contentContainerStyle={styles.contentContainer}
            text1Style={styles.text1}
            text2Style={styles.text2}
            renderLeadingIcon={() => (
                <Ionicons
                    name="checkmark-circle"
                    size={28}
                    color="#FFFFFF"
                    style={styles.icon}
                />
            )}
        />
    ),
    error: (props: any) => (
        <ErrorToast
            {...props}
            style={[
                styles.baseToast,
                {
                    backgroundColor: 'rgba(239, 68, 68, 0.95)',
                    borderLeftColor: '#EF4444',
                }
            ]}
            contentContainerStyle={styles.contentContainer}
            text1Style={styles.text1}
            text2Style={styles.text2}
            renderLeadingIcon={() => (
                <Ionicons
                    name="alert-circle"
                    size={28}
                    color="#FFFFFF"
                    style={styles.icon}
                />
            )}
        />
    ),
    info: (props: any) => (
        <BaseToast
            {...props}
            style={[
                styles.baseToast,
                {
                    backgroundColor: 'rgba(59, 130, 246, 0.95)',
                    borderLeftColor: '#3B82F6',
                }
            ]}
            contentContainerStyle={styles.contentContainer}
            text1Style={styles.text1}
            text2Style={styles.text2}
            renderLeadingIcon={() => (
                <Ionicons
                    name="information-circle"
                    size={28}
                    color="#FFFFFF"
                    style={styles.icon}
                />
            )}
        />
    ),
    warning: (props: any) => (
        <BaseToast
            {...props}
            style={[
                styles.baseToast,
                {
                    backgroundColor: 'rgba(245, 158, 11, 0.95)',
                    borderLeftColor: '#F59E0B',
                }
            ]}
            contentContainerStyle={styles.contentContainer}
            text1Style={styles.text1}
            text2Style={styles.text2}
            renderLeadingIcon={() => (
                <Ionicons
                    name="warning"
                    size={28}
                    color="#FFFFFF"
                    style={styles.icon}
                />
            )}
        />
    ),
};

export function ToastProvider() {
    return (
        <Toast
            config={toastConfig}
            position="top"
            topOffset={60}
            visibilityTime={3000}
            autoHide
        />
    );
}

const styles = StyleSheet.create({
    baseToast: {
        borderLeftWidth: 5,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        minHeight: 80,
        width: '92%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    contentContainer: {
        paddingHorizontal: Spacing.md,
        paddingLeft: Spacing.xs,
        backgroundColor: 'transparent',
    },
    text1: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: 4,
        color: '#FFFFFF',
    },
    text2: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        color: '#F5F5F5',
        lineHeight: Typography.lineHeight.normal * Typography.fontSize.base,
    },
    icon: {
        marginLeft: Spacing.sm,
        marginRight: Spacing.xs,
        alignSelf: 'center',
    },
});

/**
 * Helper function to show toast notifications
 */
export const showToast = {
    success: (title: string, message?: string) => {
        Toast.show({
            type: 'success',
            text1: title,
            text2: message,
        });
    },
    error: (title: string, message?: string) => {
        Toast.show({
            type: 'error',
            text1: title,
            text2: message,
        });
    },
    info: (title: string, message?: string) => {
        Toast.show({
            type: 'info',
            text1: title,
            text2: message,
        });
    },
    warning: (title: string, message?: string) => {
        Toast.show({
            type: 'warning',
            text1: title,
            text2: message,
        });
    },
};
