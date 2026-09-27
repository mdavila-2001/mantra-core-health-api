import * as Joi from 'joi';

/**
 * STUN público por defecto. Sólo descubre la IP pública de cada extremo: no
 * retransmite medios, así que no ve ni el audio ni el video de la consulta.
 */
export const DEFAULT_TELECONSULT_STUN_URLS = ['stun:stun.l.google.com:19302'];

/** TTL por defecto de la credencial TURN efímera (una consulta holgada). */
export const DEFAULT_TELECONSULT_TURN_TTL_SECONDS = 3600;

/**
 * Variables de la teleconsulta (señalización WebRTC, `/teleconsult`).
 *
 * Todas opcionales: sin ninguna, la API entrega sólo STUN público. TURN admite
 * dos formas **excluyentes**:
 * - estática: `TELECONSULT_TURN_USERNAME` + `TELECONSULT_TURN_CREDENTIAL`;
 * - efímera: `TELECONSULT_TURN_SECRET` (el `static-auth-secret` de un coturn
 *   con `use-auth-secret`), con `TELECONSULT_TURN_TTL_SECONDS` de vigencia.
 *
 * Joi sólo valida tipos; la coherencia entre variables (URLs sin credencial,
 * credencial sin URLs, las dos formas a la vez) la decide
 * {@link parseTeleconsultIceEnv}, que corre al construir el servicio y
 * tumba el arranque si la configuración es parcial.
 */
export const teleconsultEnvSchema = Joi.object({
  TELECONSULT_STUN_URLS: Joi.string().allow('').default(''),
  TELECONSULT_TURN_URLS: Joi.string().allow('').default(''),
  TELECONSULT_TURN_USERNAME: Joi.string().allow('').default(''),
  TELECONSULT_TURN_CREDENTIAL: Joi.string().allow('').default(''),
  TELECONSULT_TURN_SECRET: Joi.string().allow('').default(''),
  TELECONSULT_TURN_TTL_SECONDS: Joi.number()
    .integer()
    .min(60)
    .max(86_400)
    .default(DEFAULT_TELECONSULT_TURN_TTL_SECONDS),
}).unknown(true);

/** Cómo se autentica el cliente ante el TURN configurado. */
export type TeleconsultTurnConfig =
  | {
      readonly mode: 'static';
      readonly urls: string[];
      readonly username: string;
      readonly credential: string;
    }
  | {
      readonly mode: 'ephemeral';
      readonly urls: string[];
      readonly secret: string;
      readonly ttlSeconds: number;
    };

/** Configuración ICE ya validada. */
export interface TeleconsultIceConfig {
  readonly stunUrls: string[];
  /** `undefined` = sin TURN: sólo STUN. */
  readonly turn?: TeleconsultTurnConfig;
}

/** Lo que se lee del entorno (todo texto, tal como llega). */
export type TeleconsultEnv = Readonly<Record<string, string | undefined>>;

const STUN_PREFIX = /^stuns?:/;
const TURN_PREFIX = /^turns?:/;

function lista(valor: string | undefined): string[] {
  return (valor ?? '')
    .split(',')
    .map((parte) => parte.trim())
    .filter((parte) => parte.length > 0);
}

function lleno(valor: string | undefined): boolean {
  return (valor ?? '').trim().length > 0;
}

/**
 * Interpreta y valida la configuración ICE.
 *
 * @param env - Variables `TELECONSULT_*` (normalmente `process.env`).
 * @returns Servidores STUN y, si está completo, el TURN.
 * @throws Error con un mensaje que nombra la variable si la configuración es
 *   incoherente. Los valores secretos nunca aparecen en el mensaje.
 */
export function parseTeleconsultIceEnv(
  env: TeleconsultEnv,
): TeleconsultIceConfig {
  const stunDeclarados = lista(env.TELECONSULT_STUN_URLS);
  const stunUrls =
    stunDeclarados.length > 0 ? stunDeclarados : DEFAULT_TELECONSULT_STUN_URLS;
  const stunMalo = stunUrls.find((url) => !STUN_PREFIX.test(url));
  if (stunMalo !== undefined) {
    throw new Error(
      'TELECONSULT_STUN_URLS: cada URL debe empezar con stun: o stuns:',
    );
  }

  const turnUrls = lista(env.TELECONSULT_TURN_URLS);
  const hayEstatica =
    lleno(env.TELECONSULT_TURN_USERNAME) ||
    lleno(env.TELECONSULT_TURN_CREDENTIAL);
  const hayEfimera = lleno(env.TELECONSULT_TURN_SECRET);

  if (turnUrls.length === 0) {
    if (hayEstatica || hayEfimera) {
      throw new Error(
        'TELECONSULT_TURN_URLS vacío pero hay credencial TURN declarada: ' +
          'configuración parcial',
      );
    }
    return { stunUrls };
  }

  if (turnUrls.some((url) => !TURN_PREFIX.test(url))) {
    throw new Error(
      'TELECONSULT_TURN_URLS: cada URL debe empezar con turn: o turns:',
    );
  }
  if (hayEstatica && hayEfimera) {
    throw new Error(
      'TURN: declarar TELECONSULT_TURN_SECRET o USERNAME/CREDENTIAL, no ambos',
    );
  }

  if (hayEfimera) {
    const ttl = Number(
      env.TELECONSULT_TURN_TTL_SECONDS ?? DEFAULT_TELECONSULT_TURN_TTL_SECONDS,
    );
    if (!Number.isInteger(ttl) || ttl < 60 || ttl > 86_400) {
      throw new Error(
        'TELECONSULT_TURN_TTL_SECONDS debe ser un entero entre 60 y 86400',
      );
    }
    return {
      stunUrls,
      turn: {
        mode: 'ephemeral',
        urls: turnUrls,
        secret: (env.TELECONSULT_TURN_SECRET ?? '').trim(),
        ttlSeconds: ttl,
      },
    };
  }

  if (
    !lleno(env.TELECONSULT_TURN_USERNAME) ||
    !lleno(env.TELECONSULT_TURN_CREDENTIAL)
  ) {
    throw new Error(
      'TELECONSULT_TURN_URLS declarado sin credencial completa: faltan ' +
        'TELECONSULT_TURN_USERNAME + TELECONSULT_TURN_CREDENTIAL o ' +
        'TELECONSULT_TURN_SECRET',
    );
  }
  return {
    stunUrls,
    turn: {
      mode: 'static',
      urls: turnUrls,
      username: (env.TELECONSULT_TURN_USERNAME ?? '').trim(),
      credential: (env.TELECONSULT_TURN_CREDENTIAL ?? '').trim(),
    },
  };
}
