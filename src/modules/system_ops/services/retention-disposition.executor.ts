import type { EntityManager } from '@mikro-orm/postgresql';

/** Disposición que una política de retención aplica a una fila vencida. */
export type RetentionDisposition = 'DELETE' | 'ANONYMIZE' | 'ARCHIVE';

/** Fila vencida de una entidad de negocio: sólo su identidad, nunca su contenido. */
export interface ExpiredRecord {
  /** Identificador de la fila objetivo; es el `recordId` de su revisión y el objetivo de un legal hold. */
  readonly id: string;
}

/** Qué filas vencidas pide el barrido. */
export interface ExpiredRecordQuery {
  /** Esquema de la entidad registrada. */
  readonly schemaName: string;
  /** Tabla de la entidad registrada. */
  readonly tableName: string;
  /** Filas anteriores a esta fecha ya cumplieron el plazo de retención. */
  readonly cutoff: Date;
  /** Tope de filas. El barrido pide `limit + 1` para saber si queda más. */
  readonly limit: number;
  /** Sólo filas con `id` mayor que este cursor (orden ascendente por `id`). */
  readonly afterId?: string;
  /**
   * Tenant al que se acota el barrido. `undefined` únicamente cuando el actor
   * es `SYSTEM` global; un administrador de tenant nunca barre otros tenants.
   */
  readonly tenantId?: string;
}

/**
 * Adaptador de disposición de una entidad registrada. El barrido genérico no
 * conoce las tablas de negocio: cada entidad cuya retención se ejecute aporta
 * uno, que selecciona filas vencidas de forma paginada y aplica la disposición
 * dentro de la transacción del lote.
 */
export interface RetentionDispositionExecutor {
  /** `true` si este adaptador sabe disponer filas de esa entidad. */
  supports(schemaName: string, tableName: string): boolean;

  /**
   * Filas vencidas, ordenadas por `id` ascendente, con `id > afterId` y acotadas
   * por `tenantId` cuando viene. Devuelve a lo sumo `query.limit` filas.
   */
  selectExpired(
    tx: EntityManager,
    query: ExpiredRecordQuery,
  ): Promise<readonly ExpiredRecord[]>;

  /** Aplica la disposición a una fila, en la transacción del lote. */
  dispose(
    tx: EntityManager,
    disposition: RetentionDisposition,
    record: ExpiredRecord,
  ): Promise<void>;
}

/** Token de inyección de los adaptadores de disposición (multi-provider). */
export const RETENTION_DISPOSITION_EXECUTORS = Symbol(
  'RETENTION_DISPOSITION_EXECUTORS',
);
