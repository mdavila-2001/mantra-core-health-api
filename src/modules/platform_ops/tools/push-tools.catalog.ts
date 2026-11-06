import type { ToolCatalogEntry } from './tool-catalog';

/**
 * Push senders of the platform tool registry, in their own file so the frozen
 * `tool-catalog.ts` does not grow. Spread into `TOOL_CATALOG` in this order.
 */
export const PUSH_TOOLS: readonly ToolCatalogEntry[] = [
  {
    code: 'web-push',
    name: 'Web Push (VAPID)',
    kind: 'MESSAGING',
    status: 'ACTIVE',
    isCritical: false,
    purpose: 'Notificaciones push del navegador.',
    requiredEnvVars: ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'],
    check: 'CONFIGURATION',
    source:
      '.env.example:643-645; src/modules/messaging/services/web-push.service.ts:248',
  },
  {
    code: 'native-push',
    name: 'Push nativo (FCM)',
    kind: 'MESSAGING',
    status: 'ACTIVE',
    isCritical: false,
    vendor: 'Firebase Cloud Messaging',
    purpose: 'Notificaciones push de la app móvil (Android e iOS vía APNs).',
    requiredEnvVars: ['FCM_PROJECT_ID', 'FCM_SERVICE_ACCOUNT_JSON'],
    check: 'CONFIGURATION',
    source: 'src/modules/messaging/services/native-push.fcm.ts (readFcmSender)',
  },
];
