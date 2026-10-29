import { runWithTenant } from '../../../common';
import { CONCEPTS } from '../../../common';
import { mockFn } from '../../practice/services/infrastructure.testing';
import { PRAC } from '../../practice/practice.concepts';
import { AccountingInfrastructureService } from './accounting-infrastructure.service';
import { EQUIPMENT_BLOCKER } from './accounting-retire-blockers';

const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PRACTICE = 'pppppppp-pppp-pppp-pppp-pppppppppppp';
const actor = { id: 'user-1', roles: ['USER'] } as any;

interface World {
  item?: boolean;
  space?: { practice_id: string; status_concept_id: string } | null;
  center?: {
    status_concept_id?: string;
    clinical_unit_id?: string | null;
  } | null;
  unit?: { practice_id: string; status_concept_id: string } | null;
  otherCenter?: boolean;
  level?: string;
  approver?: boolean;
}

function build(world: World = {}) {
  const writes: [string, unknown[]][] = [];
  const tx: any = {
    execute: mockFn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes('from accounting.infrastructure_items i'))
        return world.item === false
          ? []
          : [{ id: 'item-1', practice_id: PRACTICE, care_space_id: null }];
      if (sql.includes('from practice.care_spaces cs'))
        return world.space === null
          ? []
          : [
              world.space ?? {
                practice_id: PRACTICE,
                status_concept_id: PRAC.SPACE_ACTIVE,
              },
            ];
      if (sql.includes('from accounting.cost_centers c'))
        return world.center === null
          ? []
          : [
              {
                id: 'cc-1',
                practice_id: PRACTICE,
                status_concept_id: CONCEPTS.STATE_ACTIVE,
                clinical_unit_id: null,
                ...world.center,
              },
            ];
      if (sql.includes('from practice.clinical_units u'))
        return world.unit === null
          ? []
          : [
              world.unit ?? {
                practice_id: PRACTICE,
                status_concept_id: PRAC.UNIT_ACTIVE,
              },
            ];
      if (sql.includes('where clinical_unit_id = ? and status_concept_id'))
        return world.otherCenter ? [{ id: 'cc-otro' }] : [];
      if (sql.startsWith('update')) writes.push([sql, params]);
      return [];
    }),
  };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  const access = {
    structureLevel: mockFn().mockResolvedValue({ level: world.level ?? 'ORG' }),
  };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue(undefined) };
  const service = new AccountingInfrastructureService(
    em,
    access as any,
    outbox as any,
  );
  const caller = world.approver
    ? { ...actor, roles: ['USER', 'ACCOUNTING_APPROVER'] }
    : actor;
  const run = <T>(fn: () => Promise<T>) => runWithTenant(TENANT, fn);
  return { service, tx, access, outbox, writes, run, caller };
}

