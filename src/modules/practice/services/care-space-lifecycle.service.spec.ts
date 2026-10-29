import {
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
import { FORMS, FUNCTIONS } from '../infrastructure-catalog';
import { RowVersionMismatchException } from '../http/row-version';
import { conceptIdOf, HYGIENE } from '../ops-catalog';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import { CareSpaceLifecycleService } from './care-space-lifecycle.service';
import { RetireBlockerRegistry, SUBTREE_CTE } from './retire-blockers';
import {
  TENANT_A,
  actor,
  detailStub,
  makeSite,
  makeSpace,
  mockFn,
} from './infrastructure.testing';

function build(space: any) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const context = {
    space: mockFn().mockResolvedValue({
      space,
      site: makeSite(),
      tenantId: TENANT_A,
      access: { level: 'ORG' },
    }),
  };
  const spacesRepo = { findByIdInTenant: mockFn().mockResolvedValue(null) };
  const registry = new RetireBlockerRegistry();
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const reader = {
    detailsOf: mockFn(async (_tx: any, spaces: any[]) =>
      spaces.map(detailStub),
    ),
  };
  const service = new CareSpaceLifecycleService(
    em as any,
    context as any,
    spacesRepo as any,
    registry,
    historyRepo as any,
    events as any,
    reader as any,
  );
  return { service, tx, context, spacesRepo, registry, historyRepo, events };
}

