import {
  type EventSubscriber,
  type FlushEventArgs,
  type ChangeSet,
  ChangeSetType,
  wrap,
} from '@mikro-orm/core';
import type { EntityManager as SqlEntityManager } from '@mikro-orm/postgresql';
import { AUD } from '../../modules/audit/audit.concepts';

/**
 * Columnas META estándar de toda tabla `audit.<x>_history` (generadas 1:1). El
 * ÚNICO campo restante que termina en `_id` es la referencia al agregado fuente
 * (`<x>_id`), lo que permite derivar el mapeo por metadata sin listar 113 tablas.
 */
const HISTORY_META_COLUMNS = new Set([
  'history_id',
  'revision_no',
  'row_version',
  'operation_concept_id',
  'valid_from',
  'valid_to',
  'data_snapshot',
  'changed_by_user_id',
  'change_reason_concept_id',
  'recorded_at',
]);

/**
 * Tablas fuente cuya historia se versiona de forma EXPLÍCITA y transaccional en el
 * servicio de dominio (fail-closed, con test). El mirror las omite para no
 * duplicar la revisión. El resto de agregados con `*_history` los cubre el mirror.
 */
const EXPLICITLY_WIRED_SOURCES = new Set([
  'medication_requests',
  'appointment_bookings',
]);

interface HistoryBinding {
  /** Tabla de historial cualificada, p. ej. `audit.conditions_history`. */
  historyTable: string;
  /** Columna que referencia el id del agregado fuente, p. ej. `condition_id`. */
  sourceIdColumn: string;
  /** Columna correlativa declarada por el DDL (`revision_no` o `row_version`). */
  versionColumn: 'revision_no' | 'row_version';
}

interface HistoryRegistryColumn {
  tableName: string;
  columnName: string;
}

/**
 * Espejo append-only de versionado (ALOVIDA §2: toda tabla `*_history` con un
 * consumidor/escritor verificable). En cada `flush`, por cada CREATE/UPDATE de un
 * agregado que tenga su tabla `audit.<tabla>_history`, cierra la revisión vigente
 * y sella una nueva con un snapshot del estado, DENTRO de la transacción del
 * cambio (SQL crudo → sin re-entrar en la unidad de trabajo del ORM).
 *
 * Es fail-closed por diseño: un fallo del espejo se registra y aborta la misma
 * transacción. PostgreSQL invalida una transacción después de cualquier error
 * SQL; ocultarlo dejaría al caller recibir después un fallo opaco y podría hacer
 * creer que la escritura de negocio quedó confirmada sin su historia.
 */
export class HistoryMirrorSubscriber implements EventSubscriber {
  /** Registro `tablaFuente -> binding`, derivado una vez del `information_schema`. */
  private registry: Map<string, HistoryBinding> | null = null;

  /**
   * Deriva el registro consultando `information_schema`: para cada tabla
   * `audit.*_history`, el campo fuente es el único `_id` que no es columna meta
   * estándar. Usa la verdad de la base (no la metadata del ORM), así que refleja
   * exactamente las tablas de historial existentes.
   */
  private async buildRegistry(
    em: SqlEntityManager,
  ): Promise<Map<string, HistoryBinding>> {
    const map = new Map<string, HistoryBinding>();
    const rawRows: unknown = await em.getConnection().execute(
      `SELECT table_name, column_name
         FROM information_schema.columns
        WHERE table_schema = 'audit' AND table_name LIKE '%\\_history'`,
    );
    const rows = this.parseRegistryColumns(rawRows);

    const byTable = new Map<string, string[]>();
    for (const r of rows) {
      const cols = byTable.get(r.tableName) ?? [];
      cols.push(r.columnName);
      byTable.set(r.tableName, cols);
    }
    for (const [tableName, cols] of byTable) {
      const sourceTable = tableName.slice(0, -'_history'.length);
      const versionColumn = cols.includes('revision_no')
        ? 'revision_no'
        : cols.includes('row_version')
          ? 'row_version'
          : undefined;
      const sourceIdColumn = cols.find(
        (c) => c.endsWith('_id') && !HISTORY_META_COLUMNS.has(c),
      );
      if (!sourceIdColumn || !versionColumn) continue;
      map.set(sourceTable, {
        historyTable: `audit."${tableName}"`,
        sourceIdColumn,
        versionColumn,
      });
    }
    if (process.env.HIST_DEBUG) {
      console.error(
        `[history-mirror][debug] registry=${map.size} sample=${[...map.keys()]
          .slice(0, 3)
          .join(',')}`,
      );
    }
    return map;
  }

