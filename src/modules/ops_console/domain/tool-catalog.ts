/**
 * Catálogo cerrado de herramientas e integraciones de la API, al estilo del
 * `ToolItem` de Atlas Admin Portal.
 *
 * Es un catálogo **en código**, no en base: cada entrada sale de un archivo
 * real de este repositorio (el comentario de cada una dice cuál) y sólo
 * nombra variables de entorno; nunca sus valores. La parte dinámica (con qué
 * adaptador se atiende hoy, qué falta, si responde) la calcula
 * `OpsToolsService` leyendo la configuración del proceso.
 */

/** Familia de la herramienta. `PAYMENTS` e `INTEGRATION` amplían la lista de Atlas. */
export const TOOL_KINDS = [
  'DATABASE',
  'CACHE',
  'SEARCH',
  'OBJECT_STORAGE',
  'MAIL',
  'IDENTITY',
  'AI',
  'FISCAL',
  'ANALYTICS',
  'MAPS',
  'OBSERVABILITY',
  'SECURITY',
  'EMULATOR',
  'PAYMENTS',
  'INTEGRATION',
] as const;
export type ToolKind = (typeof TOOL_KINDS)[number];

/** Estado de catálogo (mismos códigos que `system_tool_catalog.status` de Atlas). */
export const TOOL_STATUSES = [
  'ACTIVE',
  'PLANNED',
  'DEPRECATED',
  'DISABLED',
] as const;
export type ToolStatus = (typeof TOOL_STATUSES)[number];

/**
 * Cómo se comprueba la herramienta.
 * - `LIVE`: sonda en proceso (las de `GET /readiness`).
 * - `CONFIGURATION`: sólo se mira la configuración; nunca es «caída».
 * - `NOT_APPLICABLE`: no hay nada que comprobar (sin proveedor productivo).
 */
export const TOOL_CHECK_TYPES = [
  'LIVE',
  'CONFIGURATION',
  'NOT_APPLICABLE',
] as const;
export type ToolCheckType = (typeof TOOL_CHECK_TYPES)[number];

/** Códigos estables del catálogo; el front filtra y enlaza por ellos. */
export const TOOL_CODES = [
  'postgresql',
  'mongodb',
  'redis',
  'opensearch',
  'object_storage',
  'clamav',
  'gmail',
  'web_push',
  'mock_provider_server',
  'identity_verification',
  'embeddings',
  'cross_store_deletion',
  'elevenlabs',
  'ga4',
  'siat',
  'payments_gateway',
  'pharmacy_erp',
  'reverse_geocoding',
  'otel',
] as const;
export type ToolCode = (typeof TOOL_CODES)[number];

export interface ToolCatalogItem {
  code: ToolCode;
  name: string;
  kind: ToolKind;
  provider: string;
  purpose: string;
  isCritical: boolean;
  status: ToolStatus;
  /**
   * Sólo NOMBRES de variables sin valor por defecto que necesita el adaptador
   * real; nunca valores. Un interruptor (`*_ENABLED`, `*_MODE`) no va acá: su
   * efecto se lee en `binding`.
   */
  requiredEnvVars: readonly string[];
  checkType: ToolCheckType;
  ownerTeam?: string;
  failureImpact: string;
  fallback: string;
}

/**
 * Lista cerrada. Cada entrada cita el archivo del que sale (env schema o
 * cliente); una herramienta que no esté cableada en el código no está acá.
 */
