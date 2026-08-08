import { randomUUID } from 'node:crypto';
import {
  HttpException,
  Inject,
  Injectable,
  type OnModuleInit,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { firstValueFrom, type Observable } from 'rxjs';
import {
  Bulkhead,
  CircuitBreaker,
  TokenService,
  SEED,
  isTransientError,
  retry,
  type RetryPolicy,
} from '../common';
import { currentTick, remainingTickBudgetMs } from './tick-context';
import { WORKER_ENV } from './worker.tokens';
import type { WorkerEnv } from './worker.env';
import { workerHealth } from './worker-health.registry';

/**
 * Cliente HTTP del proceso worker hacia la propia API.
 *
 * Es la pieza central de la Fase 0: en vez de importar los `*Service` de cada
 * módulo de negocio en el proceso del worker (lo que se saltaría
 * `RolesGuard`/`TenantContextInterceptor`/`ValidationPipe` y exigiría
 * reexportar media aplicación), el worker es **un cliente autenticado más** —
 * exactamente como documentan los README de `vector_rag` y `time_series`
 * ("el worker es un cliente autenticado más"). Llama los mismos endpoints
 * `/internal/*` y `/workers/*` que ya existen, probados y protegidos.
 *
 * El token se firma en el momento (rol `SYSTEM`, que por diseño no es
 * asignable vía `iam.user_global_roles`: ver `RoleCode` en
 * `modules/iam/services/role-mapping.ts`) contra `SEED.systemWorkerUserId`,
 * la cuenta de servicio sembrada por `TerminologySeedService`. Firmar es una
 * operación HMAC pura (sin I/O), así que no vale la pena cachear el token
 * entre llamadas: cada request lleva uno recién emitido.
 *
 * ## Por qué este cliente lleva un kernel de resiliencia entero
 *
 * Este es el **único** punto de acoplamiento entre 20 procesos y la API, y
 * todos ellos dependen de que responda. Sin protección, una caída de la API de
 * un minuto se comporta así: 30 jobs × 20 procesos lanzan su llamada, cada una
 * espera los 30 s del plazo, y el `setInterval` del scheduler dispara la
 * siguiente sin esperar a la anterior. A los pocos segundos hay cientos de
 * sockets colgados por proceso, y cuando la API por fin vuelve, recibe de golpe
 * todo lo represado y se cae otra vez. Las cuatro capas atacan un eslabón
 * distinto de esa cadena:
 *
 *   - **Mamparo** — techo de llamadas en vuelo por proceso. Es lo que impide
 *     que la lentitud se traduzca en descriptores de fichero agotados.
 *   - **Cortacircuitos** — tras varios fallos deja de intentarlo y falla en
 *     microsegundos. Es lo que da a la API caída el respiro para levantarse.
 *   - **Reintento con jitter** — cura el fallo transitorio de verdad (un
 *     `ECONNRESET` durante un despliegue) sin sincronizar a los 20 workers en
 *     el mismo milisegundo.
 *   - **Plazo por llamada, recortado al presupuesto del tick** — no se lanza
 *     una llamada de 30 s cuando al tick le quedan 2.
 */
@Injectable()
export class SystemApiClient implements OnModuleInit {
  /**
   * Un solo cortacircuitos para toda la API, no uno por ruta. La dependencia
   * real es el proceso de la API, no cada endpoint: si `/internal/outbox` falla
   * por 502, `/internal/events` va a fallar igual, y repartir la evidencia
   * entre veinte circuitos haría que ninguno acumulara la suficiente para
   * abrirse.
   */
  private readonly circuit: CircuitBreaker;

  /** Techo de llamadas concurrentes de este proceso contra la API. */
  private readonly bulkhead: Bulkhead;

  private readonly retryPolicy: RetryPolicy;

  constructor(
    private readonly http: HttpService,
    private readonly tokenService: TokenService,
    private readonly logger: PinoLogger,
    @Inject(WORKER_ENV) private readonly env: WorkerEnv,
  ) {
    this.logger.setContext(SystemApiClient.name);

    this.circuit = new CircuitBreaker({
      operation: 'system-api',
      onStateChange: (change) => {
        // Las transiciones se registran a `warn` incluso la de cierre: durante
        // un incidente, "el circuito volvió a cerrar a las 03:14" es la línea
        // que fecha el fin de la degradación.
        this.logger.warn(
          {
            operation: change.operation,
            from: change.from,
            to: change.to,
            failureRate: change.failureRate,
            openForMs: change.openForMs,
          },
          `Cortacircuitos de la API: ${change.from} → ${change.to}`,
        );
      },
    });

    this.bulkhead = new Bulkhead({
      operation: 'system-api',
      maxConcurrent: this.env.httpMaxConcurrent,
      // Cola corta a propósito. Un tick que no consigue hueco enseguida es
      // preferible que falle y lo reintente el tick siguiente, a que se quede
      // esperando un turno que llegará cuando su trabajo ya no sea relevante.
      maxQueued: this.env.httpMaxConcurrent,
    });

    this.retryPolicy = {
      attempts: this.env.httpRetryAttempts,
      baseDelayMs: 250,
      maxDelayMs: 5_000,
      totalBudgetMs: this.env.httpTimeoutMs,
      onRetry: (info) => {
        this.logger.warn(
          {
            operation: info.operation,
            attempt: info.attempt,
            delayMs: info.delayMs,
            serverDirected: info.serverDirected,
            err: info.error,
          },
          'Reintentando llamada a la API',
        );
      },
    };
  }

  /** Publica el estado del circuito en la sonda de salud del proceso. */
  onModuleInit(): void {
    workerHealth.registerCircuit('system-api', () => this.circuit.snapshot());
  }

  private authHeader(): Record<string, string> {
    const token = this.tokenService.signAccessToken(
      SEED.systemWorkerUserId,
      randomUUID(),
      ['SYSTEM'],
    );
    return { Authorization: `Bearer ${token}` };
  }

  /** Identificador estable de este proceso, para `workerId`/`lockedBy`. */
  workerId(prefix: string): string {
    return `${prefix}:${process.pid}:${randomUUID().slice(0, 8)}`;
  }

  /**
   * `POST` protegido.
   *
   * **No se reintenta por defecto**, y esa asimetría con `get` es deliberada:
   * los endpoints `/internal/*` reclaman filas, publican eventos y despachan
   * mensajes. Un timeout de red no dice si el servidor ejecutó la operación o
   * no, así que reintentar a ciegas duplicaría envíos y cobros. Quien sepa que
   * su endpoint es idempotente —porque lleva `workerId` como clave de reclamo,
   * o una clave de idempotencia— lo declara con `idempotent: true`.
   */
  async post<T>(
    path: string,
    body: unknown = {},
    options: { idempotent?: boolean } = {},
  ): Promise<T> {
    return this.call<T>(
      `POST ${path}`,
      path,
      (config) => this.http.post<T>(path, body, config),
      options.idempotent === true,
    );
  }

  /** `GET` protegido. Reintentable: una lectura no tiene efectos laterales. */
  async get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    return this.call<T>(
      `GET ${path}`,
      path,
      (config) => this.http.get<T>(path, { ...config, params }),
      true,
    );
  }

  /** Estado del cortacircuitos; lo leen la sonda de salud y las pruebas. */
  circuitSnapshot(): ReturnType<CircuitBreaker['snapshot']> {
    return this.circuit.snapshot();
  }

  /**
   * Camino común de las dos verbos: mamparo → cortacircuitos → reintento →
   * llamada. El orden es el del kernel (`common/resilience/index.ts`) y no es
   * intercambiable: con el circuito por dentro del reintento, una escalera de
   * tres intentos consumiría tres rechazos del circuito en vez de abortar al
   * primero.
   */
  private async call<T>(
    operation: string,
    path: string,
    send: (config: AxiosRequestConfig) => Observable<AxiosResponse<T>>,
    idempotent: boolean,
  ): Promise<T> {
    const tick = currentTick();

    // La configuración se recalcula en cada intento, no una vez: el token
    // caducaría en un reintento tras un backoff largo, y el plazo debe reflejar
    // el presupuesto que le queda al tick *ahora*, no el que le quedaba al
    // empezar.
    const execute = async (): Promise<T> => {
      const response = await firstValueFrom(send(this.requestConfig()));
      return response.data;
    };

    try {
      return await this.bulkhead.execute(
        () =>
          this.circuit.execute(() =>
            idempotent
              ? retry(operation, execute, this.retryPolicy, tick?.signal)
              : execute(),
          ),
        tick?.signal,
      );
    } catch (error) {
      throw SystemApiClient.toWorkerError(path, error);
    }
  }

  /**
   * Configuración por llamada: cabeceras de autenticación y correlación, señal
   * de cancelación del tick y plazo recortado al presupuesto que le queda.
   */
  private requestConfig(): AxiosRequestConfig {
    const tick = currentTick();
    const remaining = remainingTickBudgetMs();

    // El plazo efectivo es el menor entre el configurado y lo que le queda al
    // tick. Sin este recorte, la última llamada de un tick a punto de vencer
    // pediría sus 30 s completos: el tick abortaría igual, pero dejando el
    // socket ocupado hasta que el servidor conteste a nadie.
    const timeout =
      remaining === undefined
        ? this.env.httpTimeoutMs
        : Math.max(1, Math.min(this.env.httpTimeoutMs, remaining));

    const headers: Record<string, string> = { ...this.authHeader() };
    if (tick) {
      // `traceparent` ya lo inyecta la instrumentación automática de
      // OpenTelemetry. Esto es lo otro: el identificador con el que pino
      // correlaciona la línea del worker con la de la API. Sin él, el log del
      // servidor numera la petición por su cuenta y las dos mitades del mismo
      // trabajo quedan sin hilo común.
      headers['x-request-id'] = tick.executionId;
      headers['x-worker-operation'] = tick.operation;
    }

    return { headers, timeout, signal: tick?.signal };
  }

  /**
   * Aplana el error de axios a algo que el logger estructurado del job puede
   * registrar sin volcar el objeto completo del cliente HTTP.
   *
   * Los errores del propio kernel (`CircuitOpenError`, `BulkheadFullError`,
   * `OperationTimeoutError`) ya son `HttpException` con su código estable y se
   * dejan pasar tal cual: reenvolverlos perdería el código y convertiría un
   * "circuito abierto" perfectamente diagnosticable en un 500 opaco.
   */
  private static toWorkerError(path: string, error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    if (error instanceof AxiosError) {
      const axiosError: AxiosError<unknown> = error;
      const status = axiosError.response?.status ?? 0;
      const body = axiosError.response?.data;
      return new HttpException(
        {
          path,
          status,
          body,
          // Distinguir "la API dijo que no" de "la API no dijo nada" es lo que
          // decide si el job puede reintentar sin arriesgar duplicados.
          transient: isTransientError(error),
        },
        status >= 400 ? status : 500,
      );
    }
    return new HttpException(
      { path, message: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
}
