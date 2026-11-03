/**
 * El sistema propio de una farmacia (FAR-C9 · C9-3): dónde está, en qué
 * formato habla y con qué código se identifica la farmacia en él.
 *
 * Lo carga la farmacia en su pestaña Integración y queda en la conexión de
 * integraciones (`integrations.provider_connections.config_json`); la clave va
 * aparte, cifrada, en su credencial. Una conexión de farmacia sin sistema
 * propio (`connection_id` nulo) usa el sistema que configura el servidor
 * (`PHARMACY_ERP_BASE_URL`), como en FAR-07.
 */

/** Formatos que la plataforma sabe leer. */
export const EXTERNAL_SYSTEM_FORMATS = [
  'ALOVIDA_STANDARD',
  'SIMULATED_CHAIN',
] as const;

/**
 * - `ALOVIDA_STANDARD`: el contrato que publica la plataforma
 *   (`docs/integrations/pharmacy-standard.openapi.yaml`), clave en `X-Api-Key`.
 * - `SIMULATED_CHAIN`: la cadena de `mock-provider-server/`, a propósito
 *   distinta (Bearer, paginada, nombres propios), para probar que un formato
 *   ajeno entra por su propio adaptador.
 */
export type ExternalSystemFormat = (typeof EXTERNAL_SYSTEM_FORMATS)[number];

/** Lo que se guarda del sistema de la farmacia (nunca la clave). */
export interface ExternalSystemConfig {
  readonly format: ExternalSystemFormat;
  /** Sin barra final. */
  readonly baseUrl: string;
  /** Código de la farmacia (o de la cadena) en ese sistema. */
  readonly externalPharmacyCode: string;
}

/** Marca de `config_json` para reconocer una conexión de farmacia. */
export const EXTERNAL_SYSTEM_CONFIG_KIND = 'PHARMACY_EXTERNAL_SYSTEM';

/** Código del proveedor de integraciones de cada formato. */
export const EXTERNAL_SYSTEM_PROVIDER_CODE: Record<
  ExternalSystemFormat,
  string
> = {
  ALOVIDA_STANDARD: 'PHARMACY_ALOVIDA_STANDARD',
  SIMULATED_CHAIN: 'PHARMACY_SIMULATED_CHAIN',
};

/** Nombre del proveedor de cada formato, para la fila de `external_providers`. */
export const EXTERNAL_SYSTEM_PROVIDER_NAME: Record<
  ExternalSystemFormat,
  string
> = {
  ALOVIDA_STANDARD: 'Sistema de farmacia · Estándar ALOVIDA',
  SIMULATED_CHAIN: 'Sistema de farmacia · Cadena simulada',
};

/** La forma de `config_json` tal como se escribe. */
export function externalSystemConfigJson(
  config: ExternalSystemConfig,
): Record<string, unknown> {
  return {
    kind: EXTERNAL_SYSTEM_CONFIG_KIND,
    format: config.format,
    baseUrl: config.baseUrl,
    externalPharmacyCode: config.externalPharmacyCode,
  };
}

/**
 * Lee `config_json`; `null` si no es la de un sistema de farmacia o le falta
 * algo. Una configuración que no se entiende no se usa: es lo mismo que no
 * tener sistema.
 */
export function parseExternalSystemConfig(
  json: unknown,
): ExternalSystemConfig | null {
  if (typeof json !== 'object' || json === null) return null;
  const raw = json as Record<string, unknown>;
  if (raw.kind !== EXTERNAL_SYSTEM_CONFIG_KIND) return null;
  const format = raw.format;
  if (
    typeof format !== 'string' ||
    !(EXTERNAL_SYSTEM_FORMATS as readonly string[]).includes(format)
  ) {
    return null;
  }
  if (typeof raw.baseUrl !== 'string' || raw.baseUrl === '') return null;
  if (
    typeof raw.externalPharmacyCode !== 'string' ||
    raw.externalPharmacyCode === ''
  ) {
    return null;
  }
  return {
    format: format as ExternalSystemFormat,
    baseUrl: raw.baseUrl,
    externalPharmacyCode: raw.externalPharmacyCode,
  };
}

/** Quita espacios y barras finales; la ruta de cada formato se agrega después. */
export function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

/**
 * Si la plataforma puede llamar a esa dirección.
 *
 * La dirección la escribe la farmacia y la llama el servidor: sin un límite,
 * cualquiera con la pestaña Integración haría que la API pidiera direcciones
 * internas (metadatos de la nube, la base, otros servicios). Por eso:
 *
 * - solo `http` y `https`, sin usuario ni contraseña en la URL;
 * - solo los hosts de `PHARMACY_EXTERNAL_ALLOWED_HOSTS` (exactos o
 *   `*.dominio`). **Sin lista no se llama a nadie**, en cualquier entorno;
 *   solo fuera de producción, `PHARMACY_EXTERNAL_ALLOW_ANY_HOST=true` lo abre
 *   a propósito (una máquina local con el simulador);
 * - en producción solo vale `https`, y además el cliente rechaza al conectar
 *   las IP internas (`external-system-clients.ts`).
 *
 * @returns `null` si se permite; si no, el motivo.
 */
export function externalSystemUrlProblem(
  baseUrl: string,
  policy: ExternalSystemHostPolicy,
): 'URL_INVALID' | 'HOST_NOT_ALLOWED' | null {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return 'URL_INVALID';
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'URL_INVALID';
  }
  if (url.username !== '' || url.password !== '') return 'URL_INVALID';
  if (url.search !== '' || url.hash !== '') return 'URL_INVALID';
  if (policy.production && url.protocol !== 'https:') {
    return 'HOST_NOT_ALLOWED';
  }
  if (policy.allowedHosts.length === 0) {
    return policy.allowAnyHost && !policy.production
      ? null
      : 'HOST_NOT_ALLOWED';
  }
  const host = url.hostname.toLowerCase();
  const allowed = policy.allowedHosts.some((entry) =>
    entry.startsWith('*.')
      ? host.endsWith(entry.slice(1)) && host.length > entry.length - 1
      : host === entry,
  );
  return allowed ? null : 'HOST_NOT_ALLOWED';
}

/** Qué hosts se pueden llamar, leído del entorno. */
export interface ExternalSystemHostPolicy {
  readonly production: boolean;
  /** En minúsculas; `*.dominio` admite subdominios. */
  readonly allowedHosts: readonly string[];
  /** Sin lista, cualquiera (solo fuera de producción). */
  readonly allowAnyHost: boolean;
}

/** Lee la política del entorno. */
export function loadExternalSystemHostPolicy(
  source: NodeJS.ProcessEnv = process.env,
): ExternalSystemHostPolicy {
  return {
    production: source.NODE_ENV === 'production',
    allowedHosts: (source.PHARMACY_EXTERNAL_ALLOWED_HOSTS ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry !== ''),
    allowAnyHost: source.PHARMACY_EXTERNAL_ALLOW_ANY_HOST === 'true',
  };
}
