import type { ToolCatalogItem } from './tool-catalog';

/**
 * Push senders of the ops console catalog, in their own file so the frozen
 * `tool-catalog.ts` does not grow. Spread into `TOOL_CATALOG` in this order.
 */
export const PUSH_TOOLS: readonly ToolCatalogItem[] = [
  // src/modules/messaging/services/web-push.service.ts (readVapid: las 3 variables)
  {
    code: 'web_push',
    name: 'Web Push (VAPID)',
    kind: 'MAIL',
    provider: 'Servicios push de los navegadores (lib web-push)',
    purpose: 'Notificaciones push al navegador.',
    isCritical: false,
    status: 'ACTIVE',
    requiredEnvVars: ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'],
    checkType: 'CONFIGURATION',
    ownerTeam: 'plataforma',
    failureImpact:
      'No se envían notificaciones push; los demás canales siguen.',
    fallback: 'El servicio queda inactivo sin las claves.',
  },
  // src/modules/messaging/services/native-push.fcm.ts (readFcmSender)
  {
    code: 'native_push',
    name: 'Push nativo (FCM)',
    kind: 'MAIL',
    provider: 'Firebase Cloud Messaging HTTP v1 (iOS vía APNs)',
    purpose: 'Notificaciones push a la app móvil (Android e iOS).',
    isCritical: false,
    status: 'ACTIVE',
    requiredEnvVars: ['FCM_PROJECT_ID', 'FCM_SERVICE_ACCOUNT_JSON'],
    checkType: 'CONFIGURATION',
    ownerTeam: 'plataforma',
    failureImpact:
      'La app móvil no recibe push; la campana y el push web siguen.',
    fallback: 'El envío queda inactivo (no-op) sin las credenciales.',
  },
];
