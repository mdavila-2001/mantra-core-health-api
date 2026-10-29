import { runWithTenant } from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { CLEANING_TYPES, conceptIdOf } from '../ops-catalog';
import { PRAC } from '../practice.concepts';
import { CleaningOrdersService } from './cleaning-orders.service';
import { DEFAULT_INFRA_SETTINGS } from './ops-settings';
import {
  NOW,
  TENANT,
  actor,
  fn,
  makeOrder,
  makeRow,
  rawOrder,
} from './ops.testing';

const TERMINAL = conceptIdOf(CLEANING_TYPES, 'CLEAN_TERMINAL');

function build(
  order = makeOrder(),
  space = makeRow(),
  options: { terminalAllowed?: boolean } = {},
) {
  const tx = {
    execute: fn(async (sql: string) =>
      sql.includes('from practice.cleaning_orders') ? [rawOrder(order)] : [],
    ),
    nativeUpdate: fn().mockResolvedValue(1),
    insert: fn().mockResolvedValue(undefined),
    flush: fn().mockResolvedValue(undefined),
  };
  const em = { transactional: fn((cb: any) => cb(tx)) };
  const access = {
    assertCan: fn(async (_actor: any, action: string) => {
      if (
        action === 'infra.cleaning.inspect-terminal' &&
        options.terminalAllowed === false
      ) {
        throw new InsufficientRoleException(
          'no',
          {},
          'INFRA_ACTION_NOT_ALLOWED',
        );
      }
      return {
        actingRoles: ['NURSE_SUPERVISOR'],
        grants: [],
        tenantId: TENANT,
      };
    }),
  };
  const state = { loadSpace: fn().mockResolvedValue(space) };
  const recorder = {
    applyChange: fn().mockResolvedValue({ row: space, state: {}, events: [] }),
  };
  const events = { publish: fn().mockResolvedValue(true) };
  const historyRepo = { append: fn().mockResolvedValue(undefined) };
  const settings = { forSite: fn().mockResolvedValue(DEFAULT_INFRA_SETTINGS) };
  const memberships = { findActiveByUserTenant: fn().mockResolvedValue(null) };
  const service = new CleaningOrdersService(
    em as any,
    access as any,
    state as any,
    recorder as any,
    events as any,
    historyRepo as any,
    settings as any,
    memberships as any,
  );
  const inTenant = <T>(run: () => Promise<T>) => runWithTenant(TENANT, run);
  return { service, tx, access, recorder, events, historyRepo, inTenant };
}

const inspector = { ...actor, id: 'inspector-1' };

