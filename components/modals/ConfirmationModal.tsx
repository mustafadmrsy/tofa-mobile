import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
    icon?: string;
}

export function ConfirmationModal({
    visible,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    onConfirm,
    onCancel,
    type = 'warning',
    icon,
}: ConfirmationModalProps) {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const getTypeColor = () => {
        switch (type) {
            case 'danger':
                return '#F44336';
            case 'warning':
                return '#FF9800';
            case 'info':
                return colors.primary;
            default:
                return '#FF9800';
        }
    };

    const getDefaultIcon = () => {
        switch (type) {
            case 'danger':
                return 'trash-outline';
            case 'warning':
                return 'warning-outline';
            case 'info':
                return 'information-circle-outline';
            default:
                return 'help-circle-outline';
        }
    };

    const typeColor = getTypeColor();
    const iconName = icon || getDefaultIcon();

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: typeColor + '15' }]}>
                        <Ionicons name={iconName as any} size={48} color={typeColor} />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        {title}
                    </Text>

                    {/* Message */}
                    <Text style={[styles.message, { color: colors.textSecondary }]}>
                        {message}
                    </Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            onPress={onCancel}
                            style={[
                                styles.button,
                                styles.cancelButton,
                                { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }
                            ]}
                        >
                            <Text style={[styles.buttonText, { color: colors.text }]}>
                                {cancelText}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            style={[
                                styles.button,
                                styles.confirmButton,
                                { backgroundColor: typeColor }
                            ]}
                        >
                            <Text style={[styles.buttonText, styles.confirmButtonText]}>
                                {confirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: Typography.fontSize.base,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        borderWidth: 2,
    },
    confirmButton: {
        // backgroundColor set dynamically
    },
    buttonText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
    confirmButtonText: {
        color: '#FFFFFF',
    },
});
