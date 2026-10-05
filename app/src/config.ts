import { Platform } from 'react-native';

// Strip trailing slashes to prevent malformed endpoint paths
const sanitizeUrl = (url?: string): string => {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '');
};

const rawEnvUrl = process.env.EXPO_PUBLIC_API_URL;
const defaultHost = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
const resolvedApiUrl = sanitizeUrl(rawEnvUrl) || defaultHost;

// In web production builds, alert if client bundle references localhost on a public domain
if (
  typeof window !== 'undefined' &&
  window.location &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
) {
  if (
    resolvedApiUrl.includes('localhost') ||
    resolvedApiUrl.includes('127.0.0.1') ||
    resolvedApiUrl.includes('10.0.2.2')
  ) {
    console.warn(
      `[APP CONFIG WARNING] Running on remote origin (${window.location.origin}), but EXPO_PUBLIC_API_URL points to "${resolvedApiUrl}". Set EXPO_PUBLIC_API_URL in your production hosting settings.`
    );
  }
}

export const config = {
  apiBaseUrl: resolvedApiUrl,
  defaultTimezone: process.env.EXPO_PUBLIC_DEFAULT_TIMEZONE || 'Asia/Kolkata',
  trackingIntervalMs: 60 * 1000, // 60 seconds default (Section 6.2)
  minTrackingDistanceMeters: 10,
  visitRadiusMeters: 100, // Section 8.1
};

