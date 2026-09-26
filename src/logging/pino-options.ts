import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import { loadLoggingEnv } from './logging.env';
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
];

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
