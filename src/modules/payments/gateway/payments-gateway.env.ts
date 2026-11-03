import * as Joi from 'joi';
import {
  decodeWebhookPublicKey,
  decodeWebhookSecret,
} from './standard-webhook-signature';

/**
 * Configuración de la pasarela de pagos ALOVIDA como PSP del módulo 42
 * (carril INT, `payments.via_gateway`).
 *
 * Vive junto al módulo —como `web-analytics.env.ts`— y su esquema Joi se
 * concatena en la validación global de `AppModule`: con el flag encendido y sin
 * URL, clave o secreto de webhook, el proceso muere en el arranque y no en el
 * primer cobro.
 *
 * El flag está **apagado por defecto**: un despliegue que no configure nada se
 * comporta exactamente igual que antes de existir este cliente (M42 → Libélula).
 * Se lee del entorno, así que apagarlo es cambiar la variable y reiniciar; no
 * hay un interruptor en caliente.
 *
 * Ninguna clave vive en el repositorio: `PAYMENTS_GATEWAY_API_KEY` y los
 * secretos de webhook llegan por el entorno del despliegue.
 */

/** Valor por defecto del plazo por petición a la pasarela. */
const DEFAULT_TIMEOUT_MS = 10_000;
/** Intentos totales (el primero incluido) ante un resultado ambiguo. */
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_BASE_MS = 300;
/** Misma ventana que la librería de referencia (`DEFAULT_TOLERANCE_SECONDS`). */
const DEFAULT_WEBHOOK_TOLERANCE_SECONDS = 300;

const API_KEY_PATTERN = /^sk_(test|live)_[A-Za-z0-9_-]{8,}$/u;

/** Esquema de validación del entorno de la pasarela. */
export const paymentsGatewayEnvSchema = Joi.object({
  PAYMENTS_VIA_GATEWAY: Joi.boolean().default(false),
  PAYMENTS_GATEWAY_BASE_URL: Joi.string()
    .uri({ scheme: ['https', 'http'] })
    .allow('')
    .default('')
    .when('PAYMENTS_VIA_GATEWAY', {
      is: true,
      then: Joi.string()
        .uri({ scheme: ['https', 'http'] })
        .required(),
    }),
  PAYMENTS_GATEWAY_API_KEY: Joi.string()
    .pattern(API_KEY_PATTERN)
    .allow('')
    .default('')
    .when('PAYMENTS_VIA_GATEWAY', {
      is: true,
      then: Joi.string().pattern(API_KEY_PATTERN).required(),
    }),
  PAYMENTS_GATEWAY_WEBHOOK_SECRETS: Joi.string().allow('').default(''),
  PAYMENTS_GATEWAY_WEBHOOK_PUBLIC_KEYS: Joi.string().allow('').default(''),
  PAYMENTS_GATEWAY_WEBHOOK_TOLERANCE_SECONDS: Joi.number()
    .integer()
    .min(30)
    .max(3_600)
    .default(DEFAULT_WEBHOOK_TOLERANCE_SECONDS),
  PAYMENTS_GATEWAY_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1_000)
    .max(60_000)
    .default(DEFAULT_TIMEOUT_MS),
  PAYMENTS_GATEWAY_MAX_ATTEMPTS: Joi.number()
    .integer()
    .min(1)
    .max(6)
    .default(DEFAULT_MAX_ATTEMPTS),
  PAYMENTS_GATEWAY_RETRY_BASE_MS: Joi.number()
    .integer()
    .min(50)
    .max(10_000)
    .default(DEFAULT_RETRY_BASE_MS),
}).unknown(true);

/** Modo que la pasarela deriva de la clave (`sk_test_…` o `sk_live_…`). */
export type PaymentsGatewayMode = 'test' | 'live';

/** Configuración efectiva, ya normalizada. */
export interface PaymentsGatewayConfig {
  /** `payments.via_gateway`: los cobros nuevos van a la pasarela. */
  viaGateway: boolean;
  /** URL base de la API pública, con `/v1` (el `servers[0]` del contrato), sin barra final. */
  baseUrl: string;
  /** Clave de API del comercio. Nunca se registra en logs. */
  apiKey: string;
  /** Modo de la clave; `null` si el flag está apagado. */
  mode: PaymentsGatewayMode | null;
  /** Secretos `whsec_…` con los que se verifican los webhooks (más de uno permite rotar sin corte). */
  webhookSecrets: readonly string[];
  /** Claves públicas `whpk_…` de confianza para firmas `v1a`. */
  webhookPublicKeys: readonly string[];
  /** Ventana anti-replay de la marca de tiempo del webhook, en segundos. */
  webhookToleranceSeconds: number;
  /** Plazo por petición saliente. */
  timeoutMs: number;
  /** Intentos totales ante un resultado ambiguo (siempre con la MISMA clave). */
  maxAttempts: number;
  /** Ventana base del backoff exponencial. */
  retryBaseMs: number;
}

