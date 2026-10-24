import {
  type EventSubscriber,
  type FlushEventArgs,
  type ChangeSet,
  ChangeSetType,
  wrap,
} from '@mikro-orm/core';
import type { EntityManager as SqlEntityManager } from '@mikro-orm/postgresql';
import { AUD } from '../../modules/audit/audit.concepts';
import { getAuditRequestContext, isUuid } from '../../common/audit-trail';

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
 * Tablas fuente (`schema.tabla`) cuya historia se versiona de forma EXPLÍCITA y
 * transaccional en el servicio de dominio (fail-closed, con test). El mirror las
 * omite para no duplicar la revisión. El resto de agregados con `*_history` los
 * cubre el mirror.
 */
const EXPLICITLY_WIRED_SOURCES = new Set([
  'clinical.medication_requests',
  'scheduling.appointment_bookings',
  // `ConditionsService` versiona sus tres mutaciones (`create`,
  // `changeClinicalStatus`, `verify`) con `HistoryRepository.append`, y es el
  // único servicio que escribe `clinical.conditions`. Sin esta entrada cada
  // cambio dejaba DOS revisiones (la del servicio y la del espejo).
  'clinical.conditions',
]);

/**
 * Columnas de `audit.*_history` y, cuando la columna tiene una FK de una sola
 * columna, la tabla a la que apunta. La FK de la columna fuente es la única
 * forma de saber el schema del agregado: el nombre `groups_history` no distingue
 * `community.groups` de `medical_groups.groups`.
 */
const HISTORY_CATALOG_SQL = `
  SELECT c.relname   AS table_name,
         a.attname   AS column_name,
         sn.nspname  AS source_schema,
         s.relname   AS source_table
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c      ON c.oid = a.attrelid
    JOIN pg_catalog.pg_namespace n  ON n.oid = c.relnamespace
    LEFT JOIN pg_catalog.pg_constraint fk
           ON fk.conrelid = c.oid AND fk.contype = 'f' AND fk.conkey = ARRAY[a.attnum]
    LEFT JOIN pg_catalog.pg_class s      ON s.oid = fk.confrelid
    LEFT JOIN pg_catalog.pg_namespace sn ON sn.oid = s.relnamespace
   WHERE n.nspname = 'audit'
     AND c.relkind IN ('r', 'p')
     AND c.relname LIKE '%\\_history'
     AND a.attnum > 0
     AND NOT a.attisdropped`;

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
  /** `schema.tabla` a la que apunta la FK de la columna, si tiene una. */
  references?: string;
}

/** Clave del registro: tabla fuente cualificada, como la declara el modelo. */
function qualifiedTable(
  schema: string | undefined,
  table: string | undefined,
): string {
  return `${schema ?? ''}.${table ?? ''}`;
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
   * Deriva el registro del catálogo de Postgres: para cada tabla
   * `audit.*_history`, el campo fuente es el único `_id` que no es columna meta
   * estándar, y la tabla fuente es la que apunta SU FK — nunca el nombre sin el
   * sufijo, que choca entre schemas (`groups`, `segments`). Usa la verdad de la
   * base (no la metadata del ORM), así que refleja exactamente las tablas de
   * historial existentes.
   */
  private async buildRegistry(
    em: SqlEntityManager,
  ): Promise<Map<string, HistoryBinding>> {
    const rawRows: unknown = await em
      .getConnection()
      .execute(HISTORY_CATALOG_SQL);
    const byTable = new Map<string, HistoryRegistryColumn[]>();
    for (const column of this.parseRegistryColumns(rawRows)) {
      const columns = byTable.get(column.tableName) ?? [];
      columns.push(column);
      byTable.set(column.tableName, columns);
    }

    const map = new Map<string, HistoryBinding>();
    for (const [tableName, columns] of byTable) {
      const resolved = this.bindingFor(tableName, columns);
      if (resolved) map.set(resolved.sourceTable, resolved.binding);
    }
    return map;
  }

  private bindingFor(
    tableName: string,
    columns: HistoryRegistryColumn[],
  ): { sourceTable: string; binding: HistoryBinding } | undefined {
    const names = new Set(columns.map((c) => c.columnName));
    const versionColumn = names.has('revision_no')
      ? 'revision_no'
      : names.has('row_version')
        ? 'row_version'
        : undefined;
    const sourceIdColumn = [...names].find(
      (c) => c.endsWith('_id') && !HISTORY_META_COLUMNS.has(c),
    );
    if (!sourceIdColumn || !versionColumn) return undefined;

    const targets = new Set(
      columns
        .filter((c) => c.columnName === sourceIdColumn && c.references)
        .map((c) => c.references as string),
    );
    if (targets.size !== 1) {
      // Sin una FK única no se sabe de qué schema es el agregado; adivinarlo por
      // nombre es lo que hacía chocar a las homónimas. Se dice y no se versiona.
      console.error(
        `[history-mirror] audit.${tableName}: la columna ${sourceIdColumn} no tiene una FK única a su tabla fuente (${targets.size}); no se versionará`,
      );
      return undefined;
    }
    return {
      sourceTable: [...targets][0],
      binding: {
        historyTable: `audit."${tableName}"`,
        sourceIdColumn,
        versionColumn,
      },
    };
  }

  private parseRegistryColumns(value: unknown): HistoryRegistryColumn[] {
    if (!Array.isArray(value)) return [];
    return (value as unknown[]).flatMap((row) => {
      if (typeof row !== 'object' || row === null) return [];
      const record = row as Record<string, unknown>;
      if (
        typeof record.table_name !== 'string' ||
        typeof record.column_name !== 'string'
      ) {
        return [];
      }
      const references =
        typeof record.source_schema === 'string' &&
        typeof record.source_table === 'string'
          ? qualifiedTable(record.source_schema, record.source_table)
          : undefined;
      return [
        {
          tableName: record.table_name,
          columnName: record.column_name,
          references,
        },
      ];
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

  /** Actor de la petición en curso, o `null` fuera de una (workers, seeds). */
  private changedByUserId(): string | null {
    const actorUserId = getAuditRequestContext()?.actorUserId;
    return isUuid(actorUserId) ? actorUserId : null;
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
      const sourceTable = qualifiedTable(meta.schema, meta.tableName);
      const binding = this.registry.get(sourceTable);
      if (!binding) continue;
      if (EXPLICITLY_WIRED_SOURCES.has(sourceTable)) continue;

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
        // Sella la nueva revisión con nº correlativo atómico (MAX+1). El autor
        // sale del contexto de bitácora de la petición: sin él, toda revisión
        // del espejo quedaba con `changed_by_user_id` NULL.
        await em.execute(
          `INSERT INTO ${binding.historyTable} ` +
            `(history_id, "${binding.sourceIdColumn}", "${binding.versionColumn}", operation_concept_id, valid_from, data_snapshot, changed_by_user_id, recorded_at) ` +
            `SELECT gen_random_uuid(), ?, COALESCE(MAX("${binding.versionColumn}"), 0) + 1, ?, now(), ?::jsonb, ?, now() ` +
            `FROM ${binding.historyTable} WHERE "${binding.sourceIdColumn}" = ?`,
          [
            sourceId,
            this.operationConcept(cs.type),
            snapshot,
            this.changedByUserId(),
            sourceId,
          ],
        );
      } catch (err) {
        console.error(
          `[history-mirror] fallo al versionar ${sourceTable} ${this.formatSourceId(sourceId)}: ${(err as Error).message}`,
        );
        throw err;
      }
    }
  }
}