describe('CareSpaceLifecycleService.change', () => {
  it('activate: PLANNED→ACTIVE con validFrom, historia con la acción y evento from/to', async () => {
    const space = makeSpace();
    const d = build(space);
    await d.service.change(space.id, 'activate', undefined, 1, actor, 'req-1');
    expect(space.statusConceptId).toBe(PRAC.SPACE_ACTIVE);
    expect(space.validFrom).toBeInstanceOf(Date);
    expect(d.historyRepo.append).toHaveBeenCalledWith(
      d.tx,
      'care_spaces',
      space.id,
      expect.objectContaining({
        tenantId: TENANT_A,
        dataSnapshot: expect.objectContaining({
          lifecycleAction: 'activate',
          lifecycleReason: null,
        }),
      }),
    );
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.care_space.lifecycle_changed',
        payload: expect.objectContaining({
          from: 'SPACE_PLANNED',
          to: 'SPACE_ACTIVE',
          action: 'activate',
        }),
      }),
    );
  });

  it('INV-13: suspend y retire exigen motivo; el motivo viaja a la historia y al evento', async () => {
    const activo = makeSpace({ statusConceptId: PRAC.SPACE_ACTIVE });
    const d = build(activo);
    for (const action of ['suspend', 'retire'] as const) {
      await expect(
        d.service.change(activo.id, action, '   ', 1, actor),
      ).rejects.toMatchObject({
        reason: PracticeErrorReason.LIFECYCLE_REASON_REQUIRED,
      });
    }
    expect(d.tx.flush).not.toHaveBeenCalled();
    await d.service.change(activo.id, 'suspend', ' Fumigación ', 1, actor);
    expect(activo.statusConceptId).toBe(PRAC.SPACE_SUSPENDED);
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        payload: expect.objectContaining({ reason: 'Fumigación' }),
      }),
    );
  });

  it('F2: activate deja la higiene lista para usar si nadie la tocó; reactivate conserva la que tenía', async () => {
    const nuevo = makeSpace();
    await build(nuevo).service.change(
      nuevo.id,
      'activate',
      undefined,
      1,
      actor,
    );
    expect(nuevo.hygieneStatusConceptId).toBe(
      conceptIdOf(HYGIENE, 'HYG_INSPECTED'),
    );
    expect(nuevo.hygieneChangedAt).toBeInstanceOf(Date);

    // backfill del patch: HYG_CLEAN sin fecha de cambio = nadie la tocó
    const backfill = makeSpace({
      hygieneStatusConceptId: conceptIdOf(HYGIENE, 'HYG_CLEAN'),
    });
    await build(backfill).service.change(
      backfill.id,
      'activate',
      undefined,
      1,
      actor,
    );
    expect(backfill.hygieneStatusConceptId).toBe(
      conceptIdOf(HYGIENE, 'HYG_INSPECTED'),
    );

    const sucio = makeSpace({
      statusConceptId: PRAC.SPACE_SUSPENDED,
      hygieneStatusConceptId: conceptIdOf(HYGIENE, 'HYG_DIRTY'),
      hygieneChangedAt: new Date('2026-10-01T00:00:00Z'),
    });
    await build(sucio).service.change(
      sucio.id,
      'reactivate',
      undefined,
      1,
      actor,
    );
    expect(sucio.hygieneStatusConceptId).toBe(
      conceptIdOf(HYGIENE, 'HYG_DIRTY'),
    );

    const operado = makeSpace({
      hygieneStatusConceptId: conceptIdOf(HYGIENE, 'HYG_CLEAN'),
      hygieneChangedAt: new Date('2026-10-01T00:00:00Z'),
    });
    await build(operado).service.change(
      operado.id,
      'activate',
      undefined,
      1,
      actor,
    );
    expect(operado.hygieneStatusConceptId).toBe(
      conceptIdOf(HYGIENE, 'HYG_CLEAN'),
    );
  });

  it('transiciones inválidas son 422; reactivar vuelve a ACTIVE', async () => {
    const planificado = makeSpace();
    const d = build(planificado);
    await expect(
      d.service.change(planificado.id, 'suspend', 'x', 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
    });
    await expect(
      d.service.change(planificado.id, 'reactivate', undefined, 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
    });
    const clausurado = makeSpace({ statusConceptId: PRAC.SPACE_RETIRED });
    await expect(
      build(clausurado).service.change(
        clausurado.id,
        'activate',
        undefined,
        1,
        actor,
      ),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
    });
    const suspendido = makeSpace({ statusConceptId: PRAC.SPACE_SUSPENDED });
    await build(suspendido).service.change(
      suspendido.id,
      'reactivate',
      undefined,
      1,
      actor,
    );
    expect(suspendido.statusConceptId).toBe(PRAC.SPACE_ACTIVE);
  });

  it('INV-10: no se activa un hijo con el padre suspendido o inexistente (PARENT_NOT_ACTIVE con próxima acción)', async () => {
    const hijo = makeSpace({ parentSpaceId: 'padre' });
    const d = build(hijo);
    d.spacesRepo.findByIdInTenant.mockResolvedValue(
      makeSpace({ id: 'padre', statusConceptId: PRAC.SPACE_SUSPENDED }),
    );
    const error = await d.service
      .change(hijo.id, 'activate', undefined, 1, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect((error as any).reason).toBe(PracticeErrorReason.PARENT_NOT_ACTIVE);
    expect((error as any).details.nextAction).toEqual(expect.any(String));
    expect(hijo.statusConceptId).toBe(PRAC.SPACE_PLANNED);
    d.spacesRepo.findByIdInTenant.mockResolvedValue(null);
    await expect(
      d.service.change(hijo.id, 'activate', undefined, 1, actor),
    ).rejects.toMatchObject({ reason: PracticeErrorReason.PARENT_NOT_ACTIVE });
  });

  it('activar exige los datos del perfil (quirófano: área y HVAC)', async () => {
    const qx = makeSpace({
      spaceTypeConceptId: FUNCTIONS.byInput('SPACE_FN_OPERATING_ROOM')!.id,
    });
    const error = await build(qx)
      .service.change(qx.id, 'activate', undefined, 1, actor)
      .catch((e: unknown) => e);
    expect((error as any).reason).toBe(
      PracticeErrorReason.SPACE_PROFILE_INCOMPLETE,
    );
    expect((error as any).details.errors.map((e: any) => e.field)).toEqual(
      expect.arrayContaining(['areaM2', 'pressureCode']),
    );
    const cama = makeSpace({
      formConceptId: FORMS.byInput('BED')!.id,
      spaceTypeConceptId: FUNCTIONS.byInput('SPACE_FN_BED_STANDARD')!.id,
    });
    await expect(
      build(cama).service.change(cama.id, 'activate', undefined, 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.SPACE_PROFILE_INCOMPLETE,
    });
  });

  it('INV-11: retire con bloqueos es 409 SPACE_RETIRE_BLOCKED con la lista, y no muta', async () => {
    const space = makeSpace({ statusConceptId: PRAC.SPACE_ACTIVE });
    const d = build(space);
    d.registry.register({
      kind: 'ACTIVE_CHILDREN',
      collect: async () => ({
        kind: 'ACTIVE_CHILDREN',
        count: 1,
        sampleIds: ['c1'],
        nextAction: 'Clausurar o mover los hijos',
      }),
    });
    d.registry.register({ kind: 'VACIO', collect: async () => null });
    const error = await d.service
      .change(space.id, 'retire', 'Remodelación', 1, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect((error as any).reason).toBe(
      PracticeErrorReason.SPACE_RETIRE_BLOCKED,
    );
    expect((error as any).details.blockers).toEqual([
      {
        kind: 'ACTIVE_CHILDREN',
        count: 1,
        sampleIds: ['c1'],
        nextAction: 'Clausurar o mover los hijos',
      },
    ]);
    expect(space.statusConceptId).toBe(PRAC.SPACE_ACTIVE);
    expect(space.validTo).toBeUndefined();
    expect(d.tx.flush).not.toHaveBeenCalled();
    expect(d.events.publish).not.toHaveBeenCalled();
  });

  it('retire sin bloqueos clausura con valid_to y consulta a cada proveedor con el subárbol', async () => {
    const space = makeSpace({ statusConceptId: PRAC.SPACE_ACTIVE });
    const d = build(space);
    const collect = mockFn().mockResolvedValue(null);
    d.registry.register({ kind: 'X', collect });
    await d.service.change(space.id, 'retire', 'Cierre', 1, actor);
    expect(space.statusConceptId).toBe(PRAC.SPACE_RETIRED);
    expect(space.validTo).toBeInstanceOf(Date);
    expect(collect).toHaveBeenCalledWith(
      expect.objectContaining({
        tx: d.tx,
        tenantId: TENANT_A,
        rootId: space.id,
        subtreeCte: SUBTREE_CTE,
      }),
    );
  });

  it('un módulo que se registra después aporta su bloqueo sin tocar el servicio', async () => {
    const space = makeSpace({ statusConceptId: PRAC.SPACE_ACTIVE });
    const d = build(space);
    await d.service.change(space.id, 'suspend', 'x', 1, actor);
    space.statusConceptId = PRAC.SPACE_ACTIVE;
    space.rowVersion = 1;
    d.registry.register({
      kind: 'OTRO_MODULO',
      collect: async () => ({
        kind: 'OTRO_MODULO',
        count: 3,
        sampleIds: [],
        nextAction: 'Resolver allá',
      }),
    });
    await expect(
      d.service.change(space.id, 'retire', 'x', 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.SPACE_RETIRE_BLOCKED,
    });
  });

  it('la versión vieja es 412 antes de evaluar nada', async () => {
    const space = makeSpace({ rowVersion: 5 });
    const d = build(space);
    await expect(
      d.service.change(space.id, 'activate', undefined, 2, actor),
    ).rejects.toBeInstanceOf(RowVersionMismatchException);
    expect(space.statusConceptId).toBe(PRAC.SPACE_PLANNED);
  });
});

describe('CareSpaceLifecycleService.retireCheck', () => {
  it('devuelve los bloqueos de todos los proveedores con asOf, sin mutar', async () => {
    const space = makeSpace({ statusConceptId: PRAC.SPACE_ACTIVE });
    const d = build(space);
    d.registry.register({
      kind: 'A',
      collect: async () => ({
        kind: 'A',
        count: 1,
        sampleIds: ['x'],
        nextAction: 'a',
      }),
    });
    d.registry.register({
      kind: 'B',
      collect: async () => ({
        kind: 'B',
        count: 2,
        sampleIds: ['y'],
        nextAction: 'b',
      }),
    });
    const res = await d.service.retireCheck(space.id, actor);
    expect(res.blockers.map((b) => b.kind)).toEqual(['A', 'B']);
    expect(Date.parse(res.asOf)).toBeGreaterThan(0);
    expect(d.tx.flush).not.toHaveBeenCalled();
    expect(space.statusConceptId).toBe(PRAC.SPACE_ACTIVE);
  });
});
