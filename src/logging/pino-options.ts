import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import { loadLoggingEnv } from './logging.env';
import {
  REDACTED_SHARE_TOKEN,
  redactShareTokenInReferer,
} from './share-token-redaction';
import { currentTraceContext } from '../observability/trace-context.service';

/**
 * Construcción de las opciones de pino que consume `LoggingModule`.
 *
 * Un único lugar decide cómo se ve y qué contiene cada línea de log del backend,
 * de modo que el arranque, el ORM, los controladores y los workers compartan
 * formato, nivel, redacción de secretos y transporte.
 */

/**
 * Rutas que se eliminan del log antes de escribirlo.
 *
 * Es una lista de denegación explícita, no una heurística: el logging de
 * peticiones de pino serializa cabeceras y, si no se recortan, la cabecera
 * `authorization` (un Bearer válido) y las cookies de sesión acabarían en texto
 * plano en el agregador de logs. En un sistema de salud eso es una fuga de
 * credenciales. `remove: true` las quita del objeto en vez de sustituirlas por
 * `[Redacted]`, para no dejar ni rastro de su existencia.
 */
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.token',
  'req.body.refreshToken',
  'req.body.secret',
  'req.body.otp',
  // «Admisión crea el vínculo»: el número del documento nunca va a los logs.
  'req.body.identityVerification',
];

export {
  REDACTED_SHARE_TOKEN,
  redactShareTokenInReferer,
  redactShareTokenInUrl,
} from './share-token-redaction';

/** La forma de `req` que deja el serializador estándar de pino. */
interface SerializedRequest {
  url?: unknown;
  params?: unknown;
  headers?: unknown;
  [key: string]: unknown;
}

/**
 * Serializador de `req` de pino-http: recibe la petición ya serializada por
 * `pino-std-serializers` y le saca el token del enlace compartido de `url`
 * (ruta y query), de `params` (`token` y el comodín `path` de nestjs-pino), de
 * `query` y del `Referer`.
 *
 * El `Referer` se redacta en vez de quitarse: en el resto de las páginas sigue
 * diciendo desde dónde vino la petición, que es lo que se busca en el log, y
 * solo cambia el segmento del token. `params`, `query` y `headers` se copian:
 * los objetos originales son los de Express y los siguen leyendo los handlers.
 *
 * La comparación por valor (un parámetro que es el token) se limita a
 * `params` de una ruta con token: aplicada a cualquier campo, un tramo corto
 * borraría también la IP o el método de la línea.
 *
 * @param req - Petición serializada.
 * @returns La misma petición, sin el token en claro.
 */
export function serializeRequest(req: SerializedRequest): SerializedRequest {
  if (typeof req.url === 'string') {
    const url = redactShareTokenInReferer(req.url);
    const shareRoute =
      url !== req.url || url.includes(`/${REDACTED_SHARE_TOKEN}`);
    req.url = url;
    if (shareRoute) {
      req.params = redactParams(req.params);
    }
  }
  if (isRecord(req.query)) {
    req.query = redactValues(req.query);
  }
  // Otras formas de la ruta que agregue un serializador (`originalUrl`,
  // `path`): se redactan como texto, nunca por comparación de valor.
  for (const key of Object.keys(req)) {
    const value = req[key];
    if (!SERIALIZED_ELSEWHERE.has(key) && typeof value === 'string') {
      req[key] = redactShareTokenInReferer(value);
    }
  }
  const headers = req.headers;
  if (isRecord(headers)) {
    const referer = headers.referer;
    if (typeof referer === 'string') {
      const redacted = redactShareTokenInReferer(referer);
      if (redacted !== referer) {
        req.headers = { ...headers, referer: redacted };
      }
    }
  }
  return req;
}

/** Campos de `req` que `serializeRequest` ya trata uno por uno. */
const SERIALIZED_ELSEWHERE = new Set(['url', 'params', 'query', 'headers']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Los `params` de una ruta con token. `token` es el token; `path` (el comodín
 * de nestjs-pino, un arreglo de segmentos o una cadena) se redacta como ruta;
 * cualquier otro valor se redacta como texto.
 */
function redactParams(params: unknown): unknown {
  if (!isRecord(params)) return params;
  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key === 'token' && typeof value === 'string') {
      copy[key] = REDACTED_SHARE_TOKEN;
    } else if (Array.isArray(value)) {
      const segments = value.map(String);
      copy[key] = redactShareTokenInReferer(`/${segments.join('/')}`)
        .slice(1)
        .split('/');
    } else if (typeof value === 'string') {
      copy[key] = redactShareTokenInReferer(
        value.startsWith('/') ? value : `/${value}`,
      ).slice(value.startsWith('/') ? 0 : 1);
    } else {
      copy[key] = value;
    }
  }
  return copy;
}