export const TOOL_CATALOG: readonly ToolCatalogItem[] = [
  // src/orm/config/orm.env.ts (DB_* obligatorias) · sonda `postgresql` de src/app-readiness.service.ts
  {
    code: 'postgresql',
    name: 'PostgreSQL',
    kind: 'DATABASE',
    provider: 'PostgreSQL (TimescaleDB, pgvector)',
    purpose:
      'Base relacional principal: todos los módulos de dominio y RLS por tenant.',
    isCritical: true,
    status: 'ACTIVE',
    requiredEnvVars: [
      'DB_HOST',
      'DB_PORT',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
    ],
    checkType: 'LIVE',
    ownerTeam: 'plataforma',
    failureImpact: 'La API no atiende ninguna operación de negocio.',
    fallback: 'Ninguno: el proceso depende de la base.',
  },
  // src/modules/document_store/repositories/mongo-connection.provider.ts · sonda `mongodb`
  {
    code: 'mongodb',
    name: 'MongoDB',
    kind: 'DATABASE',
    provider: 'MongoDB',
    purpose: 'Almacén de documentos (document_store).',
    isCritical: true,
    status: 'ACTIVE',
    requiredEnvVars: ['MONGODB_URI'],
    checkType: 'LIVE',
    ownerTeam: 'plataforma',
    failureImpact:
      'Las operaciones sobre documentos fallan; la readiness de la API queda degradada.',
    fallback: 'Ninguno.',
  },
  // src/modules/redis_runtime/redis.provider.ts (REDIS_HOST/REDIS_PORT con valor por defecto) · sonda `redis`
  {
    code: 'redis',
    name: 'Redis',
    kind: 'CACHE',
    provider: 'Redis',
    purpose: 'Runtime de caché, rate limiting y colas ligeras.',
    isCritical: true,
    status: 'ACTIVE',
    requiredEnvVars: [],
    checkType: 'LIVE',
    ownerTeam: 'plataforma',
    failureImpact:
      'Limitación de tasa y caché fuera de servicio; la readiness queda degradada.',
    fallback: 'Ninguno.',
  },
  // src/modules/search_platform/providers/opensearch-client.provider.ts (OPENSEARCH_NODE con valor por defecto) · sonda `opensearch`
  {
    code: 'opensearch',
    name: 'OpenSearch',
    kind: 'SEARCH',
    provider: 'OpenSearch',
    purpose: 'Índices de búsqueda de la plataforma (search_platform).',
    isCritical: true,
    status: 'ACTIVE',
    requiredEnvVars: [],
    checkType: 'LIVE',
    ownerTeam: 'plataforma',
    failureImpact:
      'Las búsquedas y la indexación fallan; la readiness queda degradada.',
    fallback: 'Ninguno.',
  },
  // src/common/storage/storage.env.ts y file-storage.module.ts (FILE_STORAGE_ADAPTER: local | s3)
  {
    code: 'object_storage',
    name: 'Almacenamiento de archivos',
    kind: 'OBJECT_STORAGE',
    provider: 'Disco local o S3 compatible (MinIO/RustFS)',
    purpose: 'Archivos subidos: documentos clínicos, imágenes, adjuntos.',
    isCritical: true,
    status: 'ACTIVE',
    requiredEnvVars: ['FILE_STORAGE_S3_BUCKET'],
    checkType: 'CONFIGURATION',
    ownerTeam: 'plataforma',
    failureImpact: 'No se pueden subir ni servir archivos.',
    fallback:
      'Con el adaptador local depende del volumen del contenedor, no de un servicio externo.',
  },
  // src/modules/common/malware-scan.env.ts (MALWARE_SCAN_ENABLED; CLAMD_HOST/CLAMD_PORT con valor por defecto) · src/worker/jobs/files/clamd.client.ts
  {
    code: 'clamav',
    name: 'ClamAV',
    kind: 'SECURITY',
    provider: 'ClamAV (clamd)',
    purpose: 'Escaneo antimalware de los archivos subidos (worker files).',
    isCritical: false,
    status: 'ACTIVE',
    requiredEnvVars: [],
    checkType: 'CONFIGURATION',
    ownerTeam: 'plataforma',
    failureImpact:
      'Las versiones de archivo quedan en SCAN_PENDING y no se publican.',
    fallback: 'Escaneo apagado por configuración: los archivos no se analizan.',
  },
  // src/worker/google-email-client.service.ts (isConfigured: las 4 variables) · src/worker/jobs/messaging/google-provider-wiring.service.ts
  {
    code: 'gmail',
    name: 'Gmail API',
    kind: 'MAIL',
    provider: 'Google (OAuth2 de tres patas)',
    purpose:
      'Entrega de correo transaccional, incluida la activación de cuenta.',
    isCritical: true,
    status: 'ACTIVE',
    requiredEnvVars: [
      'GOOGLE_OAUTH_CLIENT_ID',
      'GOOGLE_OAUTH_CLIENT_SECRET',
      'GOOGLE_OAUTH_REFRESH_TOKEN',
      'GOOGLE_SENDER_EMAIL',
    ],
    checkType: 'CONFIGURATION',
    ownerTeam: 'plataforma',
    failureImpact:
      'Ningún usuario recibe correos; las activaciones de cuenta no llegan.',
    fallback:
      'Fuera de producción cae al emulador mock-provider-server; en producción no hay respaldo.',
  },
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
  // src/worker/worker.env.ts (mockProviderBaseUrl, prohibido en producción) · src/worker/mock-provider-client.service.ts
  {
    code: 'mock_provider_server',
    name: 'Emulador de proveedores',
    kind: 'EMULATOR',
    provider: 'mock-provider-server (propio)',
    purpose:
      'Doble de prueba de correo, borrado, verificación de identidad y embeddings fuera de producción.',
    isCritical: false,
    status: 'ACTIVE',
    requiredEnvVars: ['MOCK_PROVIDER_BASE_URL'],
    checkType: 'CONFIGURATION',
    ownerTeam: 'plataforma',
    failureImpact:
      'En desarrollo, las capacidades que dependen de él fallan visibles o quedan pendientes.',
    fallback: 'No aplica en producción: el arranque lo prohíbe.',
  },
  // src/worker/jobs/identity_assurance/mock-provider-wiring.service.ts (sólo none | mock)
  {
    code: 'identity_verification',
    name: 'Verificación de identidad',
    kind: 'IDENTITY',
    provider: 'Sin proveedor productivo',
    purpose:
      'Verificación de documento de identidad y matrícula profesional (identity_assurance).',
    isCritical: true,
    status: 'ACTIVE',
    requiredEnvVars: [],
    checkType: 'NOT_APPLICABLE',
    ownerTeam: 'plataforma',
    failureImpact:
      'Las verificaciones quedan pendientes o fallan con PROVIDER_NOT_CONFIGURED.',
    fallback: 'Fuera de producción, el emulador acepta toda verificación.',
  },
  // src/worker/jobs/vector_rag/mock-provider-wiring.service.ts (sólo none | mock)
  {
    code: 'embeddings',
    name: 'Embeddings (RAG)',
    kind: 'AI',
    provider: 'Sin proveedor productivo',
    purpose: 'Vectorización de contenido para búsqueda semántica (vector_rag).',
    isCritical: false,
    status: 'ACTIVE',
    requiredEnvVars: [],
    checkType: 'NOT_APPLICABLE',
    ownerTeam: 'plataforma',
    failureImpact: 'La cola de embeddings no drena.',
    fallback: 'Fuera de producción, el emulador devuelve vectores sintéticos.',
  },
  // src/worker/jobs/cross_store_consistency/mock-provider-wiring.service.ts (sólo none | mock)
  {
    code: 'cross_store_deletion',
    name: 'Borrado entre almacenes',
    kind: 'SECURITY',
    provider: 'Sin proveedor productivo',
    purpose:
      'Propagación del derecho de supresión a almacenes externos (cross_store_consistency).',
    isCritical: true,
    status: 'ACTIVE',
    requiredEnvVars: [],
    checkType: 'NOT_APPLICABLE',
    ownerTeam: 'plataforma',
    failureImpact: 'Las solicitudes de borrado quedan pendientes.',
    fallback: 'Fuera de producción, el emulador confirma los borrados.',
  },
  // src/modules/audio_assets/audio.env.ts (AUDIO_TTS_PROVIDER: disabled | elevenlabs | fake) · src/worker/jobs/audio_assets/elevenlabs/elevenlabs-http.client.ts
  {
    code: 'elevenlabs',
    name: 'ElevenLabs (TTS)',
    kind: 'AI',
    provider: 'ElevenLabs',
    purpose: 'Síntesis de voz para los recursos de audio (audio_assets).',
    isCritical: false,
    status: 'ACTIVE',
    requiredEnvVars: ['ELEVENLABS_API_KEY'],
    checkType: 'CONFIGURATION',
    ownerTeam: 'plataforma',
    failureImpact:
      'No se generan audios nuevos; los existentes siguen sirviéndose.',
    fallback:
      'Plantilla de respaldo global y proveedor falso fuera de producción.',
  },
  // src/modules/telemetry/web-analytics.env.ts (google_analytics requiere GA4_MEASUREMENT_ID y GA4_API_SECRET)
  {
    code: 'ga4',
    name: 'Google Analytics 4',
    kind: 'ANALYTICS',
    provider: 'Google (Measurement Protocol)',
    purpose: 'Reenvío de analítica web seudonimizada (telemetry).',
    isCritical: false,
    status: 'ACTIVE',
    requiredEnvVars: ['GA4_MEASUREMENT_ID', 'GA4_API_SECRET'],
    checkType: 'CONFIGURATION',
    ownerTeam: 'producto',
    failureImpact:
      'Se pierde analítica; ninguna operación de negocio se afecta.',
    fallback: 'Apagado por defecto: los eventos no salen de la API.',
  },
  // src/modules/billing/billing.module.ts (SIAT_MODE=real → SiatRealAdapter) · src/modules/billing/infrastructure/adapters/siat-real.adapter.ts
  {
    code: 'siat',
    name: 'SIAT (facturación)',
    kind: 'FISCAL',
    provider: 'Impuestos Nacionales de Bolivia',
    purpose: 'Emisión y anulación de facturas electrónicas (billing).',
    isCritical: true,
    status: 'ACTIVE',
    requiredEnvVars: ['SIAT_BASE_URL', 'SIAT_CODIGO_SISTEMA', 'SIAT_NIT'],
    checkType: 'CONFIGURATION',
    ownerTeam: 'facturación',
    failureImpact: 'No se emiten facturas con validez fiscal.',
    fallback: 'Adaptador simulado por defecto: factura sin validez fiscal.',
  },
  // src/modules/payments/gateway/payments-gateway.env.ts (PAYMENTS_VIA_GATEWAY exige URL y clave)
  {
    code: 'payments_gateway',
    name: 'Pasarela de pagos',
    kind: 'PAYMENTS',
    provider: 'Pasarela HTTP configurada por entorno',
    purpose: 'Cobros con QR o cuenta por pasarela (payments).',
    isCritical: true,
    status: 'ACTIVE',
    requiredEnvVars: ['PAYMENTS_GATEWAY_BASE_URL', 'PAYMENTS_GATEWAY_API_KEY'],
    checkType: 'CONFIGURATION',
    ownerTeam: 'facturación',
    failureImpact: 'No se pueden iniciar cobros por pasarela.',
    fallback:
      'Con la pasarela apagada los pagos se registran sin cobro en línea.',
  },
  // src/modules/pharmacy_inventory/infrastructure/adapters/pharmacy-erp.env.ts · http-external-pharmacy-catalog.adapter.ts (isConfigured)
  {
    code: 'pharmacy_erp',
    name: 'Catálogo externo de farmacia (ERP)',
    kind: 'INTEGRATION',
    provider: 'ERP de farmacia por HTTP',
    purpose: 'Sincronización del catálogo de productos (pharmacy_inventory).',
    isCritical: false,
    status: 'ACTIVE',
    requiredEnvVars: ['PHARMACY_ERP_BASE_URL'],
    checkType: 'CONFIGURATION',
    ownerTeam: 'farmacia',
    failureImpact:
      'No se importa el catálogo externo; el inventario local sigue operando.',
    fallback: 'Sin URL no se llama a nadie ni se crea lote.',
  },
  // src/modules/geo/reverse-geocoding/reverse-geocoding.service.ts (loadReverseGeocodingConfig, todo con valor por defecto)
  {
    code: 'reverse_geocoding',
    name: 'Geocodificación inversa',
    kind: 'MAPS',
    provider: 'Nominatim (OpenStreetMap) con respaldo Photon',
    purpose: 'Dirección a partir de coordenadas en el alta de pacientes (geo).',
    isCritical: false,
    status: 'ACTIVE',
    requiredEnvVars: [],
    checkType: 'CONFIGURATION',
    ownerTeam: 'producto',
    failureImpact: 'El alta degrada: la dirección se escribe a mano.',
    fallback: 'Segundo proveedor con enfriamiento del primario.',
  },
  // src/observability/telemetry.config.ts (OTEL_ENABLED apagado por defecto)
  {
    code: 'otel',
    name: 'Trazas OTLP (Jaeger)',
    kind: 'OBSERVABILITY',
    provider: 'OpenTelemetry → colector OTLP',
    purpose: 'Exportación de trazas distribuidas de la API.',
    isCritical: false,
    status: 'ACTIVE',
    requiredEnvVars: ['OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'],
    checkType: 'CONFIGURATION',
    ownerTeam: 'plataforma',
    failureImpact: 'Se pierden trazas; la aplicación no se ve afectada.',
    fallback: 'Apagado por defecto: nada se exporta.',
  },
];
