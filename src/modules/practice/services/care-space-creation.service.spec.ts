import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { FORMS, FUNCTIONS, REGULATORY } from '../infrastructure-catalog';
import { conceptIdOf, HYGIENE } from '../ops-catalog';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import {
  CareSpaceCreationService,
  type SpaceInput,
} from './care-space-creation.service';
import {
  TENANT_A,
  TENANT_B,
  actor,
  detailStub,
  makeSite,
  makeSpace,
  mockFn,
  ruleSet,
} from './infrastructure.testing';

function build(siteOverrides: Record<string, unknown> = {}) {
  const site = makeSite(siteOverrides);
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const context = {
    site: mockFn().mockResolvedValue({
      site,
      tenantId: TENANT_A,
      access: { level: 'ORG' },
    }),
    assertSiteActive: mockFn(),
  };
  let n = 0;
  const created: any[] = [];
  const spacesRepo = {
    takenCodes: mockFn().mockResolvedValue(new Set<string>()),
    findByIdInTenant: mockFn().mockResolvedValue(null),
    findBySite: mockFn().mockResolvedValue([]),
    create: mockFn((_tx: any, data: any) => {
      n += 1;
      const space = makeSpace({ ...data, id: `new-${n}`, rowVersion: 1 });
      created.push(space);
      return space;
    }),
  };
  const unitsRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const rulesRepo = { loadRuleSet: mockFn().mockResolvedValue(ruleSet()) };
  const assignmentsRepo = {
    create: mockFn((_tx: any, data: any) => ({ id: 'as-1', ...data })),
  };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const reader = {
    detailsOf: mockFn(async (_tx: any, spaces: any[]) =>
      spaces.map(detailStub),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new CareSpaceCreationService(
    em as any,
    context as any,
    spacesRepo as any,
    unitsRepo as any,
    rulesRepo as any,
    assignmentsRepo as any,
    historyRepo as any,
    events as any,
    reader as any,
    logger as any,
  );
  return {
    service,
    tx,
    context,
    spacesRepo,
    unitsRepo,
    rulesRepo,
    assignmentsRepo,
    historyRepo,
    events,
    reader,
    created,
    site,
  };
}

const room = (extra: Partial<SpaceInput> = {}): SpaceInput => ({
  code: 'HAB-1',
  name: 'Habitación',
  formCode: 'LOC_FORM_ROOM',
  functionCode: 'SPACE_FN_INPATIENT_ROOM',
  ...extra,
});
const parentOf = (
  formCode: string,
  status = PRAC.SPACE_ACTIVE,
  extra: Record<string, unknown> = {},
) =>
  makeSpace({
    id: 'parent-1',
    formConceptId: FORMS.byInput(formCode)!.id,
    statusConceptId: status,
    ...extra,
  });

describe('CareSpaceCreationService.create', () => {
  it('permitido: nace PLANNED con el tenant de la sede, historia con tenant, evento y detalle', async () => {
    const d = build();
    const res = await d.service.create('s1', room(), actor, 'req-1');
    expect(d.spacesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT_A,
        practiceSiteId: 's1',
        code: 'HAB-1',
        statusConceptId: PRAC.SPACE_PLANNED,
        formConceptId: FORMS.byInput('ROOM')!.id,
        spaceTypeConceptId: FUNCTIONS.byInput('SPACE_FN_INPATIENT_ROOM')!.id,
        validFrom: undefined,
      }),
    );
    expect(d.historyRepo.append).toHaveBeenCalledWith(
      d.tx,
      'care_spaces',
      'new-1',
      expect.objectContaining({
        tenantId: TENANT_A,
        firstRevision: true,
        changedByUserId: actor.id,
      }),
    );
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.care_space.created',
        tenantId: TENANT_A,
        correlationId: 'req-1',
      }),
    );
    expect(res).toMatchObject({ id: 'new-1' });
  });

  it('activate:true con padre activo y datos completos nace ACTIVE con validFrom', async () => {
    const d = build();
    d.spacesRepo.findByIdInTenant.mockResolvedValue(
      parentOf('LOC_FORM_BUILDING'),
    );
    await d.service.create(
      's1',
      room({ parentSpaceId: 'parent-1', activate: true }),
      actor,
    );
    expect(d.spacesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        statusConceptId: PRAC.SPACE_ACTIVE,
        validFrom: expect.any(Date),
      }),
    );
  });

  it('F2: un espacio que nace activo nace con la higiene lista para usar; uno planificado, sin higiene', async () => {
    const d = build();
    d.spacesRepo.findByIdInTenant.mockResolvedValue(
      parentOf('LOC_FORM_BUILDING'),
    );
    await d.service.create(
      's1',
      room({ parentSpaceId: 'parent-1', activate: true }),
      actor,
    );
    expect(d.spacesRepo.create).toHaveBeenLastCalledWith(
      d.tx,
      expect.objectContaining({
        hygieneStatusConceptId: conceptIdOf(HYGIENE, 'HYG_INSPECTED'),
        hygieneChangedAt: expect.any(Date),
      }),
    );
    await d.service.create('s1', room({ parentSpaceId: 'parent-1' }), actor);
    const planificado = d.spacesRepo.create.mock.calls.at(-1)?.[1];
    expect(planificado.hygieneStatusConceptId).toBeUndefined();
    expect(planificado.hygieneChangedAt).toBeUndefined();
  });

  it('activate:true con padre planificado o con datos que el perfil exige: 422 y no crea', async () => {
    const d = build();
    d.spacesRepo.findByIdInTenant.mockResolvedValue(
      parentOf('LOC_FORM_BUILDING', PRAC.SPACE_PLANNED),
    );
    await expect(
      d.service.create(
        's1',
        room({ parentSpaceId: 'parent-1', activate: true }),
        actor,
      ),
    ).rejects.toMatchObject({ reason: PracticeErrorReason.PARENT_NOT_ACTIVE });
    const d2 = build();
    await expect(
      d2.service.create(
        's1',
        {
          code: 'QX',
          name: 'Quirófano',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_OPERATING_ROOM',
          activate: true,
        },
        actor,
      ),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.SPACE_PROFILE_INCOMPLETE,
    });
    expect(d.spacesRepo.create).not.toHaveBeenCalled();
    expect(d2.spacesRepo.create).not.toHaveBeenCalled();
  });

  it('INV-04: una cama bajo un piso es 422 SPACE_PARENT_RULE y no escribe', async () => {
    const d = build();
    d.spacesRepo.findByIdInTenant.mockResolvedValue(parentOf('LOC_FORM_LEVEL'));
    const error = await d.service
      .create(
        's1',
        {
          code: 'C',
          name: 'Cama',
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          parentSpaceId: 'parent-1',
        },
        actor,
      )
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect((error as any).reason).toBe(PracticeErrorReason.SPACE_PARENT_RULE);
    expect(d.spacesRepo.create).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
    expect(d.historyRepo.append).not.toHaveBeenCalled();
    expect(d.events.publish).not.toHaveBeenCalled();
  });

  it('INV-05: una función que no admite la forma es 422', async () => {
    const d = build();
    d.spacesRepo.findByIdInTenant.mockResolvedValue(parentOf('LOC_FORM_ROOM'));
    await expect(
      d.service.create(
        's1',
        {
          code: 'C',
          name: 'x',
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_OPERATING_ROOM',
          parentSpaceId: 'parent-1',
        },
        actor,
      ),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.SPACE_FUNCTION_FORM_MISMATCH,
    });
  });

  it('INV-06: un Puesto de Salud no admite quirófano; sin tipología se permite', async () => {
    const puesto = build({
      facilityTypologyConceptId: REGULATORY.typology.byInput(
        'TYPOLOGY_HEALTH_POST',
      )!.id,
    });
    await expect(
      puesto.service.create(
        's1',
        {
          code: 'QX',
          name: 'Quirófano',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_OPERATING_ROOM',
        },
        actor,
      ),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.TYPOLOGY_NOT_ALLOWED,
    });
    const sinTipologia = build();
    await sinTipologia.service.create(
      's1',
      {
        code: 'QX',
        name: 'Quirófano',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_OPERATING_ROOM',
      },
      actor,
    );
    expect(sinTipologia.spacesRepo.create).toHaveBeenCalled();
  });

  it('INV-08: el código repetido es 409 SPACE_CODE_TAKEN', async () => {
    const d = build();
    d.spacesRepo.takenCodes.mockResolvedValue(new Set(['HAB-1']));
    const error = await d.service
      .create('s1', room(), actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect((error as any).reason).toBe(PracticeErrorReason.SPACE_CODE_TAKEN);
    expect(d.spacesRepo.create).not.toHaveBeenCalled();
  });

  it('un padre de otro tenant responde 404 uniforme; uno de otra sede, 422', async () => {
    const ajeno = build();
    ajeno.spacesRepo.findByIdInTenant.mockResolvedValue(null);
    await expect(
      ajeno.service.create('s1', room({ parentSpaceId: 'x' }), actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(ajeno.spacesRepo.findByIdInTenant).toHaveBeenCalledWith(
      ajeno.tx,
      'x',
      TENANT_A,
    );
    const otraSede = build();
    otraSede.spacesRepo.findByIdInTenant.mockResolvedValue(
      parentOf('LOC_FORM_BUILDING', PRAC.SPACE_ACTIVE, {
        practiceSiteId: 's9',
      }),
    );
    await expect(
      otraSede.service.create('s1', room({ parentSpaceId: 'parent-1' }), actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.PARENT_SITE_MISMATCH,
    });
  });

  it('un padre suspendido o clausurado no admite hijos', async () => {
    for (const status of [PRAC.SPACE_SUSPENDED, PRAC.SPACE_RETIRED]) {
      const d = build();
      d.spacesRepo.findByIdInTenant.mockResolvedValue(
        parentOf('LOC_FORM_BUILDING', status),
      );
      await expect(
        d.service.create('s1', room({ parentSpaceId: 'parent-1' }), actor),
      ).rejects.toMatchObject({
        reason: PracticeErrorReason.PARENT_NOT_ACTIVE,
      });
    }
  });

  it('la unidad tiene que ser de la sede; si lo es, crea el vínculo OWNER', async () => {
    const mal = build();
    await expect(
      mal.service.create('s1', room({ clinicalUnitId: 'u9' }), actor),
    ).rejects.toMatchObject({ reason: PracticeErrorReason.UNIT_SITE_MISMATCH });
    const bien = build();
    bien.unitsRepo.findBySite.mockResolvedValue([
      { id: 'u1', statusConceptId: PRAC.UNIT_ACTIVE },
    ]);
    await bien.service.create('s1', room({ clinicalUnitId: 'u1' }), actor);
    expect(bien.assignmentsRepo.create).toHaveBeenCalledWith(
      bien.tx,
      expect.objectContaining({
        tenantId: TENANT_A,
        clinicalUnitId: 'u1',
        careSpaceId: 'new-1',
      }),
    );
    const retirada = build();
    retirada.unitsRepo.findBySite.mockResolvedValue([
      { id: 'u1', statusConceptId: PRAC.UNIT_RETIRED },
    ]);
    await expect(
      retirada.service.create('s1', room({ clinicalUnitId: 'u1' }), actor),
    ).rejects.toMatchObject({ reason: PracticeErrorReason.UNIT_NOT_AVAILABLE });
  });

  it('los errores de la autorización de la sede se propagan sin tocar nada', async () => {
    const d = build();
    d.context.site.mockRejectedValue(
      new ResourceNotFoundException('Sitio no encontrado'),
    );
    await expect(d.service.create('s1', room(), actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.rulesRepo.loadRuleSet).not.toHaveBeenCalled();
    expect(d.spacesRepo.create).not.toHaveBeenCalled();
  });
});

describe('CareSpaceCreationService.bulk', () => {
  const body = (extra: Record<string, unknown> = {}) => ({
    parentSpaceId: 'parent-1',
    formCode: 'LOC_FORM_BED',
    functionCode: 'SPACE_FN_BED_STANDARD',
    codePattern: '301-{A..H}',
    namePattern: 'Cama 301-{A..H}',
    bedCategoryCode: 'BED_CAT_PRIVATE',
    censable: true,
    ...extra,
  });

  it('crea 8 camas, una revisión y un evento por espacio', async () => {
    const d = build();
    d.spacesRepo.findByIdInTenant.mockResolvedValue(parentOf('LOC_FORM_ROOM'));
    const res = await d.service.bulk('s1', body(), actor, 'req-2');
    expect(res.created).toHaveLength(8);
    expect(d.created.map((s) => s.code)).toEqual(
      'ABCDEFGH'.split('').map((l) => `301-${l}`),
    );
    expect(d.created.map((s) => s.name)[3]).toBe('Cama 301-D');
    expect(d.historyRepo.append).toHaveBeenCalledTimes(8);
    expect(d.events.publish).toHaveBeenCalledTimes(8);
    expect(
      d.created.every(
        (s) =>
          s.statusConceptId === PRAC.SPACE_PLANNED && s.tenantId === TENANT_A,
      ),
    ).toBe(true);
  });

  it('si un código choca no se crea ninguno (todo o nada)', async () => {
    const d = build();
    d.spacesRepo.findByIdInTenant.mockResolvedValue(parentOf('LOC_FORM_ROOM'));
    d.spacesRepo.takenCodes.mockResolvedValue(new Set(['301-C']));
    const error = await d.service
      .bulk('s1', body(), actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect((error as any).details.rows).toEqual([
      { line: 3, errors: [{ field: 'code', reason: 'SPACE_CODE_TAKEN' }] },
    ]);
    expect(d.created).toHaveLength(0);
    expect(d.spacesRepo.create).not.toHaveBeenCalled();
    expect(d.events.publish).not.toHaveBeenCalled();
  });

  it('una fila que rompe la regla padre→hijo cancela todo el lote', async () => {
    const d = build();
    d.spacesRepo.findByIdInTenant.mockResolvedValue(parentOf('LOC_FORM_LEVEL'));
    await expect(d.service.bulk('s1', body(), actor)).rejects.toMatchObject({
      reason: PracticeErrorReason.SPACE_BATCH_INVALID,
    });
    expect(d.spacesRepo.create).not.toHaveBeenCalled();
  });

  it('un patrón sin rango, o con más de 200, es 422 SPACE_BULK_PATTERN_INVALID', async () => {
    for (const codePattern of ['SIN-RANGO', 'X-{1..201}']) {
      const d = build();
      d.spacesRepo.findByIdInTenant.mockResolvedValue(
        parentOf('LOC_FORM_ROOM'),
      );
      await expect(
        d.service.bulk('s1', body({ codePattern }), actor),
      ).rejects.toMatchObject({
        reason: PracticeErrorReason.SPACE_BULK_PATTERN_INVALID,
      });
    }
  });
});

describe('CareSpaceCreationService.import', () => {
  const edif = {
    code: 'E',
    name: 'Edificio',
    formCode: 'LOC_FORM_BUILDING',
    functionCode: 'SPACE_FN_BUILDING_GENERIC',
  };
  const piso = {
    code: 'P',
    name: 'Piso',
    formCode: 'LOC_FORM_LEVEL',
    functionCode: 'SPACE_FN_LEVEL_GENERIC',
    parentCode: 'E',
  };
  const hab = {
    code: 'H',
    name: 'Hab',
    formCode: 'LOC_FORM_ROOM',
    functionCode: 'SPACE_FN_CONSULTING_ROOM',
    parentCode: 'P',
  };

  it('dryRun devuelve el resultado por línea y no escribe', async () => {
    const d = build();
    const res = await d.service.import('s1', [edif, piso, hab], true, actor);
    expect(res).toEqual({
      ok: true,
      rows: [1, 2, 3].map((line) => ({ line, status: 'ok', errors: [] })),
    });
    expect(d.spacesRepo.create).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('con errores devuelve campo y motivo por línea (con la línea del cliente) y no crea, ni con dryRun=false', async () => {
    const d = build();
    d.spacesRepo.takenCodes.mockResolvedValue(new Set(['X']));
    const filas = [
      { ...edif, line: 10 },
      {
        code: 'B',
        name: 'Cama',
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
        parentCode: 'E',
        line: 11,
      },
      {
        code: 'X',
        name: 'Repetido',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_TYPE_ROOM',
        parentCode: 'E',
        line: 12,
      },
      {
        code: 'N',
        name: 'Sin padre',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_TYPE_ROOM',
        parentCode: 'NO',
        line: 13,
      },
    ];
    for (const dryRun of [true, false]) {
      const res = await d.service.import('s1', filas, dryRun, actor);
      expect(res.ok).toBe(false);
      expect(
        res.rows.filter((r) => r.status === 'error').map((r) => r.line),
      ).toEqual([11, 12, 13]);
      expect(res.rows[1].errors[0]).toEqual({
        field: 'formCode',
        reason: 'SPACE_PARENT_RULE',
      });
      expect(res.rows[2].errors[0]).toEqual({
        field: 'code',
        reason: 'SPACE_CODE_TAKEN',
      });
      expect(res.rows[3].errors[0].field).toBe('parentCode');
      expect(res.created).toBeUndefined();
    }
    expect(d.spacesRepo.create).not.toHaveBeenCalled();
  });

  it('dryRun=false con todo válido crea los padres antes que los hijos aunque el archivo vaya al revés', async () => {
    const d = build();
    const res = await d.service.import('s1', [hab, piso, edif], false, actor);
    expect(res).toMatchObject({ ok: true, created: 3 });
    expect(d.created.map((s) => s.code)).toEqual(['E', 'P', 'H']);
    expect(d.created[1].parentSpaceId).toBe(d.created[0].id);
    expect(d.created[2].parentSpaceId).toBe(d.created[1].id);
    expect(
      d.created.every((s) => s.statusConceptId === PRAC.SPACE_PLANNED),
    ).toBe(true);
  });

  it('un código repetido dentro del archivo y un ciclo de parentCode se reportan', async () => {
    const d = build();
    const repetido = await d.service.import(
      's1',
      [edif, { ...edif, name: 'Otra' }],
      true,
      actor,
    );
    expect(repetido.rows[1].errors[0]).toEqual({
      field: 'code',
      reason: 'SPACE_CODE_TAKEN',
    });
    const ciclo = await d.service.import(
      's1',
      [
        {
          code: 'A',
          name: 'A',
          formCode: 'LOC_FORM_AREA',
          functionCode: 'SPACE_FN_AREA_GENERIC',
          parentCode: 'B',
        },
        {
          code: 'B',
          name: 'B',
          formCode: 'LOC_FORM_AREA',
          functionCode: 'SPACE_FN_AREA_GENERIC',
          parentCode: 'A',
        },
      ],
      true,
      actor,
    );
    expect(ciclo.ok).toBe(false);
    expect(ciclo.rows[0].errors.map((e) => e.reason)).toContain('SPACE_CYCLE');
  });

  it('más de 200 filas o ninguna es 422', async () => {
    const d = build();
    await expect(d.service.import('s1', [], true, actor)).rejects.toMatchObject(
      { reason: PracticeErrorReason.SPACE_BULK_LIMIT },
    );
    const muchas = Array.from({ length: 201 }, (_v, i) => ({
      code: `C${i}`,
      name: 'x',
    }));
    await expect(
      d.service.import('s1', muchas, true, actor),
    ).rejects.toMatchObject({ reason: PracticeErrorReason.SPACE_BULK_LIMIT });
  });

  it('la importación nunca activa: activate se ignora', async () => {
    const d = build();
    await d.service.import('s1', [{ ...edif, activate: true }], false, actor);
    expect(d.created[0].statusConceptId).toBe(PRAC.SPACE_PLANNED);
  });
});
