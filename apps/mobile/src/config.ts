import { Platform } from 'react-native';

// For local physical device or emulator testing, replace localhost with LAN IP or configure env
const defaultHost = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || defaultHost,
  trackingIntervalMs: 60 * 1000, // 60 seconds default (Section 6.2)
  minTrackingDistanceMeters: 10,
  visitRadiusMeters: 100, // Section 8.1
};
