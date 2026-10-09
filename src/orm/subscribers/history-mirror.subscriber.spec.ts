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

function flushArgs(tableName: string) {
  const inserts: unknown[][] = [];
  const em = {
    getConnection: () => ({
      execute: jest.fn(async () => [
        { table_name: `${tableName}_history`, column_name: 'history_id' },
        { table_name: `${tableName}_history`, column_name: 'revision_no' },
        { table_name: `${tableName}_history`, column_name: 'source_id' },
      ]),
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
        meta: { schema: 'clinical', tableName, primaryKeys: ['id'] },
        entity: new FakeEntity(SOURCE),
      },
    ],
  };
  return { args: { em, uow } as unknown as FlushEventArgs, inserts };
}

describe('HistoryMirrorSubscriber', () => {
  it('sella la revisión con el actor de la petición como changed_by_user_id', async () => {
    const { args, inserts } = flushArgs('allergy_intolerances');
    await runWithAuditRequestContext(
      { actorUserId: ACTOR, sealedSuccess: false, sealedFailure: false },
      () => new HistoryMirrorSubscriber().afterFlush(args),
    );
    expect(inserts).toHaveLength(1);
    expect(inserts[0][3]).toBe(ACTOR);
  });

  it('fuera de una petición (worker, seed) deja changed_by_user_id en NULL', async () => {
    const { args, inserts } = flushArgs('allergy_intolerances');
    await new HistoryMirrorSubscriber().afterFlush(args);
    expect(inserts[0][3]).toBeNull();
  });

  it('no duplica la historia que ConditionsService ya versiona', async () => {
    const { args, inserts } = flushArgs('conditions');
    await new HistoryMirrorSubscriber().afterFlush(args);
    expect(inserts).toEqual([]);
  });
});
