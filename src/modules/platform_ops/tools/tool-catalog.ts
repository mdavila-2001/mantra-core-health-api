/**
 * Catálogo INTERNO de herramientas de la plataforma (no es un catálogo oficial
 * ni dato aportado por personas: ver regla 97.4.5).
 *
 * Fuente única de lo que el registro no puede guardar hoy porque el DDL no
 * tiene columna: `requiredEnvVars` (solo NOMBRES, nunca valores), la
 * procedencia por herramienta y la sonda declarada. El seeder
 * (`src/common/seed/tool-registry-seed.service.ts`) la vuelca a
 * `platform_ops.{tool_registry,service_components,component_tools,health_checks}`
 * y el servicio de lectura la usa para saber qué variables verificar.
 *
 * Procedencia: cada entrada cita archivo y línea tal como los registró el
 * descubrimiento 03 (lectura de `docker-compose.yml`, `docker-compose.coolify.yml`,
 * `.env.example` y código de `mantra-core-health-api`). Solo hay herramientas que
 * el repo usa o declara; no se agregó ningún proveedor por analogía.
 */

export const TOOL_KINDS = [
  'DATABASE',
  'CACHE',
  'SEARCH',
  'STORAGE',
  'MESSAGING',
  'PAYMENTS',
  'AI',
  'MAPS',
  'ANALYTICS',
  'SECURITY',
  'OBSERVABILITY',
  'OTHER',
] as const;
export type ToolKind = (typeof TOOL_KINDS)[number];

export const TOOL_STATUSES = [
  'ACTIVE',
  'PLANNED',
  'DEPRECATED',
  'DISABLED',
] as const;
export type ToolStatus = (typeof TOOL_STATUSES)[number];

export const TOOL_CHECK_TYPES = [
  'LIVE',
  'CONFIGURATION',
  'NOT_APPLICABLE',
] as const;
export type ToolCheckType = (typeof TOOL_CHECK_TYPES)[number];

/** Procedencia común a todo el catálogo (regla 97.4.2). */
export const TOOL_CATALOG_PROVENANCE = {
  clase: 'catálogo interno',
  fuente:
    'mantra-core-health/docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/descubrimiento/03-herramientas-e-instancias.md §2.1',
  origen:
    'lectura de mantra-core-health-api: docker-compose.yml, docker-compose.coolify.yml, .env.example y código fuente',
  obtenida: '2026-10-30',
  licencia: 'interno (sin restricción de uso)',
} as const;

export interface ToolCatalogEntry {
  /** Identificador estable y único (también `code` de componente y de chequeo). */
  readonly code: string;
  readonly name: string;
  readonly kind: ToolKind;
  readonly status: ToolStatus;
  readonly isCritical: boolean;
  /** Nombre comercial/técnico del producto o `undefined` si es una capacidad sin proveedor. */
  readonly vendor?: string;
  readonly purpose: string;
  /** Solo NOMBRES de variables de entorno. */
  readonly requiredEnvVars: readonly string[];
  /** Tipo de comprobación que corresponde a la herramienta. */
  readonly check: ToolCheckType;
  /** `archivo:línea` o `archivo` de donde sale la entrada (procedencia). */
  readonly source: string;
}

/**
 * Reglas de armado:
 *  - `check: 'LIVE'` solo donde existe una sonda real o un healthcheck de
 *    compose; mientras nadie registre corridas, el estado es `NOT_PROBED`.
 *  - `check: 'CONFIGURATION'` solo donde hay variables obligatorias que
 *    verificar y ninguna sonda barata.
 *  - `PLANNED`/`DISABLED` llevan `NOT_APPLICABLE`: no hay nada que medir.
 *  - `DISABLED` = apagada por defecto en `.env.example`; el estado de catálogo
 *    no refleja el interruptor de cada entorno.
 */
