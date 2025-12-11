import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Setup Turkish Locale if needed (basic)
LocaleConfig.locales['tr'] = {
    monthNames: [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ],
    monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
    today: "Bugün"
};
LocaleConfig.defaultLocale = 'tr';

interface DatePickerProps {
    value: Date;
    onChange: (event: any, date?: Date) => void;
    minimumDate?: Date;
}

export function DatePicker({ value, onChange, ...props }: DatePickerProps) {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [isFocused, setIsFocused] = useState(false);
    const [showWebCalendar, setShowWebCalendar] = useState(false);

    if (Platform.OS === 'web') {
        const dateString = value.toLocaleDateString('tr-TR'); // Display format
        const calendarDate = value.toISOString().split('T')[0]; // YYYY-MM-DD for Calendar

        return (
            <View style={{ marginBottom: 0 }}>
                <TouchableOpacity
                    onPress={() => setShowWebCalendar(true)}
                    activeOpacity={0.7}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                >
                    <View
                        style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.backgroundSecondary,
                                borderColor: showWebCalendar || isFocused ? colors.primary : colors.border,
                            }
                        ]}
                    >
                        <Ionicons
                            name="calendar-outline"
                            size={22}
                            color={showWebCalendar || isFocused ? colors.primary : colors.textTertiary}
                            style={{ marginRight: Spacing.sm }}
                        />
                        <Text style={[styles.textInput, { color: colors.text }]}>
                            {dateString}
                        </Text>
                    </View>
                </TouchableOpacity>

                <Modal
                    visible={showWebCalendar}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowWebCalendar(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowWebCalendar(false)}
                    >
                        {/* Stop propagation for inner click */}
                        <TouchableOpacity activeOpacity={1} style={{}}>
                            <View style={[styles.calendarWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Calendar
                                    current={calendarDate}
                                    onDayPress={(day: any) => {
                                        // Construct date from YYYY-MM-DD safely
                                        const [year, month, d] = day.dateString.split('-').map(Number);
                                        const newDate = new Date(year, month - 1, d);

                                        onChange({ type: 'set' }, newDate);
                                        setShowWebCalendar(false);
                                    }}
                                    theme={{
                                        backgroundColor: colors.card,
                                        calendarBackground: colors.card,
                                        textSectionTitleColor: colors.textSecondary,
                                        selectedDayBackgroundColor: colors.primary,
                                        selectedDayTextColor: '#ffffff',
                                        todayTextColor: colors.primary,
                                        dayTextColor: colors.text,
                                        textDisabledColor: colors.textTertiary,
                                        arrowColor: colors.primary,
                                        monthTextColor: colors.text,
                                        textDayFontWeight: '500',
                                        textMonthFontWeight: 'bold',
                                        textDayHeaderFontWeight: 'bold',
                                        textDayFontSize: 16,
                                        textMonthFontSize: 16,
                                        textDayHeaderFontSize: 14
                                    }}
                                    minDate={props.minimumDate?.toISOString().split('T')[0]}
                                />
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            </View>
        );
    }

    return (
        <DateTimePicker
            value={value}
            onChange={onChange}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        paddingHorizontal: Spacing.md,
        minHeight: 54,
    },
    textInput: {
        fontSize: Typography.fontSize.base, // Matches Input font
        fontFamily: 'System', // Consistent font
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarWrapper: {
        width: 320,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    }
});
