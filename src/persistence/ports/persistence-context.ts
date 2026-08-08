/**
 * Contextos que viajan con cada operación de persistencia.
 *
 * Son el sustituto tipado del `EntityManager` que hoy recorre la firma de los
 * 412 repositorios. La diferencia importa: `EntityManager` es una clase de
 * MikroORM -al pasarla, la capa de aplicación queda atada al ORM-, mientras que
 * esto es una estructura de datos que cualquier adaptador puede interpretar a
 * su manera. El adaptador de PostgreSQL resuelve `transaction` a un
 * `EntityManager` transaccional; uno de Mongo resolvería a una sesión.
 */

/**
 * Identificador opaco de una transacción en curso, propiedad del adaptador.
 *
 * El campo marca de qué motor procede la transacción. Lo consulta
 * `unwrapTransaction` para decidir si sabe desenvolverla: un puerto puede
 * recibir una transacción abierta por otro adaptador, y entonces lo correcto es
 * operar fuera de ella, no romper.
 */
export interface TransactionContext {
  /** Motor propietario de la transacción (`postgres`, `mongo`, ...). */
  readonly __transaction: string;
}

/** Nivel de consistencia que exige una lectura. */
export type ConsistencyLevel =
  /** La lectura debe ver la última escritura confirmada. Resuelve al primario. */
  | 'strong'
  /** Se acepta retraso de réplica. Resuelve a la ruta de lectura. */
  | 'eventual'
  /**
   * El actor debe ver sus propias escrituras recientes. Resuelve al primario
   * aunque exista réplica: es el caso de "reservo una cita y acto seguido pido
   * mi agenda", donde leer de una réplica con retraso muestra una agenda sin la
   * cita que el usuario acaba de crear.
   */
  | 'read-after-write';

/** Contexto de una lectura. */
export interface ReadContext {
  /** Transacción activa. Si la hay, la lectura ocurre dentro de ella. */
  readonly transaction?: TransactionContext;
  /** Consistencia exigida. Por defecto `eventual`. */
  readonly consistency?: ConsistencyLevel;
  /** Tenant activo, cuando no se toma del contexto asíncrono. */
  readonly tenantId?: string;
}

/** Contexto de una escritura. */
export interface WriteContext {
  /** Transacción activa. Toda escritura de negocio debería tener una. */
  readonly transaction?: TransactionContext;
  /** Tenant activo, cuando no se toma del contexto asíncrono. */
  readonly tenantId?: string;
  /** Actor que origina la escritura, para las columnas de auditoría. */
  readonly actorUserId?: string;
}