/** Una copia de `query` con el token redactado en cada valor de texto. */
function redactValues(
  values: Record<string, unknown>,
): Record<string, unknown> {
  let changed = false;
  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const redacted =
      typeof value === 'string'
        ? redactShareTokenInReferer(value)
        : Array.isArray(value)
          ? (value as unknown[]).map((item): unknown =>
              typeof item === 'string' ? redactShareTokenInReferer(item) : item,
            )
          : value;
    changed ||= JSON.stringify(redacted) !== JSON.stringify(value);
    copy[key] = redacted;
  }
  return changed ? copy : values;
}

/**
 * Comprueba si `pino-pretty` está instalado.
 *
 * El formato legible es una dependencia de desarrollo opcional. Referenciar un
 * transporte inexistente hace que pino falle en la primera línea que escribe, así
 * que se comprueba antes de activarlo: si `LOG_PRETTY=true` pero el paquete no
 * está, se cae con elegancia al JSON en vez de tumbar el proceso.
 */
function isPrettyAvailable(): boolean {
  try {
    require.resolve('pino-pretty');
    return true;
  } catch {
    return false;
  }
}

/**
 * Cabecera de correlación por petición. `X-Request-Id` en minúsculas: Node
 * normaliza los nombres de cabecera al recibirlos.
 */
const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Un `req.id` por petición (TX-14).
 *
 * Sin `genReqId`, pino-http numera las peticiones con un contador de proceso:
 * se reinicia en cada deploy y se repite entre réplicas, así que el mismo
 * "3" de la pantalla puede señalar líneas de log distintas según a qué
 * instancia le tocó. Un UUID no colisiona nunca.
 *
 * El `x-request-id` que trae la petición **sólo** se respeta detrás de un
 * proxy de confianza (`TRUST_PROXY_HOPS > 0`, el mismo interruptor que ya usa
 * `main.ts` para `app.set('trust proxy', …)`): es nginx quien lo generó
 * (`$request_id`), nunca el navegador — aceptarlo sin ese resguardo dejaría
 * que cualquier cliente eligiera el id con el que se lo busca en el log. Sin
 * proxy de confianza, siempre se genera uno nuevo.
 *
 * El id se escribe en la respuesta acá mismo, no en un middleware aparte:
 * `genReqId` es lo primero que corre por petición y es donde `res` todavía
 * admite cabeceras nuevas sin que nada las haya cerrado.
 *
 * @param req - Petición entrante.
 * @param res - Respuesta en curso.
 * @returns El id de la petición: el heredado del proxy, o un UUID v4 nuevo.
 */
export function genReqId(req: IncomingMessage, res: ServerResponse): string {
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  const inbound = req.headers[REQUEST_ID_HEADER];
  const inboundId = Array.isArray(inbound) ? inbound[0] : inbound;
  const id = trustProxyHops > 0 && inboundId ? inboundId : randomUUID();
  res.setHeader('X-Request-Id', id);
  return id;
}

/** Opciones de pino derivadas del entorno validado. */
export function buildPinoOptions(): Params {
  const env = loadLoggingEnv();
  const usePretty = env.pretty && isPrettyAvailable();

  return {
    pinoHttp: {
      level: env.level,
      genReqId,
      redact: { paths: REDACT_PATHS, remove: true },
      serializers: { req: serializeRequest },

      // Correlación log ↔ traza. `mixin` se evalúa en CADA línea de log y añade
      // el contexto de traza activo en ese instante, de modo que buscar
      // `trace_id:"..."` en el agregador devuelve exactamente los logs de esa
      // operación —incluidos los de los workers, que comparten esta misma
      // configuración vía `LoggingModule`.
      //
      // El identificador procede SIEMPRE del contexto activo de OpenTelemetry,
      // nunca de una cabecera del cliente: un `trace_id` que el cliente pudiera
      // elegir sería falsificable y permitiría envenenar la correlación.
      //
      // Cuando no hay traza activa (arranque, telemetría deshabilitada) el
      // mixin devuelve `{}` y la línea sale exactamente como antes: `req.id`
      // sigue siendo la correlación disponible.
      mixin: () => currentTraceContext(),

      // Logging automático de peticiones HTTP con mensajes en español, para no
      // mezclar el inglés por defecto de pino-http con el resto de los logs.
      autoLogging: true,
      quietReqLogger: true,
      customReceivedMessage: () => 'petición recibida',
      customSuccessMessage: () => 'petición completada',
      customErrorMessage: () => 'petición fallida',

      // Transporte legible solo bajo demanda y solo si el paquete existe.
      ...(usePretty
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
          }
        : {}),
    },
  };
}
