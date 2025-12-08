import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ThemeContextType = {
    colorScheme: 'light' | 'dark';
    toggleTheme: () => void;
    isThemeLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
    colorScheme: 'light',
    toggleTheme: () => { },
    isThemeLoaded: false,
});

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = '@theme_preference';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const deviceColorScheme = useDeviceColorScheme();
    const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
        deviceColorScheme === 'dark' ? 'dark' : 'light'
    );
    const [isThemeLoaded, setIsThemeLoaded] = useState(false);

    // Load saved theme preference
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme === 'light' || savedTheme === 'dark') {
                setColorScheme(savedTheme);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        } finally {
            setIsThemeLoaded(true);
        }
    };

    const toggleTheme = async () => {
        const newTheme = colorScheme === 'light' ? 'dark' : 'light';
        setColorScheme(newTheme);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ colorScheme, toggleTheme, isThemeLoaded }}>
            {children}
        </ThemeContext.Provider>
    );
};
