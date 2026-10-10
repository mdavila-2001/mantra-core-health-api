import { jest } from '@jest/globals';
import { ChangeSetType, type FlushEventArgs } from '@mikro-orm/core';
import { runWithAuditRequestContext } from '../../common/audit-trail';
import { HistoryMirrorSubscriber } from './history-mirror.subscriber';

const ACTOR = '11111111-1111-4111-8111-111111111111';
const SOURCE = '22222222-2222-4222-8222-222222222222';

/** Entidad mínima: `wrap(entity).toObject()` es lo único que el espejo lee. */
class FakeEntity {
  constructor(readonly id: string) {}
  toObject(): Record<string, unknown> {
    return { id: this.id };
  }
}

interface SourceTable {
  schema: string;
  table: string;
}

/**
 * Filas del catálogo como las devuelve la consulta del registro: cada columna de
 * `audit.<x>_history`, y para la columna fuente, la tabla a la que apunta su FK
 * (en el modelo, `SQL/10_audit/90_fk_deferred.sql`).
 */
function historyCatalogRows(historyOf: SourceTable) {
  const historyTable = `${historyOf.table}_history`;
  const sourceIdColumn = `${historyOf.table}_id`;
  return [
    { table_name: historyTable, column_name: 'history_id' },
    { table_name: historyTable, column_name: 'revision_no' },
    {
      table_name: historyTable,
      column_name: sourceIdColumn,
      source_schema: historyOf.schema,
      source_table: historyOf.table,
    },
  ];
}

function flushArgs(changed: SourceTable, historyOf: SourceTable = changed) {
  const inserts: unknown[][] = [];
  const em = {
    getConnection: () => ({
      execute: jest.fn(async () => historyCatalogRows(historyOf)),
    }),
    execute: jest.fn(async (sql: string, params: unknown[]) => {
      if (sql.startsWith('INSERT')) inserts.push(params);
      return [];
    }),
  };
  const uow = {
    getChangeSets: () => [
      {
        type: ChangeSetType.UPDATE,
        meta: {
          schema: changed.schema,
          tableName: changed.table,
          primaryKeys: ['id'],
        },
        entity: new FakeEntity(SOURCE),
      },
    ],
  };
  return { args: { em, uow } as unknown as FlushEventArgs, inserts };
}

const ALLERGIES = { schema: 'clinical', table: 'allergy_intolerances' };

describe('HistoryMirrorSubscriber', () => {
  it('sella la revisión con el actor de la petición como changed_by_user_id', async () => {
    const { args, inserts } = flushArgs(ALLERGIES);
    await runWithAuditRequestContext(
      { actorUserId: ACTOR, sealedSuccess: false, sealedFailure: false },
      () => new HistoryMirrorSubscriber().afterFlush(args),
    );
    expect(inserts).toHaveLength(1);
    expect(inserts[0][3]).toBe(ACTOR);
  });

  it('fuera de una petición (worker, seed) deja changed_by_user_id en NULL', async () => {
    const { args, inserts } = flushArgs(ALLERGIES);
    await new HistoryMirrorSubscriber().afterFlush(args);
    expect(inserts[0][3]).toBeNull();
  });

  it('no duplica la historia que ConditionsService ya versiona', async () => {
    const { args, inserts } = flushArgs({
      schema: 'clinical',
      table: 'conditions',
    });
    await new HistoryMirrorSubscriber().afterFlush(args);
    expect(inserts).toEqual([]);
  });

  describe('tablas homónimas: resuelve por schema.tabla, no por nombre', () => {
    // `audit.groups_history.groups_id` apunta a `community.groups`
    // (fk_groups_history_groups_id); `medical_groups.groups` no tiene historial.
    const COMMUNITY_GROUPS = { schema: 'community', table: 'groups' };
    // `audit.segments_history.segments_id` apunta a `accounting.segments`;
    // `marketing.segments` no tiene historial.
    const ACCOUNTING_SEGMENTS = { schema: 'accounting', table: 'segments' };

    it('no versiona medical_groups.groups en audit.groups_history', async () => {
      const { args, inserts } = flushArgs(
        { schema: 'medical_groups', table: 'groups' },
        COMMUNITY_GROUPS,
      );
      await new HistoryMirrorSubscriber().afterFlush(args);
      expect(inserts).toEqual([]);
    });

    it('no versiona marketing.segments en audit.segments_history', async () => {
      const { args, inserts } = flushArgs(
        { schema: 'marketing', table: 'segments' },
        ACCOUNTING_SEGMENTS,
      );
      await new HistoryMirrorSubscriber().afterFlush(args);
      expect(inserts).toEqual([]);
    });

    it('sigue versionando community.groups, dueña de la FK', async () => {
      const { args, inserts } = flushArgs(COMMUNITY_GROUPS);
      await new HistoryMirrorSubscriber().afterFlush(args);
      expect(inserts).toHaveLength(1);
    });

    it('sigue versionando accounting.segments, dueña de la FK', async () => {
      const { args, inserts } = flushArgs(ACCOUNTING_SEGMENTS);
      await new HistoryMirrorSubscriber().afterFlush(args);
      expect(inserts).toHaveLength(1);
    });
  });
});