describe('CleaningOrdersService.inspect · limpieza terminal', () => {
  it('PASS de una orden terminal por un supervisor: el espacio queda inspeccionado y la bandera se apaga', async () => {
    const d = build(
      makeOrder({ cleaningTypeConceptId: TERMINAL }),
      makeRow({ terminalCleaningRequired: true }),
    );
    await d.inTenant(() =>
      d.service.inspect('order-1', { result: 'PASS' }, 4, inspector, 'req'),
    );
    expect(d.recorder.applyChange).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { hygiene: { to: 'HYG_INSPECTED' }, terminalCleaningRequired: false },
      expect.objectContaining({ actorUserId: 'inspector-1' }),
    );
    expect(d.tx.nativeUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'order-1', rowVersion: 4 },
      expect.objectContaining({
        statusConceptId: PRAC.CLN_INSPECTED,
        inspectedByUserId: 'inspector-1',
        rowVersion: 5,
      }),
    );
  });

  it('PASS de una orden rutinaria sin bandera: inspecciona sin tocar la bandera', async () => {
    const d = build();
    await d.inTenant(() =>
      d.service.inspect('order-1', { result: 'PASS' }, 4, inspector, 'req'),
    );
    const change = d.recorder.applyChange.mock.calls[0][2];
    expect(change).toEqual({ hygiene: { to: 'HYG_INSPECTED' } });
    expect('terminalCleaningRequired' in change).toBe(false);
  });

  it('con la bandera activa, una orden rutinaria NO se aprueba (ni siquiera un supervisor): 422 y no escribe nada', async () => {
    const d = build(makeOrder(), makeRow({ terminalCleaningRequired: true }));
    await expect(
      d.inTenant(() =>
        d.service.inspect('order-1', { result: 'PASS' }, 4, inspector, 'req'),
      ),
    ).rejects.toMatchObject({
      status: 422,
      reason: 'TERMINAL_CLEANING_REQUIRED',
    });
    expect(d.recorder.applyChange).not.toHaveBeenCalled();
    expect(d.tx.nativeUpdate).not.toHaveBeenCalled();
  });

  it('con la bandera activa, quien no tiene el permiso terminal recibe 403 aunque la orden sea rutinaria', async () => {
    const d = build(makeOrder(), makeRow({ terminalCleaningRequired: true }), {
      terminalAllowed: false,
    });
    await expect(
      d.inTenant(() =>
        d.service.inspect('order-1', { result: 'PASS' }, 4, inspector, 'req'),
      ),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'TERMINAL_INSPECTION_REQUIRES_SUPERVISOR',
    });
    expect(d.recorder.applyChange).not.toHaveBeenCalled();
  });

  it('una orden terminal inspeccionada sin permiso terminal es 403', async () => {
    const d = build(makeOrder({ cleaningTypeConceptId: TERMINAL }), makeRow(), {
      terminalAllowed: false,
    });
    await expect(
      d.inTenant(() =>
        d.service.inspect('order-1', { result: 'PASS' }, 4, inspector, 'req'),
      ),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'TERMINAL_INSPECTION_REQUIRES_SUPERVISOR',
    });
    expect(d.tx.nativeUpdate).not.toHaveBeenCalled();
  });

  it('el inspector es distinto de quien terminó (422), también para un supervisor', async () => {
    const d = build(
      makeOrder({
        cleaningTypeConceptId: TERMINAL,
        finishedByUserId: 'inspector-1',
      }),
    );
    await expect(
      d.inTenant(() =>
        d.service.inspect('order-1', { result: 'PASS' }, 4, inspector, 'req'),
      ),
    ).rejects.toMatchObject({
      status: 422,
      reason: 'INSPECTION_BY_CLEANER_NOT_ALLOWED',
    });
    expect(d.recorder.applyChange).not.toHaveBeenCalled();
  });

  it('rechazar exige el motivo; con motivo la orden queda rechazada y se abre otra terminal si la anterior lo era', async () => {
    const d = build(makeOrder({ cleaningTypeConceptId: TERMINAL }));
    await expect(
      d.inTenant(() =>
        d.service.inspect('order-1', { result: 'FAIL' }, 4, inspector, 'req'),
      ),
    ).rejects.toMatchObject({ reason: 'INSPECTION_REASON_REQUIRED' });
    await d.inTenant(() =>
      d.service.inspect(
        'order-1',
        { result: 'FAIL', reasonText: 'Polvo' },
        4,
        inspector,
        'req',
      ),
    );
    expect(d.tx.nativeUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'order-1', rowVersion: 4 },
      expect.objectContaining({
        statusConceptId: PRAC.CLN_REJECTED,
        rejectionReason: 'Polvo',
      }),
    );
    const inserted = d.tx.insert.mock.calls[0][1];
    expect(inserted).toMatchObject({
      previousOrderId: 'order-1',
      cleaningTypeConceptId: TERMINAL,
      statusConceptId: PRAC.CLN_PENDING,
    });
  });

  it('una versión vieja es 412 y una orden que no está hecha es 409', async () => {
    const d = build();
    await expect(
      d.inTenant(() =>
        d.service.inspect('order-1', { result: 'PASS' }, 3, inspector, 'req'),
      ),
    ).rejects.toMatchObject({ status: 412 });
    const pendiente = build(makeOrder({ statusConceptId: PRAC.CLN_PENDING }));
    await expect(
      pendiente.inTenant(() =>
        pendiente.service.inspect(
          'order-1',
          { result: 'PASS' },
          4,
          inspector,
          'req',
        ),
      ),
    ).rejects.toMatchObject({
      status: 409,
      reason: 'CLEANING_ORDER_INVALID_TRANSITION',
    });
  });
});

describe('CleaningOrdersService · escalada y transiciones', () => {
  it('iniciar una orden rutinaria con la bandera terminal activa la sube a terminal', async () => {
    const d = build(
      makeOrder({
        statusConceptId: PRAC.CLN_PENDING,
        finishedByUserId: null,
        finishedAt: null,
      }),
      makeRow({ terminalCleaningRequired: true }),
    );
    await d.inTenant(() => d.service.start('order-1', 4, actor, 'req'));
    expect(d.tx.nativeUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        statusConceptId: PRAC.CLN_IN_PROGRESS,
        cleaningTypeConceptId: TERMINAL,
      }),
    );
    expect(d.recorder.applyChange.mock.calls[0][2]).toEqual({
      hygiene: { to: 'HYG_CLEANING' },
    });
  });

  it('terminar una orden pendiente es 409 y nada cambia', async () => {
    const d = build(makeOrder({ statusConceptId: PRAC.CLN_PENDING }));
    await expect(
      d.inTenant(() => d.service.finish('order-1', {}, 4, actor, 'req')),
    ).rejects.toMatchObject({
      status: 409,
      reason: 'CLEANING_ORDER_INVALID_TRANSITION',
    });
    expect(d.tx.nativeUpdate).not.toHaveBeenCalled();
  });

  it('terminar deja el espacio limpio con el usuario que terminó', async () => {
    const d = build(
      makeOrder({
        statusConceptId: PRAC.CLN_IN_PROGRESS,
        finishedByUserId: null,
      }),
    );
    await d.inTenant(() =>
      d.service.finish('order-1', { note: 'ok' }, 4, actor, 'req'),
    );
    expect(d.tx.nativeUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        statusConceptId: PRAC.CLN_DONE,
        finishedByUserId: 'user-1',
      }),
    );
    expect(d.recorder.applyChange.mock.calls[0][2]).toMatchObject({
      hygiene: { to: 'HYG_CLEAN' },
    });
  });

  it('cancelar exige el motivo y, en curso, devuelve el espacio a sucio', async () => {
    const d = build(makeOrder({ statusConceptId: PRAC.CLN_IN_PROGRESS }));
    await expect(
      d.inTenant(() =>
        d.service.cancel('order-1', { reason: '  ' }, 4, actor, 'req'),
      ),
    ).rejects.toMatchObject({ reason: 'CLEANING_CANCEL_REASON_REQUIRED' });
    await d.inTenant(() =>
      d.service.cancel('order-1', { reason: 'Error' }, 4, actor, 'req'),
    );
    expect(d.recorder.applyChange.mock.calls[0][2]).toMatchObject({
      hygiene: { to: 'HYG_DIRTY' },
    });
  });

  it('una orden de otro tenant responde el mismo 404 que una inexistente', async () => {
    const d = build();
    d.tx.execute.mockResolvedValue([]);
    await expect(
      d.inTenant(() => d.service.start('order-1', 4, actor, 'req')),
    ).rejects.toMatchObject({
      status: 404,
      reason: 'PRACTICE_RESOURCE_OUT_OF_SCOPE',
    });
  });
});

