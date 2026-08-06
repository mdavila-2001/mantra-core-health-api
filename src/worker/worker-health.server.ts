import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import type { PinoLogger } from 'nestjs-pino';
import { workerHealth } from './worker-health.registry';

/**
 * Sonda HTTP mínima de un proceso worker.
 *
 * Los 20 workers son procesos sin servidor: `NestFactory.createApplicationContext`
 * no abre ningún puerto. Eso los dejaba fuera del único mecanismo que un
 * orquestador entiende para decidir si un contenedor está sano —una petición
 * HTTP—, así que Docker y Kubernetes sólo podían comprobar que el PID existía.
 * Un worker con el tick colgado pasa esa comprobación indefinidamente: `Up 6
 * hours`, cero trabajo hecho.
 *
 * Se implementa con `node:http` y no con NestJS a propósito. Levantar un
 * `NestFactory.create` por worker sólo para tres rutas metería el pipeline HTTP
 * entero (guards, pipes, filtros) en un proceso que no atiende tráfico de
 * negocio, y ampliaría su superficie de ataque por la puerta de atrás. Son
 * ~60 líneas sin dependencias, y no exponen ningún dato de negocio.
 *
 * Rutas:
 *   - `GET /health`, `GET /liveness` → 200 / 503. **¿Reiniciar el proceso?**
 *   - `GET /readiness`              → 200 / 503. **¿Puede trabajar ahora?**
 *   - `GET /status`                 → 200 siempre. Diagnóstico completo.
 */

/** Cabeceras comunes: nada cacheable, nada adivinable por tipo. */
const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
} as const;

export interface WorkerHealthServerOptions {
  /** Puerto de escucha. `0` deshabilita el servidor. */
  port: number;
  /** Interfaz de escucha. Por defecto todas, para que Docker pueda sondear. */
  host?: string;
  logger: PinoLogger;
}

/**
 * Arranca la sonda. **Nunca lanza**: un puerto ocupado no debe impedir que el
 * worker haga su trabajo. Ejecutar dos workers en la misma máquina fuera de
 * Docker es el caso normal en desarrollo, y ahí el segundo encontraría el
 * puerto tomado; abortar el arranque por eso convertiría una comodidad de
 * observación en un fallo de disponibilidad. Se registra un aviso explícito
 * —no un silencio— y el proceso continúa sin sonda.
 */
export function startWorkerHealthServer(
  options: WorkerHealthServerOptions,
): Server | undefined {
  if (!Number.isFinite(options.port) || options.port <= 0) {
    options.logger.info(
      'Sonda HTTP del worker deshabilitada (WORKER_HEALTH_PORT=0)',
    );
    return undefined;
  }

  const server = createServer(handleHealthRequest);

  // Un error del socket de la sonda no puede tumbar el worker. Sin este
  // manejador, un `EADDRINUSE` se propaga como excepción no capturada y mata el
  // proceso — la sonda de salud sería la causa de la caída que debía detectar.
  server.on('error', (error: NodeJS.ErrnoException) => {
    options.logger.warn(
      { err: error, port: options.port },
      error.code === 'EADDRINUSE'
        ? 'Puerto de la sonda del worker ocupado: el worker sigue sin sonda HTTP'
        : 'Fallo en la sonda HTTP del worker: el worker sigue sin sonda',
    );
  });

  // Plazos explícitos: un cliente que abre la conexión y no manda nada no debe
  // poder retener un descriptor de fichero indefinidamente.
  server.headersTimeout = 10_000;
  server.requestTimeout = 15_000;
  server.keepAliveTimeout = 5_000;

  server.listen(options.port, options.host ?? '0.0.0.0', () => {
    options.logger.info(
      { port: options.port },
      'Sonda HTTP del worker escuchando (/health, /readiness, /status)',
    );
  });

  // No mantiene vivo el event loop: si el worker termina su trabajo y no queda
  // nada más pendiente, la sonda no debe ser el motivo de que el proceso siga.
  server.unref();

  return server;
}

/**
 * Enrutado de la sonda. Se exporta aparte del servidor para poder probar la
 * política —qué ruta devuelve qué estado— sin abrir un puerto: una prueba que
 * compite por un puerto fijo es una prueba que falla en integración continua
 * por motivos que no tienen nada que ver con lo que comprueba.
 */
export function handleHealthRequest(
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
): void {
  const path = (request.url ?? '/').split('?')[0];

  if (request.method !== 'GET') {
    response.writeHead(405, { ...JSON_HEADERS, allow: 'GET' });
    response.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }

  switch (path) {
    case '/health':
    case '/liveness': {
      const probe = workerHealth.liveness();
      writeJson(response, probe.healthy ? 200 : 503, {
        status: probe.healthy ? 'ok' : 'error',
        reasons: probe.reasons,
      });
      return;
    }
    case '/readiness': {
      const probe = workerHealth.readiness();
      writeJson(response, probe.healthy ? 200 : 503, {
        status: probe.healthy ? 'ok' : 'error',
        reasons: probe.reasons,
      });
      return;
    }
    case '/status':
      writeJson(response, 200, workerHealth.snapshot());
      return;
    default:
      writeJson(response, 404, { error: 'not_found' });
  }
}

/** Cierra la sonda sin propagar errores; se llama durante el apagado. */
export function stopWorkerHealthServer(server?: Server): Promise<void> {
  if (!server) return Promise.resolve();
  return new Promise<void>((resolve) => {
    server.close(() => resolve());
    // `close` sólo deja de aceptar conexiones nuevas; las abiertas con
    // keep-alive seguirían impidiendo el cierre. Se cortan explícitamente.
    server.closeAllConnections?.();
  });
}

function writeJson(
  response: ServerResponse<IncomingMessage>,
  status: number,
  body: unknown,
): void {
  response.writeHead(status, JSON_HEADERS);
  response.end(JSON.stringify(body));
}
