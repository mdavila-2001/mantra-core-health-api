import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, SEED } from '../../../../common';
import { SCHED } from '../../domain/scheduling.concepts';
import { findBookableOrganizations } from './bookable-organizations.query';

function emReturning(rows: unknown[]) {
  const execute = jest
    .fn<(sql: string, params?: unknown[]) => Promise<unknown>>()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(rows);
  const fork = jest.fn((): unknown => em);
  const em = {
    transactional: jest.fn((work: (tx: unknown) => unknown) =>
      work({ execute }),
    ),
    fork,
  } as unknown as EntityManager;
  return { em, execute, fork };
}

describe('findBookableOrganizations', () => {
  it('runs in system context and maps rows', async () => {
    const { em, execute, fork } = emReturning([
      {
        tenant_id: 't-1',
        name: 'Clínica',
        practitioner_count: '2',
        room_count: '0',
      },
    ]);

    await expect(findBookableOrganizations(em)).resolves.toEqual({
      items: [
        {
          tenantId: 't-1',
          name: 'Clínica',
          practitionerCount: 2,
          roomCount: 0,
        },
      ],
      count: 1,
    });
    expect(execute.mock.calls[0][0]).toContain("'app.system_context', 'true'");
    // Own connection: the system context must not outlive the call.
    expect(fork).toHaveBeenCalledWith({ keepTransactionContext: false });
  });

  // A flexible-hours or services schedule never materializes slots: counting
  // only bookable_slots left the patient with an empty organization list.
  it('also counts published templates with flexible or services bands', async () => {
    const { em, execute } = emReturning([]);

    await findBookableOrganizations(em);

    const [sql, params] = execute.mock.calls[1] as [string, unknown[]];
    expect(sql).toContain('scheduling.schedule_templates');
    expect(sql).toMatch(/st\.flexible_hours OR sr\.flexible_hours/);
    expect(params).toEqual(
      expect.arrayContaining([
        CONCEPTS.SLOT_OPEN,
        CONCEPTS.TEMPLATE_PUBLISHED,
        SCHED.RULE_MODE_SERVICES,
        SCHED.RULE_MODE_MIXED,
      ]),
    );
    expect(params).toHaveLength((sql.match(/\?/g) ?? []).length);
  });

  // A bare `GROUP BY name` binds to r.name (the practitioner), not the alias:
  // the same tenant came back once per practitioner.
  it('groups by tenant only and leaves out the seed default tenant', async () => {
    const { em, execute } = emReturning([]);

    await findBookableOrganizations(em);

    const [sql, params] = execute.mock.calls[1] as [string, unknown[]];
    expect(sql).toMatch(/GROUP BY t\.id, t\.trade_name, t\.legal_name\s/);
    expect(sql).toContain('t.id <> ?');
    expect(params).toContain(SEED.tenantId);
  });
});
