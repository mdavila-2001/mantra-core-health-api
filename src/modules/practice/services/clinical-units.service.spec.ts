import { ConflictException } from '../../../common';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import { RowVersionMismatchException } from '../http/row-version';
import { ClinicalUnitsService } from './clinical-units.service';
import { TENANT_A, actor, makeSite, mockFn } from './infrastructure.testing';

const makeUnit = (overrides: Record<string, unknown> = {}): any => ({
  id: 'u1',
  tenantId: TENANT_A,
  practiceSiteId: 's1',
  code: 'UN-1',
  name: 'Internación',
  unitTypeConceptId: PRAC.UNIT_TYPE_DEPARTMENT,
  statusConceptId: PRAC.UNIT_ACTIVE,
  rowVersion: 1,
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-01T00:00:00Z'),
  ...overrides,
});

function build(unit = makeUnit()) {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue([]),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const context = {
    unit: mockFn().mockResolvedValue({
      unit,
      site: makeSite(),
      tenantId: TENANT_A,
      access: { level: 'ORG' },
    }),
    site: mockFn().mockResolvedValue({
      site: makeSite(),
      tenantId: TENANT_A,
      access: { level: 'ORG' },
    }),
  };
  const unitsRepo = {
    findBySite: mockFn().mockResolvedValue([unit]),
    findById: mockFn().mockResolvedValue(null),
  };
  const assignmentsRepo = { findOpenByUnit: mockFn().mockResolvedValue([]) };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const service = new ClinicalUnitsService(
    em as any,
    context as any,
    unitsRepo as any,
    assignmentsRepo as any,
    historyRepo as any,
    events as any,
  );
  return {
    service,
    tx,
    unit,
    context,
    unitsRepo,
    assignmentsRepo,
    historyRepo,
    events,
  };
}