export const TOOL_CATALOG: readonly ToolCatalogEntry[] = [
  {
    code: 'postgresql',
    name: 'PostgreSQL (TimescaleDB, pgvector)',
    kind: 'DATABASE',
    status: 'ACTIVE',
    isCritical: true,
    vendor: 'PostgreSQL',
    purpose: 'Base transaccional principal de la API.',
    requiredEnvVars: [
      'DB_HOST',
      'DB_PORT',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
    ],
    check: 'LIVE',
    source:
      'docker-compose.yml:342-358; .env.example:22-27; src/app-readiness.service.ts:73,79',
  },
  {
    code: 'mongodb',
    name: 'MongoDB (document store)',
    kind: 'DATABASE',
    status: 'ACTIVE',
    isCritical: true,
    vendor: 'MongoDB',
    purpose: 'Almacén documental del módulo document_store.',
    requiredEnvVars: ['MONGODB_URI', 'MONGO_DB'],
    check: 'LIVE',
    source:
      'docker-compose.yml:392-402; .env.example:39-40; src/app-readiness.service.ts:76',
  },
  {
    code: 'redis',
    name: 'Redis',
    kind: 'CACHE',
    status: 'ACTIVE',
    isCritical: true,
    vendor: 'Redis',
    purpose: 'Caché y runtime compartido (redis_runtime).',
    requiredEnvVars: ['REDIS_HOST', 'REDIS_PORT'],
    check: 'LIVE',
    source:
      'docker-compose.yml:442-450; .env.example:43-44; src/app-readiness.service.ts:77',
  },
  {
    code: 'opensearch',
    name: 'OpenSearch',
    kind: 'SEARCH',
    status: 'ACTIVE',
    isCritical: true,
    vendor: 'OpenSearch',
    purpose: 'Búsqueda (search_platform).',
    requiredEnvVars: ['OPENSEARCH_NODE'],
    check: 'LIVE',
    source:
      'docker-compose.yml:458-481; .env.example:47; src/app-readiness.service.ts:78',
  },
  {
    code: 'file-storage',
    name: 'Almacenamiento de archivos (disco local o S3: MinIO/RustFS)',
    kind: 'STORAGE',
    status: 'ACTIVE',
    isCritical: true,
    purpose:
      'Archivos y versiones. Crítico si el adaptador es S3; con disco local depende del volumen api_storage. Las variables FILE_STORAGE_S3_* solo aplican con adaptador S3 y por eso no se listan como obligatorias.',
    requiredEnvVars: [],
    check: 'LIVE',
    source:
      'docker-compose.yml:504-521; src/common/storage/{local-disk,s3}-file-storage.adapter.ts; .env.example:147-160',
  },
  {
    code: 'clamav',
    name: 'ClamAV (antimalware)',
    kind: 'SECURITY',
    status: 'DISABLED',
    isCritical: false,
    vendor: 'ClamAV',
    purpose:
      'Escaneo de archivos subidos. Opt-in (MALWARE_SCAN_ENABLED apagado por defecto): sin él las versiones quedan SCAN_PENDING.',
    requiredEnvVars: ['MALWARE_SCAN_ENABLED', 'CLAMD_HOST', 'CLAMD_PORT'],
    check: 'NOT_APPLICABLE',
    source:
      'docker-compose.yml:528-553; .env.example:614-616; src/worker/jobs/files/clamd.client.ts',
  },
  {
    code: 'gmail-api',
    name: 'Gmail API (correo transaccional)',
    kind: 'MESSAGING',
    status: 'ACTIVE',
    isCritical: true,
    vendor: 'Google',
    purpose:
      'Entrega de correos, incluida la activación de cuenta. Con las cuatro variables ausentes el worker cae al emulador sin error.',
    requiredEnvVars: [
      'GOOGLE_OAUTH_CLIENT_ID',
      'GOOGLE_OAUTH_CLIENT_SECRET',
      'GOOGLE_OAUTH_REFRESH_TOKEN',
      'GOOGLE_SENDER_EMAIL',
    ],
    check: 'CONFIGURATION',
    source:
      'docker-compose.coolify.yml:818-822; .env.example:535-538; src/worker/google-email-client.service.ts:52',
  },
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
    code: 'mock-provider-server',
    name: 'Emulador de proveedores (mock-provider-server)',
    kind: 'OTHER',
    status: 'ACTIVE',
    isCritical: false,
    purpose:
      'Doble de prueba de notificaciones, borrados, identidad, embeddings y ERP de farmacia. Solo desarrollo: está prohibido en producción.',
    requiredEnvVars: ['MOCK_PROVIDER_BASE_URL', 'MOCK_PROVIDER_API_KEY'],
    check: 'LIVE',
    source:
      'docker-compose.yml:575-598; .env.example:508-510; src/worker/worker.env.ts:233-251',
  },
  {
    code: 'vector-rag-embeddings',
    name: 'Proveedor de embeddings (sin adaptador productivo)',
    kind: 'AI',
    status: 'PLANNED',
    isCritical: false,
    purpose:
      'Capacidad vector_rag.embeddings: hoy solo existe el adaptador mock/none.',
    requiredEnvVars: [],
    check: 'NOT_APPLICABLE',
    source: 'src/worker/jobs/vector_rag/mock-provider-wiring.service.ts:25,28',
  },
  {
    code: 'cross-store-deletion',
    name: 'Proveedor de borrado cross-store (sin adaptador productivo)',
    kind: 'OTHER',
    status: 'PLANNED',
    isCritical: true,
    purpose:
      'Derecho de supresión entre almacenes: hoy solo existe el adaptador mock/none.',
    requiredEnvVars: [],
    check: 'NOT_APPLICABLE',
    source:
      'src/worker/jobs/cross_store_consistency/mock-deletion-provider.adapter.ts',
  },
  {
    code: 'identity-verification',
    name: 'Verificación de identidad (sin adaptador productivo)',
    kind: 'SECURITY',
    status: 'PLANNED',
    isCritical: true,
    purpose:
      'Capacidad identity_assurance: hoy solo existe el adaptador mock/none.',
    requiredEnvVars: [],
    check: 'NOT_APPLICABLE',
    source:
      'src/worker/jobs/identity_assurance/mock-identity-verification-provider.adapter.ts',
  },
  {
    code: 'elevenlabs-tts',
    name: 'ElevenLabs (texto a voz)',
    kind: 'AI',
    status: 'DISABLED',
    isCritical: false,
    vendor: 'ElevenLabs',
    purpose: 'Generación de audio. Apagado por defecto (AUDIO_TTS_ENABLED).',
    requiredEnvVars: ['ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'],
    check: 'NOT_APPLICABLE',
    source: '.env.example:541-572; src/modules/audio_assets/audio.env.ts:74',
  },
  {
    code: 'google-analytics-4',
    name: 'Google Analytics 4 (Measurement Protocol)',
    kind: 'ANALYTICS',
    status: 'DISABLED',
    isCritical: false,
    vendor: 'Google',
    purpose:
      'Analítica web. Apagada por defecto (TELEMETRY_WEB_ANALYTICS_ENABLED).',
    requiredEnvVars: ['GA4_MEASUREMENT_ID', 'GA4_API_SECRET'],
    check: 'NOT_APPLICABLE',
    source:
      '.env.example:579-608; src/modules/telemetry/web-analytics.env.ts:22,87',
  },
  {
    code: 'siat-bolivia',
    name: 'SIAT (impuestos Bolivia, facturación)',
    kind: 'OTHER',
    status: 'DISABLED',
    isCritical: true,
    vendor: 'Impuestos Nacionales (Bolivia)',
    purpose:
      'Facturación fiscal. Simulada por defecto; el modo real queda apagado hasta configurar SIAT_*. Crítica a nivel legal si se emite factura real.',
    requiredEnvVars: ['SIAT_BASE_URL', 'SIAT_CODIGO_SISTEMA', 'SIAT_NIT'],
    check: 'NOT_APPLICABLE',
    source:
      '.env.example:627-638; src/modules/billing/billing.module.ts:106-111',
  },
  {
    code: 'payment-gateways',
    name: 'Pasarelas de pago (sin cliente real)',
    kind: 'PAYMENTS',
    status: 'PLANNED',
    isCritical: true,
    purpose:
      'Solo existen tablas payments.payment_gateways y gateway_connections; no hay cliente HTTP en modules/payments.',
    requiredEnvVars: [],
    check: 'NOT_APPLICABLE',
    source: 'src/modules/payments/entities/*',
  },
  {
    code: 'geocoding-reverse',
    name: 'Geocodificación inversa (Nominatim / Photon)',
    kind: 'MAPS',
    status: 'ACTIVE',
    isCritical: false,
    purpose:
      'Ruta pública POST /public/geo/reverse. Todas sus variables tienen valor por defecto: no hay variable obligatoria ni sonda.',
    requiredEnvVars: [],
    check: 'NOT_APPLICABLE',
    source:
      'src/modules/geo/reverse-geocoding/reverse-geocoding.service.ts:90-103',
  },
  {
    code: 'openstreetmap-tiles',
    name: 'OpenStreetMap (tiles del front)',
    kind: 'MAPS',
    status: 'ACTIVE',
    isCritical: false,
    purpose:
      'Teselas consumidas por el navegador; no pasan por la API. Revisar la política de uso de OSM para producción.',
    requiredEnvVars: [],
    check: 'NOT_APPLICABLE',
    source:
      'mantra-core-health/src/app/shared/components/organisms/map/map-tiles.ts:25',
  },
  {
    code: 'otlp-tracing',
    name: 'OpenTelemetry / Jaeger / Prometheus',
    kind: 'OBSERVABILITY',
    status: 'DISABLED',
    isCritical: false,
    purpose:
      'Trazas y métricas. Apagado por defecto (OTEL_ENABLED); no debe tumbar la app.',
    requiredEnvVars: ['OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'],
    check: 'NOT_APPLICABLE',
    source: '.env.example:397-420; src/observability/telemetry.config.ts:35',
  },
];

export const TOOL_CATALOG_BY_CODE: ReadonlyMap<string, ToolCatalogEntry> =
  new Map(TOOL_CATALOG.map((entry) => [entry.code, entry]));

/** Texto de procedencia que el seeder guarda en `service_components.description`. */
export function provenanceText(entry: ToolCatalogEntry): string {
  const p = TOOL_CATALOG_PROVENANCE;
  return (
    `Clase: ${p.clase}. Fuente: ${p.fuente}. Origen: ${p.origen}. ` +
    `Referencia: ${entry.source}. Obtenida: ${p.obtenida}. Licencia: ${p.licencia}.`
  );
}
