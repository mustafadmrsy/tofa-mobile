import { showToast } from '@/components/ToastProvider';
import { Input } from '@/components/ui/Input';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { createTeam, getAllTeams, getAllUsers, updateUserRole } from '@/services/firestoreService';
import { User, UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getHeaderGradient = (colorScheme: 'light' | 'dark'): readonly [string, string, string] => {
    if (colorScheme === 'dark') {
        return ['#1e3a5f', '#2d4a6f', '#1a2f4a'] as const;
    }
    return ['#0066CC', '#0052A3', '#003D7A'] as const;
};

interface CreateTeamModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateTeamModal({ visible, onClose, onSuccess }: CreateTeamModalProps) {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

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
            const allTeams = await getAllTeams();

            // Mevcut ekip yöneticilerinin ID'lerini topla
            const existingManagerIds = new Set(allTeams.map(team => team.managerId));

            // Filtreleme: 
            // 1. Süper admin olmayanlar
            // 2. Henüz hiçbir ekibin yöneticisi olmayanlar
            const eligibleUsers = allUsers.filter(user =>
                user.role !== UserRole.SUPER_ADMIN &&
                !existingManagerIds.has(user.id)
            );

            setAvailableManagers(eligibleUsers);
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
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
                    {/* Gradient Header */}
                    <LinearGradient
                        colors={getHeaderGradient(colorScheme)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalHeader}
                    >
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="people-circle" size={32} color="#FFFFFF" />
                            </View>
                            <Text style={styles.modalTitle}>Yeni Ekip Oluştur</Text>
                            <Text style={styles.modalSubtitle}>Ekibinizi organize edin</Text>
                        </View>
                    </LinearGradient>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {/* Team Name Input */}
                        <View style={styles.inputContainer}>
                            <View style={styles.inputLabel}>
                                <Ionicons name="people-outline" size={20} color={colors.primary} />
                                <Text style={[styles.label, { color: colors.text }]}>Ekip Adı</Text>
                            </View>
                            <Input
                                placeholder="Örn: Yazılım Ekibi"
                                value={teamName}
                                onChangeText={setTeamName}
                            />
                        </View>

                        {/* Manager Picker */}
                        <View style={styles.inputContainer}>
                            <View style={styles.inputLabel}>
                                <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                                <Text style={[styles.label, { color: colors.text }]}>Ekip Yöneticisi</Text>
                            </View>
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

                            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                                ℹ️ Sadece henüz ekip lideri olmayanlar ve normal kullanıcılar listelenmektedir.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.modalFooter, { backgroundColor: colors.background }]}>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={[styles.testButton, { borderColor: colors.primary, backgroundColor: 'transparent' }]}
                        >
                            <Text style={[styles.testButtonText, { color: colors.primary }]}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleCreate}
                            style={[styles.testButton, { backgroundColor: colors.primary }]}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>Yükleniyor...</Text>
                            ) : (
                                <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>Oluştur</Text>
                            )}
                        </TouchableOpacity>
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
        maxHeight: '90%',
    },
    modalHeader: {
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.lg,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
    },
    closeButton: {
        position: 'absolute',
        top: Spacing.md,
        left: Spacing.md,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: {
        alignItems: 'center',
    },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    modalTitle: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: '#FFFFFF',
        marginBottom: Spacing.xs,
    },
    modalSubtitle: {
        fontSize: Typography.fontSize.sm,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    modalBody: {
        padding: Spacing.lg,
        paddingTop: Spacing.md,
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    helpText: {
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing.sm,
        fontStyle: 'italic',
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
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
        borderTopWidth: 2,
        borderTopColor: 'rgba(0, 0, 0, 0.08)',
        borderBottomLeftRadius: BorderRadius.xl,
        borderBottomRightRadius: BorderRadius.xl,
    },
    footerButton: {
        flex: 1,
    },
    testButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    testButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
