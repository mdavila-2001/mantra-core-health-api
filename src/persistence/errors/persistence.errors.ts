/**
 * Errores normalizados de la capa de persistencia.
 *
 * Por qué existen: hoy un fallo de base de datos sube por la pila como un error
 * del driver `pg` -con `code`, `detail`, `schema`, `table` y `constraint`- o
 * como un `DriverException` de MikroORM. Ambos son tipos de infraestructura, así
 * que cualquier `catch` que quiera distinguir "clave duplicada" de "sin
 * privilegios" acaba comparando cadenas SQLSTATE dentro de un servicio de
 * negocio. Eso ata la capa de aplicación al motor: cambiar PostgreSQL por otro
 * adaptador obligaría a reescribir esos `catch`.
 *
 * Estas clases son el vocabulario estable. El adaptador traduce el error del
 * motor a uno de estos tipos y la aplicación razona solo sobre ellos.
 *
 * Deliberadamente NO heredan de las excepciones HTTP de `src/common/errors`:
 * la persistencia no sabe qué código de estado merece un conflicto de
 * concurrencia -depende del caso de uso-, y hacer que lo supiera metería una
 * dependencia de la capa de interfaces dentro de la de infraestructura, que es
 * justo la dirección que el §4 del plan prohíbe.
 */

/** Contexto sanitizado que acompaña a un error de persistencia. */
export interface PersistenceErrorContext {
  /** Nombre lógico de la conexión implicada (`postgres-read`, `postgres-write`). */
  readonly connectionName?: string;
  /** Motor que produjo el error (`postgresql`, `mongodb`, ...). */
  readonly engine?: string;
  /** Operación lógica en curso, para correlacionar con las métricas. */
  readonly operation?: string;
  /**
   * Código nativo del motor (SQLSTATE en PostgreSQL).
   *
   * Se conserva porque es diagnóstico puro y no contiene datos del negocio: un
   * `23505` no revela ninguna fila. Lo que NO se conserva aquí es `detail`, que
   * en PostgreSQL sí incluye los valores de la clave duplicada -y esos valores
   * pueden ser un correo, un documento de identidad o un número de historia.
   */
  readonly code?: string;
  /** Restricción implicada, cuando el motor la identifica. */
  readonly constraint?: string;
}

/** Raíz de la jerarquía. Todo fallo de la capa de datos es un `PersistenceError`. */
export class PersistenceError extends Error {
  /** Contexto sanitizado, apto para registrar sin filtrar datos sensibles. */
  readonly context: PersistenceErrorContext;

  constructor(
    message: string,
    context: PersistenceErrorContext = {},
    options?: { cause?: unknown },
  ) {
    // `cause` viaja en las opciones del Error nativo: conserva la traza técnica
    // para la observabilidad interna sin exponerla en el mensaje.
    super(message, options as ErrorOptions);
    this.name = new.target.name;
    this.context = context;
    // Sin esto, `instanceof` falla cuando el objetivo de compilación es ES5 y
    // TypeScript rompe la cadena de prototipos al extender clases nativas.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** La conexión no está disponible: servidor caído, red rota o pool agotado. */
export class ConnectionUnavailableError extends PersistenceError {}

/** La entidad solicitada no existe. */
export class EntityNotFoundError extends PersistenceError {}

/** Violación de unicidad. */
export class DuplicateEntityError extends PersistenceError {}

/** Violación de clave foránea. */
export class ForeignKeyConflictError extends PersistenceError {}

/** Violación de `NOT NULL`. */
export class RequiredFieldError extends PersistenceError {}

/** Conflicto de concurrencia optimista o de serialización. */
export class ConcurrencyConflictError extends PersistenceError {}

/** Interbloqueo detectado y abortado por el motor. */
export class DeadlockDetectedError extends ConcurrencyConflictError {}

/** La transacción no pudo completarse. */
export class TransactionFailedError extends PersistenceError {}

/** La consulta excedió el plazo concedido. */
export class QueryTimeoutError extends PersistenceError {}

/**
 * El rol carece de privilegios para la operación.
 *
 * Es el error que debe producirse cuando el rol lector intenta escribir. Que
 * exista como tipo propio no es cosmético: es lo que permite a la prueba de
 * privilegios (§54) afirmar que el mínimo privilegio se aplica de verdad, en
 * vez de comprobar los `GRANT` del catálogo, que solo describen la intención.
 */
export class InsufficientPrivilegeError extends PersistenceError {}

/**
 * La ruta exige una capacidad que el adaptador resuelto no ofrece.
 *
 * Se lanza en el arranque -no en la primera petición- cuando el enrutado pide
 * transacciones a un motor que no las tiene. Fallar tarde aquí significaría
 * descubrir en producción que una operación que se creía atómica nunca lo fue.
 */
export class UnsupportedCapabilityError extends PersistenceError {}

/** La configuración de fuentes de datos es inválida. Aborta el arranque. */
export class DataSourceConfigurationError extends PersistenceError {}
