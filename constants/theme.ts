/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

/**
 * Professional Corporate Theme
 * Beyaz tonlarında profesyonel, göz yormayan tema sistemi
 * Light ve Dark mode desteği
 */

const tintColorLight = '#0066CC';
const tintColorDark = '#66B2FF';

export const Colors = {
  light: {
    // Ana renkler - Profesyonel mavi tonları
    primary: '#0066CC',
    primaryLight: '#4D94E6',
    primaryDark: '#004C99',

    // Arkaplan renkleri - Beyaz tonları
    background: '#FFFFFF',
    backgroundSecondary: '#F5F7FA',
    backgroundTertiary: '#EDF1F7',

    // Metin renkleri
    text: '#1A2332',
    textSecondary: '#4A5568',
    textTertiary: '#718096',
    textDisabled: '#A0AEC0',

    // Sınır ve ayırıcı
    border: '#E2E8F0',
    borderLight: '#EDF2F7',
    divider: '#F7FAFC',

    // Durum renkleri
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Özel UI renkleri
    card: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.04)',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Tab ve navigation
    tint: tintColorLight,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,

    // Görev durum renkleri
    taskTodo: '#94A3B8',
    taskInProgress: '#3B82F6',
    taskCompleted: '#10B981',
    taskOverdue: '#EF4444',
  },
  dark: {
    // Ana renkler - Yumuşak mavi tonları
    primary: '#66B2FF',
    primaryLight: '#99CCFF',
    primaryDark: '#3399FF',

    // Arkaplan renkleri - Koyu profesyonel tonlar
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    backgroundTertiary: '#334155',

    // Metin renkleri
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    textDisabled: '#64748B',

    // Sınır ve ayırıcı
    border: '#334155',
    borderLight: '#475569',
    divider: '#1E293B',

    // Durum renkleri - Dark mode için uyarlanmış
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',

    // Özel UI renkleri
    card: '#1E293B',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Tab ve navigation
    tint: tintColorDark,
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,

    // Görev durum renkleri
    taskTodo: '#94A3B8',
    taskInProgress: '#60A5FA',
    taskCompleted: '#34D399',
    taskOverdue: '#F87171',
  },
};

// Typography - Profesyonel font boyutları
export const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing - Tutarlı spacing sistemi
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

// Border Radius - Yumuşak köşeler
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Shadows - Subtle gölgeler
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Premium Gradients - Modern and vibrant
export const Gradients = {
  light: {
    primary: ['#0066CC', '#0052A3', '#003D7A'],
    primaryVibrant: ['#0066CC', '#5B4EFF', '#8B5CF6'],
    success: ['#10B981', '#059669', '#047857'],
    warning: ['#F59E0B', '#D97706', '#B45309'],
    error: ['#EF4444', '#DC2626', '#B91C1C'],
    info: ['#3B82F6', '#2563EB', '#1D4ED8'],
    background: ['#FFFFFF', '#F9FAFB', '#F3F4F6'],
    card: ['#FFFFFF', '#FAFBFC', '#F5F7FA'],
  },
  dark: {
    primary: ['#66B2FF', '#4D9EFF', '#3399FF'],
    primaryVibrant: ['#66B2FF', '#805AD5', '#9F7AEA'],
    success: ['#34D399', '#10B981', '#059669'],
    warning: ['#FBBF24', '#F59E0B', '#D97706'],
    error: ['#F87171', '#EF4444', '#DC2626'],
    info: ['#60A5FA', '#3B82F6', '#2563EB'],
    background: ['#0F172A', '#1E293B', '#334155'],
    card: ['#1E293B', '#334155', '#475569'],
  },
};

// Glassmorphism - Premium blur effects
export const Glassmorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backgroundStrong: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(255, 255, 255, 0.3)',
    blur: 10,
    blurStrong: 20,
  },
  dark: {
    background: 'rgba(30, 41, 59, 0.7)',
    backgroundStrong: 'rgba(30, 41, 59, 0.85)',
    border: 'rgba(255, 255, 255, 0.1)',
    blur: 10,
    blurStrong: 20,
  },
};

// Animation Configurations
export const Animations = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    spring: 'spring',
  },
  scale: {
    press: 0.96,
    hover: 1.02,
  },
};

// Enhanced Shadows with premium depth
export const ShadowsEnhanced = {
  sm: {
    light: {
      shadowColor: '#0066CC',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
  },
  md: {
    light: {
      shadowColor: '#0066CC',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 3,
    },
  },
  lg: {
    light: {
      shadowColor: '#0066CC',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 6,
    },
  },
  xl: {
    light: {
      shadowColor: '#0066CC',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 10,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
      elevation: 10,
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
