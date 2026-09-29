import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';
import {
  getOutboxQueue,
  updateQueueItem,
  removeQueueItem,
  enqueueOperation,
  cacheClients,
  cacheProducts,
  getCachedClients,
  getCachedProducts,
} from '../storage/db';

export async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem('@erp_auth_token');
}

export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${config.apiBaseUrl}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `HTTP error ${res.status}`);
    }
    return json;
  } catch (err: any) {
    // If network error, propagate so caller knows we're offline
    throw err;
  }
}

// Durable Outbox Synchronizer (Section 28)
export async function syncOutbox(): Promise<{ syncedCount: number; failedCount: number }> {
  const token = await getAuthToken();
  if (!token) return { syncedCount: 0, failedCount: 0 };

  const queue = await getOutboxQueue();
  const pendingItems = queue.filter((item) => item.status === 'PENDING' || item.status === 'FAILED');

  if (pendingItems.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  // Mark items as SYNCING
  for (const item of pendingItems) {
    await updateQueueItem(item.id, { status: 'SYNCING' });
  }

  try {
    const batchPayload = {
      items: pendingItems.map((item) => ({
        localId: item.id,
        type: item.type,
        payload: item.payload,
        idempotencyKey: item.idempotencyKey,
      })),
    };

    const response = await apiRequest('/api/sync/batch', {
      method: 'POST',
      body: JSON.stringify(batchPayload),
    });

    let syncedCount = 0;
    let failedCount = 0;

    for (const result of response.results || []) {
      if (result.status === 'SYNCED') {
        await removeQueueItem(result.localId);
        syncedCount++;
      } else {
        const item = pendingItems.find((p) => p.id === result.localId);
        await updateQueueItem(result.localId, {
          status: 'FAILED',
          lastError: result.error,
          retryCount: (item?.retryCount || 0) + 1,
        });
        failedCount++;
      }
    }

    return { syncedCount, failedCount };
  } catch (err: any) {
    // Revert to PENDING with incremented retry count
    for (const item of pendingItems) {
      await updateQueueItem(item.id, {
        status: 'PENDING',
        lastError: err.message,
        retryCount: item.retryCount + 1,
      });
    }
    return { syncedCount: 0, failedCount: pendingItems.length };
  }
}
