import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common';
import { SCHED } from '../../domain/scheduling.concepts';
import { findBookableOrganizations } from './bookable-organizations.query';

function emReturning(rows: unknown[]) {
  const execute = jest
    .fn<(sql: string, params?: unknown[]) => Promise<unknown>>()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(rows);
  const em = {
    transactional: jest.fn((work: (tx: unknown) => unknown) =>
      work({ execute }),
    ),
  } as unknown as EntityManager;
  return { em, execute };
}

describe('findBookableOrganizations', () => {
  it('runs in system context and maps rows', async () => {
    const { em, execute } = emReturning([
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
});
