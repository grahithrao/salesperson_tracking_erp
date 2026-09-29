import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { config } from '../config';
import { apiRequest } from './api';
import { enqueueOperation } from '../storage/db';

let trackingIntervalTimer: any = null;
let cachedCurrentLocation: { latitude: number; longitude: number } | null = null;
let isTrackingActive = false;

export async function requestLocationPermissions(): Promise<{ granted: boolean; status: string }> {
  try {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      return { granted: false, status: fgStatus };
    }

    // Background permission on native
    if (Platform.OS !== 'web') {
      try {
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        return { granted: true, status: bgStatus };
      } catch (e) {
        // Continue with foreground if background not permitted
        return { granted: true, status: fgStatus };
      }
    }

    return { granted: true, status: fgStatus };
  } catch (err: any) {
    console.error('Failed to request location permissions:', err);
    return { granted: false, status: 'error' };
  }
}

export async function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    cachedCurrentLocation = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
    return cachedCurrentLocation;
  } catch (err) {
    return cachedCurrentLocation;
  }
}

export function startDutyTracking(): void {
  if (isTrackingActive) return;
  isTrackingActive = true;

  // Poll location every trackingIntervalMs while ON DUTY
  const pingLocation = async () => {
    if (!isTrackingActive) return;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const pt = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy || 10,
        speed: loc.coords.speed !== null && loc.coords.speed >= 0 ? Math.round(loc.coords.speed * 3.6) : 0, // m/s to km/h
        heading: loc.coords.heading || null,
        batteryLevel: 85, // estimated
        timestamp: new Date().toISOString(),
      };

      cachedCurrentLocation = { latitude: pt.latitude, longitude: pt.longitude };

      // Attempt live upload, fallback to offline queue
      try {
        await apiRequest('/api/location/update', {
          method: 'POST',
          body: JSON.stringify({ points: [pt] }),
        });
      } catch (uploadErr) {
        // Enqueue GPS batch locally for later sync
        await enqueueOperation('GPS_BATCH', { points: [pt] });
      }
    } catch (e) {
      console.warn('GPS location ping skipped:', e);
    }
  };

  // Initial immediate ping
  pingLocation();
  trackingIntervalTimer = setInterval(pingLocation, config.trackingIntervalMs);
}

export function stopDutyTracking(): void {
  isTrackingActive = false;
  if (trackingIntervalTimer) {
    clearInterval(trackingIntervalTimer);
    trackingIntervalTimer = null;
  }
}

export function isLocationTracking(): boolean {
  return isTrackingActive;
}
