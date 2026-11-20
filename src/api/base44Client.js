import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { createDemoClient, isDemoMode } from '@/api/demoClient';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Public demo (/demo): an in-memory client with sample data, so the app can be explored
// without an account. Otherwise, the real Base44 client.
export const base44 = isDemoMode()
  ? createDemoClient()
  : createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl
    });