  private parseRegistryColumns(value: unknown): HistoryRegistryColumn[] {
    if (!Array.isArray(value)) return [];
    return (value as unknown[]).flatMap((row) => {
      if (typeof row !== 'object' || row === null) return [];
      const record = row as Record<string, unknown>;
      return typeof record.table_name === 'string' &&
        typeof record.column_name === 'string'
        ? [
            {
              tableName: record.table_name,
              columnName: record.column_name,
            },
          ]
        : [];
    });
  }

  private formatSourceId(value: unknown): string {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'bigint'
    ) {
      return `${value}`;
    }
    return '<identificador-no-escalar>';
  }

  private operationConcept(type: ChangeSetType): string {
    return type === ChangeSetType.CREATE
      ? AUD.OPERATION_INSERT
      : AUD.OPERATION_UPDATE;
  }

  /**
   * Tras persistir los cambios (misma transacción del flush), sella la revisión de
   * cada agregado versionado creado o actualizado.
   */
  async afterFlush(args: FlushEventArgs): Promise<void> {
    const em = args.em as unknown as SqlEntityManager;
    if (this.registry === null) this.registry = await this.buildRegistry(em);
    if (this.registry.size === 0) return;

    const changeSets = args.uow
      .getChangeSets()
      .filter(
        (cs: ChangeSet<object>) =>
          cs.type === ChangeSetType.CREATE || cs.type === ChangeSetType.UPDATE,
      );

    for (const cs of changeSets) {
      const meta = cs.meta;
      // No versionar las propias tablas de auditoría/historial.
      if (meta.schema === 'audit') continue;
      const binding = this.registry.get(meta.tableName ?? '');
      if (!binding) continue;
      if (EXPLICITLY_WIRED_SOURCES.has(meta.tableName ?? '')) continue;

      const pk = meta.primaryKeys?.[0];
      const sourceId = pk
        ? (cs.entity as Record<string, unknown>)[pk]
        : undefined;
      if (!sourceId) continue;

      try {
        const snapshot = JSON.stringify(wrap(cs.entity).toObject());
        // Cierra la ventana de la revisión vigente (point-in-time).
        await em.execute(
          `UPDATE ${binding.historyTable} SET valid_to = now() ` +
            `WHERE "${binding.sourceIdColumn}" = ? AND valid_to IS NULL`,
          [sourceId],
        );
        // Sella la nueva revisión con nº correlativo atómico (MAX+1).
        await em.execute(
          `INSERT INTO ${binding.historyTable} ` +
            `(history_id, "${binding.sourceIdColumn}", "${binding.versionColumn}", operation_concept_id, valid_from, data_snapshot, recorded_at) ` +
            `SELECT gen_random_uuid(), ?, COALESCE(MAX("${binding.versionColumn}"), 0) + 1, ?, now(), ?::jsonb, now() ` +
            `FROM ${binding.historyTable} WHERE "${binding.sourceIdColumn}" = ?`,
          [sourceId, this.operationConcept(cs.type), snapshot, sourceId],
        );
      } catch (err) {
        console.error(
          `[history-mirror] fallo al versionar ${meta.tableName} ${this.formatSourceId(sourceId)}: ${(err as Error).message}`,
        );
        throw err;
      }
    }
  }
}