describe('AccountingInfrastructureService.locateItem', () => {
  it('permitido (organización): bloquea el espacio for share, escribe y publica en la misma transacción', async () => {
    const d = build();
    const res = await d.run(() =>
      d.service.locateItem(
        'item-1',
        { careSpaceId: 'space-1' },
        d.caller,
        'req-1',
      ),
    );
    expect(res).toEqual({
      id: 'item-1',
      practiceId: PRACTICE,
      careSpaceId: 'space-1',
    });
    const spaceSql = d.tx.execute.mock.calls.find((c: any[]) =>
      String(c[0]).includes('from practice.care_spaces cs'),
    )[0];
    expect(spaceSql).toMatch(/for share of cs/);
    expect(d.writes[0][1]).toEqual(['space-1', 'user-1', 'item-1']);
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: 'accounting.infrastructure_item.located',
        tenantId: TENANT,
        payloadJson: expect.objectContaining({
          careSpaceId: 'space-1',
          previousCareSpaceId: null,
        }),
      }),
    );
  });

  it('ACCOUNTING_APPROVER escribe sin ser administrador; Facturación o Enfermería (nivel de miembro) reciben 403', async () => {
    const aprobador = build({ level: 'MEMBER', approver: true });
    await expect(
      aprobador.run(() =>
        aprobador.service.locateItem(
          'item-1',
          { careSpaceId: 's' },
          aprobador.caller,
          undefined,
        ),
      ),
    ).resolves.toBeDefined();
    const miembro = build({ level: 'MEMBER' });
    await expect(
      miembro.run(() =>
        miembro.service.locateItem(
          'item-1',
          { careSpaceId: 's' },
          miembro.caller,
          undefined,
        ),
      ),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'INFRA_ACTION_NOT_ALLOWED',
    });
    expect(miembro.writes).toHaveLength(0);
    // el soporte de plataforma tampoco escribe
    const soporte = build({ level: 'PLATFORM' });
    await expect(
      soporte.run(() =>
        soporte.service.locateItem(
          'item-1',
          { careSpaceId: 's' },
          soporte.caller,
          undefined,
        ),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('quien no pertenece al tenant recibe el mismo 404 que ante un activo inexistente', async () => {
    const ajeno = build({ level: 'NONE' });
    await expect(
      ajeno.run(() =>
        ajeno.service.locateItem(
          'item-1',
          { careSpaceId: 's' },
          ajeno.caller,
          undefined,
        ),
      ),
    ).rejects.toMatchObject({
      status: 404,
      reason: 'INFRASTRUCTURE_ITEM_NOT_FOUND',
    });
    const inexistente = build({ item: false });
    await expect(
      inexistente.run(() =>
        inexistente.service.locateItem(
          'item-1',
          { careSpaceId: 's' },
          inexistente.caller,
          undefined,
        ),
      ),
    ).rejects.toMatchObject({
      status: 404,
      reason: 'INFRASTRUCTURE_ITEM_NOT_FOUND',
    });
    expect(inexistente.access.structureLevel).not.toHaveBeenCalled();
  });

  it('espacio ajeno 404; de otra práctica 422 INFRASTRUCTURE_SPACE_PRACTICE_MISMATCH; retirado 422', async () => {
    const ajeno = build({ space: null });
    await expect(
      ajeno.run(() =>
        ajeno.service.locateItem(
          'item-1',
          { careSpaceId: 's' },
          ajeno.caller,
          undefined,
        ),
      ),
    ).rejects.toMatchObject({
      status: 404,
      reason: 'INFRASTRUCTURE_SPACE_NOT_FOUND',
    });
    const otra = build({
      space: { practice_id: 'otra', status_concept_id: PRAC.SPACE_ACTIVE },
    });
    await expect(
      otra.run(() =>
        otra.service.locateItem(
          'item-1',
          { careSpaceId: 's' },
          otra.caller,
          undefined,
        ),
      ),
    ).rejects.toMatchObject({
      status: 422,
      reason: 'INFRASTRUCTURE_SPACE_PRACTICE_MISMATCH',
    });
    const retirada = build({
      space: { practice_id: PRACTICE, status_concept_id: PRAC.SPACE_RETIRED },
    });
    await expect(
      retirada.run(() =>
        retirada.service.locateItem(
          'item-1',
          { careSpaceId: 's' },
          retirada.caller,
          undefined,
        ),
      ),
    ).rejects.toMatchObject({
      status: 422,
      reason: 'INFRASTRUCTURE_SPACE_RETIRED',
    });
    for (const d of [ajeno, otra, retirada]) expect(d.writes).toHaveLength(0);
  });

  it('null desubica sin consultar espacios', async () => {
    const d = build();
    await d.run(() =>
      d.service.locateItem(
        'item-1',
        { careSpaceId: null },
        d.caller,
        undefined,
      ),
    );
    expect(
      d.tx.execute.mock.calls.some((c: any[]) =>
        String(c[0]).includes('from practice.care_spaces cs'),
      ),
    ).toBe(false);
    expect(d.writes[0][1]).toEqual([null, 'user-1', 'item-1']);
  });
});

describe('AccountingInfrastructureService.linkCostCenterUnit', () => {
  it('permitido: bloquea la unidad for share, vincula y publica', async () => {
    const d = build();
    const res = await d.run(() =>
      d.service.linkCostCenterUnit(
        'cc-1',
        { clinicalUnitId: 'u-1' },
        d.caller,
        'req',
      ),
    );
    expect(res.clinicalUnitId).toBe('u-1');
    const sql = d.tx.execute.mock.calls.find((c: any[]) =>
      String(c[0]).includes('from practice.clinical_units u'),
    )[0];
    expect(sql).toMatch(/for share of u/);
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: 'accounting.cost_center.unit_linked',
      }),
    );
  });

  it('409 si la unidad ya tiene otro centro activo; idempotente si ya es suyo; un inactivo no choca', async () => {
    const dup = build({ otherCenter: true });
    await expect(
      dup.run(() =>
        dup.service.linkCostCenterUnit(
          'cc-1',
          { clinicalUnitId: 'u-1' },
          dup.caller,
          undefined,
        ),
      ),
    ).rejects.toMatchObject({
      status: 409,
      reason: 'UNIT_ALREADY_HAS_COST_CENTER',
    });
    const mismo = build({
      center: { clinical_unit_id: 'u-1' },
      otherCenter: true,
    });
    await expect(
      mismo.run(() =>
        mismo.service.linkCostCenterUnit(
          'cc-1',
          { clinicalUnitId: 'u-1' },
          mismo.caller,
          undefined,
        ),
      ),
    ).resolves.toMatchObject({ clinicalUnitId: 'u-1' });
    expect(mismo.writes).toHaveLength(0);
    const inactivo = build({
      center: { status_concept_id: CONCEPTS.STATE_EXPIRED },
      otherCenter: true,
    });
    await expect(
      inactivo.run(() =>
        inactivo.service.linkCostCenterUnit(
          'cc-1',
          { clinicalUnitId: 'u-1' },
          inactivo.caller,
          undefined,
        ),
      ),
    ).resolves.toBeDefined();
  });

  it('ajeno → 404; unidad de otra práctica → 422; unidad clausurada → 422; rol insuficiente → 403', async () => {
    const cases: [World, number, string][] = [
      [{ center: null }, 404, 'COST_CENTER_NOT_FOUND'],
      [{ unit: null }, 404, 'COST_CENTER_UNIT_NOT_FOUND'],
      [
        { unit: { practice_id: 'otra', status_concept_id: PRAC.UNIT_ACTIVE } },
        422,
        'COST_CENTER_UNIT_PRACTICE_MISMATCH',
      ],
      [
        {
          unit: { practice_id: PRACTICE, status_concept_id: PRAC.UNIT_RETIRED },
        },
        422,
        'COST_CENTER_UNIT_RETIRED',
      ],
      [{ level: 'MEMBER' }, 403, 'INFRA_ACTION_NOT_ALLOWED'],
      [{ level: 'NONE' }, 404, 'COST_CENTER_NOT_FOUND'],
    ];
    for (const [world, status, reason] of cases) {
      const d = build(world);
      await expect(
        d.run(() =>
          d.service.linkCostCenterUnit(
            'cc-1',
            { clinicalUnitId: 'u-1' },
            d.caller,
            undefined,
          ),
        ),
      ).rejects.toMatchObject({ status, reason });
      expect(d.writes).toHaveLength(0);
    }
  });
});

describe('proveedor de bloqueo EQUIPMENT', () => {
  const context = (rows: { id: string }[]) =>
    ({
      tx: { execute: mockFn().mockResolvedValue(rows) },
      tenantId: TENANT,
      rootId: 'root',
      now: new Date(),
      subtreeCte: 'with recursive sub as (select 1)',
    }) as any;

  it('suma los activos contables y los equipos diagnósticos del subárbol, con próxima acción', async () => {
    const ctx = context([{ id: 'a' }, { id: 'b' }]);
    const blocker = await EQUIPMENT_BLOCKER.collect(ctx);
    expect(blocker).toMatchObject({
      kind: 'EQUIPMENT',
      count: 2,
      sampleIds: ['a', 'b'],
    });
    expect(blocker?.nextAction).toMatch(/reubicar/i);
    const sql = ctx.tx.execute.mock.calls[0][0];
    expect(sql).toMatch(/accounting\.infrastructure_items/);
    expect(sql).toMatch(/diagnostic_units\.diagnostic_equipment/);
  });

  it('sin equipos no bloquea', async () => {
    expect(await EQUIPMENT_BLOCKER.collect(context([]))).toBeNull();
  });
});