describe('CleaningOrdersService.openOrder', () => {
  const ctx = {
    tenantId: TENANT,
    actorUserId: 'u',
    source: 'SRC_ADT',
    action: 'X',
    now: NOW,
  } as any;

  function openBuild(existing: any[]) {
    const d = build();
    d.tx.execute.mockImplementation(async (sql: string) => {
      if (sql.includes('for update') && sql.includes('cleaning_orders'))
        return existing;
      if (sql.includes('where o.id = ?'))
        return [rawOrder(makeOrder({ statusConceptId: PRAC.CLN_PENDING }))];
      return [];
    });
    return d;
  }

  it('sin orden abierta crea una pendiente; con la bandera del espacio la crea terminal', async () => {
    const d = openBuild([]);
    const res = await d.service.openOrder(
      d.tx as any,
      makeRow({ terminalCleaningRequired: true }),
      {
        typeCode: 'CLEAN_DISCHARGE',
        triggerCode: 'CLN_TRG_DISCHARGE',
        priorityCode: 'CLN_PRIO_ROUTINE',
      },
      ctx,
    );
    expect(res.created).toBe(true);
    expect(d.tx.insert.mock.calls[0][1]).toMatchObject({
      cleaningTypeConceptId: TERMINAL,
      statusConceptId: PRAC.CLN_PENDING,
    });
    expect(d.recorder.applyChange.mock.calls[0][2]).toMatchObject({
      hygiene: { to: 'HYG_DIRTY' },
      terminalCleaningRequired: true,
    });
  });

  it('con una orden pendiente la reutiliza y la sube a terminal; con failIfOpen es 409', async () => {
    const abierta = [
      rawOrder(makeOrder({ statusConceptId: PRAC.CLN_PENDING })),
    ];
    const d = openBuild(abierta);
    const res = await d.service.openOrder(
      d.tx as any,
      makeRow(),
      {
        typeCode: 'CLEAN_TERMINAL',
        triggerCode: 'CLN_TRG_CONTAMINATION',
        priorityCode: 'CLN_PRIO_URGENT',
        terminal: true,
        hygiene: 'HYG_CONTAMINATED',
      },
      ctx,
    );
    expect(res).toMatchObject({ created: false, escalated: true });
    expect(d.tx.insert).not.toHaveBeenCalled();
    expect(d.recorder.applyChange.mock.calls[0][2]).toMatchObject({
      hygiene: { to: 'HYG_CONTAMINATED' },
      terminalCleaningRequired: true,
    });
    await expect(
      d.service.openOrder(
        d.tx as any,
        makeRow(),
        {
          typeCode: 'CLEAN_SPOT',
          triggerCode: 'CLN_TRG_MANUAL',
          priorityCode: 'CLN_PRIO_ROUTINE',
          failIfOpen: true,
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      status: 409,
      reason: 'CLEANING_ORDER_ALREADY_OPEN',
    });
  });

  it('una orden hecha sin inspeccionar queda superada por el hecho nuevo y se abre otra', async () => {
    const d = openBuild([
      rawOrder(makeOrder({ statusConceptId: PRAC.CLN_DONE })),
    ]);
    const res = await d.service.openOrder(
      d.tx as any,
      makeRow(),
      {
        typeCode: 'CLEAN_DISCHARGE',
        triggerCode: 'CLN_TRG_DISCHARGE',
        priorityCode: 'CLN_PRIO_ROUTINE',
      },
      ctx,
    );
    expect(res.created).toBe(true);
    expect(d.tx.nativeUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        statusConceptId: PRAC.CLN_CANCELLED,
        cancelReason: 'SUPERSEDED',
      }),
    );
  });
});
