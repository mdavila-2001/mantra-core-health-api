import type { TransactionContext } from './persistence-context';

/**
 * Gestor de transacciones, independiente del motor.
 *
 * Toda transacción de negocio resuelve por la ruta de escritura (§30). Que el
 * contrato no ofrezca forma alguna de elegir la conexión no es una carencia:
 * es la garantía de que un caso de uso no pueda abrir una transacción contra
 * una réplica de lectura por descuido.
 */
export interface TransactionManager {
  /**
   * Ejecuta `operation` dentro de una transacción.
   *
   * Confirma al terminar y revierte si `operation` lanza. El error se propaga
   * ya normalizado al vocabulario de `PersistenceError`.
   *
   * Las lecturas que ocurran dentro deben usar el mismo `TransactionContext`,
   * o leerán fuera de la transacción -y, si hay réplica, de un servidor que
   * todavía no ha visto nada de lo escrito aquí-.
   */
  execute<T>(
    operation: (transaction: TransactionContext) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T>;
}

/** Opciones de una transacción. */
export interface TransactionOptions {
  /**
   * Nivel de aislamiento. Se deja al del servidor por defecto
   * (`READ COMMITTED` en PostgreSQL); elevarlo a `serializable` obliga a
   * manejar `40001`, así que debe ser una decisión consciente del caso de uso.
   */
  readonly isolationLevel?:
    'read committed' | 'repeatable read' | 'serializable';
  /** Nombre lógico de la operación, para las métricas y las trazas. */
  readonly operation?: string;
}

/** Token de inyección del gestor de transacciones de escritura. */
export const TRANSACTION_MANAGER = Symbol('TRANSACTION_MANAGER');
