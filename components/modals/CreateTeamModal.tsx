import { showToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { createTeam, getAllUsers, updateUserRole } from '@/services/firestoreService';
import { User, UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CreateTeamModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateTeamModal({ visible, onClose, onSuccess }: CreateTeamModalProps) {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const [teamName, setTeamName] = useState('');
    const [selectedManager, setSelectedManager] = useState<User | null>(null);
    const [availableManagers, setAvailableManagers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [showManagerPicker, setShowManagerPicker] = useState(false);

    useEffect(() => {
        if (visible) {
            loadAvailableManagers();
        }
    }, [visible]);

    const loadAvailableManagers = async () => {
        try {
            const allUsers = await getAllUsers();
            // Tüm kullanıcılar ekip yöneticisi olabilir
            setAvailableManagers(allUsers);
        } catch (error) {
            console.error('Load managers error:', error);
        }
    };

    const handleCreate = async () => {
        if (!teamName.trim()) {
            showToast.error('Hata', 'Lütfen ekip adını girin');
            return;
        }

        if (!selectedManager) {
            showToast.error('Hata', 'Lütfen bir yönetici seçin');
            return;
        }

        setLoading(true);
        try {
            // Önce kullanıcının rolünü team_manager yap
            await updateUserRole(selectedManager.id, UserRole.TEAM_MANAGER);

            // Sonra ekibi oluştur
            await createTeam(teamName.trim(), selectedManager.id);

            showToast.success('Başarılı', 'Ekip başarıyla oluşturuldu');
            resetForm();
            onSuccess();
            onClose();
        } catch (error: any) {
            showToast.error('Hata', error.message || 'Ekip oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTeamName('');
        setSelectedManager(null);
        setShowManagerPicker(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            Yeni Ekip Oluştur
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Team Name Input */}
                        <Input
                            label="Ekip Adı"
                            placeholder="Örn: Yazılım Ekibi"
                            value={teamName}
                            onChangeText={setTeamName}
                        />

                        {/* Manager Picker */}
                        <View style={styles.pickerContainer}>
                            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
                                Ekip Yöneticisi
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.pickerButton,
                                    { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                                ]}
                                onPress={() => setShowManagerPicker(!showManagerPicker)}
                            >
                                <Text style={[styles.pickerButtonText, { color: selectedManager ? colors.text : colors.textSecondary }]}>
                                    {selectedManager?.name || 'Yönetici seçin'}
                                </Text>
                                <Ionicons
                                    name={showManagerPicker ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>

                            {showManagerPicker && (
                                <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <ScrollView style={styles.pickerScroll}>
                                        {availableManagers.map((manager) => (
                                            <TouchableOpacity
                                                key={manager.id}
                                                style={[
                                                    styles.pickerItem,
                                                    selectedManager?.id === manager.id && { backgroundColor: colors.primaryLight + '20' },
                                                ]}
                                                onPress={() => {
                                                    setSelectedManager(manager);
                                                    setShowManagerPicker(false);
                                                }}
                                            >
                                                <Text style={[styles.pickerItemName, { color: colors.text }]}>
                                                    {manager.name}
                                                </Text>
                                                <Text style={[styles.pickerItemEmail, { color: colors.textSecondary }]}>
                                                    {manager.email}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.modalFooter}>
                        <Button
                            title="İptal"
                            onPress={handleClose}
                            variant="outline"
                            style={styles.footerButton}
                        />
                        <Button
                            title="Oluştur"
                            onPress={handleCreate}
                            loading={loading}
                            style={styles.footerButton}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    modalBody: {
        padding: Spacing.lg,
    },
    pickerContainer: {
        marginTop: Spacing.md,
    },
    pickerLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: Spacing.xs,
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    pickerButtonText: {
        fontSize: Typography.fontSize.base,
    },
    pickerDropdown: {
        marginTop: Spacing.xs,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        maxHeight: 200,
    },
    pickerScroll: {
        maxHeight: 200,
    },
    pickerItem: {
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    pickerItemName: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: 2,
    },
    pickerItemEmail: {
        fontSize: Typography.fontSize.sm,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    footerButton: {
        flex: 1,
    },
});