/** Lee un booleano de entorno respetando el defecto del esquema. */
function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  return value.trim().toLowerCase() === 'true';
}

/** Lee un entero de entorno respetando el defecto del esquema. */
function int(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

/** Separa una lista de entorno por comas/espacios y descarta vacíos. */
function list(value: string | undefined): string[] {
  return (value ?? '')
    .split(/[\s,]+/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Lee y valida la configuración de la pasarela.
 *
 * Con el flag apagado no exige nada: la pasarela es opt-in.
 *
 * @param env - Entorno a leer; por defecto `process.env`.
 * @returns Configuración lista para el cliente y el receptor de webhooks.
 * @throws Error si el flag está encendido y falta o es inválido algo de lo que
 *   necesita para operar de forma segura. El mensaje nombra la variable, nunca
 *   su valor.
 */
export function loadPaymentsGatewayConfig(
  env: NodeJS.ProcessEnv = process.env,
): PaymentsGatewayConfig {
  const viaGateway = bool(env.PAYMENTS_VIA_GATEWAY, false);
  const base = {
    webhookToleranceSeconds: int(
      env.PAYMENTS_GATEWAY_WEBHOOK_TOLERANCE_SECONDS,
      DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
    ),
    timeoutMs: int(env.PAYMENTS_GATEWAY_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    maxAttempts: Math.max(
      1,
      int(env.PAYMENTS_GATEWAY_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS),
    ),
    retryBaseMs: int(env.PAYMENTS_GATEWAY_RETRY_BASE_MS, DEFAULT_RETRY_BASE_MS),
  };

  if (!viaGateway) {
    return {
      viaGateway,
      baseUrl: '',
      apiKey: '',
      mode: null,
      webhookSecrets: [],
      webhookPublicKeys: [],
      ...base,
    };
  }

  const baseUrl = (env.PAYMENTS_GATEWAY_BASE_URL ?? '')
    .trim()
    .replace(/\/+$/u, '');
  const apiKey = (env.PAYMENTS_GATEWAY_API_KEY ?? '').trim();
  const webhookSecrets = list(env.PAYMENTS_GATEWAY_WEBHOOK_SECRETS);
  const webhookPublicKeys = list(env.PAYMENTS_GATEWAY_WEBHOOK_PUBLIC_KEYS);

  if (!baseUrl) {
    throw new Error(
      'PAYMENTS_GATEWAY_BASE_URL es obligatoria con PAYMENTS_VIA_GATEWAY=true',
    );
  }
  const keyMatch = API_KEY_PATTERN.exec(apiKey);
  if (!keyMatch) {
    throw new Error(
      'PAYMENTS_GATEWAY_API_KEY es obligatoria con PAYMENTS_VIA_GATEWAY=true y debe tener la forma sk_test_… o sk_live_…',
    );
  }
  if (webhookSecrets.length === 0 && webhookPublicKeys.length === 0) {
    throw new Error(
      'PAYMENTS_GATEWAY_WEBHOOK_SECRETS (o PAYMENTS_GATEWAY_WEBHOOK_PUBLIC_KEYS) es obligatoria con PAYMENTS_VIA_GATEWAY=true: sin ella no se puede verificar ningún webhook',
    );
  }
  for (const secret of webhookSecrets) {
    try {
      decodeWebhookSecret(secret);
    } catch {
      throw new Error(
        'PAYMENTS_GATEWAY_WEBHOOK_SECRETS contiene un secreto con formato inválido (se espera whsec_ + base64 de 24 a 64 bytes)',
      );
    }
  }
  for (const key of webhookPublicKeys) {
    try {
      decodeWebhookPublicKey(key);
    } catch {
      throw new Error(
        'PAYMENTS_GATEWAY_WEBHOOK_PUBLIC_KEYS contiene una clave con formato inválido (se espera whpk_ + base64 de 32 bytes)',
      );
    }
  }

  return {
    viaGateway,
    baseUrl,
    apiKey,
    mode: keyMatch[1] as PaymentsGatewayMode,
    webhookSecrets,
    webhookPublicKeys,
    ...base,
  };
}

/** Token de inyección de la configuración de la pasarela. */
export const PAYMENTS_GATEWAY_CONFIG = Symbol('PAYMENTS_GATEWAY_CONFIG');
