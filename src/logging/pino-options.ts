import type { Params } from 'nestjs-pino';
import { loadLoggingEnv } from './logging.env';

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

/** Opciones de pino derivadas del entorno validado. */
export function buildPinoOptions(): Params {
  const env = loadLoggingEnv();
  const usePretty = env.pretty && isPrettyAvailable();

  return {
    pinoHttp: {
      level: env.level,
      redact: { paths: REDACT_PATHS, remove: true },

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
