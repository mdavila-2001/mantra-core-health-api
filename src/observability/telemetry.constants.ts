/**
 * Constantes compartidas por toda la capa de trazas distribuidas.
 *
 * Un único lugar fija los nombres de atributo, el prefijo de los servicios y la
 * lista de rutas excluidas, de modo que el bootstrap, el módulo de NestJS y las
 * pruebas hablen del mismo vocabulario y un cambio de convención sea un cambio
 * de una línea. Ver `docs/observability/01-architecture-design.md` §D4/§D5.
 */

/** Prefijo de producto para `service.name`. Ver convención `<producto>-<componente>`. */
export const SERVICE_PREFIX = 'redesa';

/** Namespace lógico bajo el que se agrupan los 21 servicios en la UI de trazas. */
export const DEFAULT_SERVICE_NAMESPACE = 'redesa';

/**
 * Nombre del tracer con el que se emiten los spans manuales del backend.
 *
 * Es el "instrumentation scope" que aparece en Jaeger: permite distinguir de un
 * vistazo un span creado por el código de negocio de uno creado por una
 * instrumentación automática (`@opentelemetry/instrumentation-pg`, etc.).
 */
export const TRACER_NAME = 'redesa-health-api';

/**
 * Token de inyección de la configuración de telemetría ya validada.
 *
 * Existe para que los proveedores de NestJS (interceptor, servicios) lean la
 * configuración por inyección en vez de tocar `process.env` cada uno por su
 * cuenta — la regla del proyecto sobre variables de entorno dispersas.
 */
export const TELEMETRY_CONFIG = Symbol('TELEMETRY_CONFIG');

/**
 * Cabecera de respuesta con el identificador de traza.
 *
 * Es el puente entre un usuario que reporta un fallo y la traza que lo explica:
 * soporte pide este valor y lo pega en el buscador de Jaeger. No sustituye al
 * `correlationId` del cuerpo de error (que sigue apuntando a la línea de log),
 * lo complementa.
 */
export const TRACE_ID_HEADER = 'x-trace-id';

/**
 * Clave reservada donde viaja el contexto de traza dentro del payload de un
 * evento de dominio.
 *
 * Se usa una clave del payload y no una columna nueva porque el esquema SQL
 * canónico (`database/**`) no se modifica desde el código — ver el protocolo de
 * 4 capas del proyecto. Un mensaje antiguo sin esta clave se procesa igual.
 */
export const TRACE_CARRIER_KEY = '_trace';

/**
 * Atributos propios del dominio. Namespace `app.*` para no colisionar nunca con
 * las convenciones semánticas de OpenTelemetry, que evolucionan por su cuenta.
 *
 * Los marcados como "alta cardinalidad" solo pueden usarse como **atributo**,
 * jamás como parte del nombre de un span.
 */
export const APP_ATTR = {
  /** Módulo de dominio (`iam`, `messaging`, …). Baja cardinalidad. */
  MODULE: 'app.module',
  /** Acción de negocio ejecutada. Baja cardinalidad. */
  OPERATION: 'app.operation',
  /** Tenant sobre el que opera la petición. Cardinalidad media. */
  TENANT_ID: 'app.tenant.id',
  /** Tipo de entidad afectada. Baja cardinalidad. */
  ENTITY_TYPE: 'app.entity.type',
  /** Identificador de la entidad. Alta cardinalidad, permitida. */
  ENTITY_ID: 'app.entity.id',
  /** Nombre del job programado. Baja cardinalidad. */
  JOB_NAME: 'app.job.name',
  /** Número de intento del job o del mensaje. Baja cardinalidad. */
  JOB_ATTEMPT: 'app.job.attempt',
  /** Identificador de una ejecución concreta del job. Alta cardinalidad. */
  JOB_EXECUTION_ID: 'app.job.execution.id',
  /** Periodicidad declarada del job. Baja cardinalidad. */
  JOB_SCHEDULE: 'app.job.schedule',
  /** Tipo de evento de dominio publicado o consumido. Baja cardinalidad. */
  EVENT_TYPE: 'app.event.type',
  /** `domainEventId`. Alta cardinalidad, permitida. */
  EVENT_ID: 'app.event.id',
  /** Tamaño del lote procesado. Baja cardinalidad. */
  RESULT_COUNT: 'app.result.count',
  /** Código estable del modelo de error (`ErrorCode`). Baja cardinalidad. */
  ERROR_CODE: 'app.error.code',
} as const;

/**
 * Rutas HTTP que no generan traza.
 *
 * Son peticiones de infraestructura, no de negocio: `/health` lo ejecuta el
 * healthcheck de Docker cada 10 s en 21 contenedores, y Swagger/Scalar sirven
 * documentación estática. Sin esta lista, la mayor parte del volumen exportado
 * sería ruido que además desplaza trazas útiles del muestreo.
 *
 * Incluye rutas que hoy no existen (`/metrics`, `/ready`, …) de forma
 * deliberada: si mañana se incorpora `@nestjs/terminus`, no reintroducen ruido.
 */
export const EXCLUDED_HTTP_PATHS: readonly string[] = [
  '/health',
  '/healthz',
  '/ready',
  '/readiness',
  '/liveness',
  '/metrics',
  '/favicon.ico',
  '/docs',
  '/docs-json',
  '/reference',
];