describe('ClinicalUnitsService', () => {
  it('list y get se autorizan para lectura y devuelven nodos con rowVersion', async () => {
    const d = build();
    const lista = await d.service.list('s1', actor);
    expect(d.context.site).toHaveBeenCalledWith(d.tx, 's1', actor, 'read');
    expect(lista[0]).toMatchObject({
      id: 'u1',
      code: 'UN-1',
      rowVersion: 1,
      status: { code: 'UNIT_ACTIVE' },
    });
    const ficha = await d.service.get('u1', actor);
    expect(d.context.unit).toHaveBeenCalledWith(d.tx, 'u1', actor, 'read');
    expect(ficha).toMatchObject({
      practiceSiteId: 's1',
      children: [],
      assignments: [],
    });
  });

  it('patch: If-Match vigente cambia, versiona y publica; versión vieja es 412; sin cambios no versiona', async () => {
    const d = build();
    await d.service.patch(
      'u1',
      { name: 'Internación general', description: 'Piso 3' },
      1,
      actor,
      'req-1',
    );
    expect(d.unit).toMatchObject({
      name: 'Internación general',
      description: 'Piso 3',
    });
    expect(d.historyRepo.append).toHaveBeenCalledWith(
      d.tx,
      'clinical_units',
      'u1',
      expect.objectContaining({ tenantId: TENANT_A }),
    );
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.clinical_unit.updated',
        correlationId: 'req-1',
      }),
    );
    const viejo = build(makeUnit({ rowVersion: 4 }));
    await expect(
      viejo.service.patch('u1', { name: 'X' }, 3, actor),
    ).rejects.toBeInstanceOf(RowVersionMismatchException);
    const igual = build();
    await igual.service.patch('u1', { name: 'Internación' }, 1, actor);
    expect(igual.tx.flush).not.toHaveBeenCalled();
  });

  it('el código sólo cambia mientras está planificada, y no a uno usado', async () => {
    const activa = build();
    await expect(
      activa.service.patch('u1', { code: 'NUEVO' }, 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.SPACE_IMMUTABLE_FIELD,
    });
    const planificada = build(makeUnit({ statusConceptId: PRAC.UNIT_PLANNED }));
    await planificada.service.patch('u1', { code: 'NUEVO' }, 1, actor);
    expect(planificada.unit.code).toBe('NUEVO');
    const choca = build(makeUnit({ statusConceptId: PRAC.UNIT_PLANNED }));
    choca.unitsRepo.findBySite.mockResolvedValue([
      makeUnit({ id: 'otra', code: 'USADO' }),
    ]);
    await expect(
      choca.service.patch('u1', { code: 'USADO' }, 1, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lifecycle: suspend exige motivo; la transición inválida es 422; el motivo va a historia y evento', async () => {
    const d = build();
    await expect(
      d.service.lifecycle('u1', 'suspend', ' ', 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.LIFECYCLE_REASON_REQUIRED,
    });
    await expect(
      d.service.lifecycle('u1', 'activate', undefined, 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
    });
    await d.service.lifecycle('u1', 'suspend', 'Obras', 1, actor);
    expect(d.unit.statusConceptId).toBe(PRAC.UNIT_SUSPENDED);
    expect(d.historyRepo.append).toHaveBeenCalledWith(
      d.tx,
      'clinical_units',
      'u1',
      expect.objectContaining({
        dataSnapshot: expect.objectContaining({
          lifecycleReason: 'Obras',
          lifecycleAction: 'suspend',
        }),
      }),
    );
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.clinical_unit.lifecycle_changed',
        payload: expect.objectContaining({
          from: 'UNIT_ACTIVE',
          to: 'UNIT_SUSPENDED',
          reason: 'Obras',
        }),
      }),
    );
  });

  it('INV-10: no se activa una unidad hija con la unidad padre sin activar', async () => {
    const hija = makeUnit({
      statusConceptId: PRAC.UNIT_PLANNED,
      parentUnitId: 'p',
    });
    const d = build(hija);
    d.unitsRepo.findById.mockResolvedValue(
      makeUnit({ id: 'p', statusConceptId: PRAC.UNIT_SUSPENDED }),
    );
    await expect(
      d.service.lifecycle('u1', 'activate', undefined, 1, actor),
    ).rejects.toMatchObject({ reason: PracticeErrorReason.PARENT_NOT_ACTIVE });
  });

  it('INV-12: con hijos, espacios o personal activos no se retira (409 UNIT_RETIRE_BLOCKED con próxima acción); sin ellos sí', async () => {
    const d = build();
    d.tx.execute
      .mockResolvedValueOnce([{ id: 'hija-1' }])
      .mockResolvedValueOnce([{ id: 'sp-1' }, { id: 'sp-2' }])
      .mockResolvedValueOnce([{ id: 'rol-1' }]);
    const error = await d.service
      .lifecycle('u1', 'retire', 'Cierre', 1, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect((error as any).reason).toBe(PracticeErrorReason.UNIT_RETIRE_BLOCKED);
    expect((error as any).details.blockers).toEqual([
      expect.objectContaining({
        kind: 'ACTIVE_CHILDREN',
        count: 1,
        sampleIds: ['hija-1'],
        nextAction: expect.any(String),
      }),
      expect.objectContaining({ kind: 'ACTIVE_UNIT_SPACES', count: 2 }),
      expect.objectContaining({ kind: 'ACTIVE_UNIT_STAFF', count: 1 }),
    ]);
    expect(d.unit.statusConceptId).toBe(PRAC.UNIT_ACTIVE);
    const libre = build();
    await libre.service.lifecycle('u1', 'retire', 'Cierre', 1, actor);
    expect(libre.unit.statusConceptId).toBe(PRAC.UNIT_RETIRED);
    expect(libre.unit.validTo).toBeInstanceOf(Date);
  });

  it('una unidad clausurada es de sólo lectura', async () => {
    const d = build(makeUnit({ statusConceptId: PRAC.UNIT_RETIRED }));
    await expect(
      d.service.patch('u1', { name: 'X' }, 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
    });
  });
});
