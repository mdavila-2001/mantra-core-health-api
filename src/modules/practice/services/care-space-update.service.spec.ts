import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { FORMS, FUNCTIONS, REGULATORY } from '../infrastructure-catalog';
import { RowVersionMismatchException } from '../http/row-version';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import { CareSpaceUpdateService } from './care-space-update.service';
import {
  TENANT_A,
  actor,
  detailStub,
  makeSite,
  makeSpace,
  mockFn,
  ruleSet,
} from './infrastructure.testing';

function build(space: any, siteOverrides: Record<string, unknown> = {}) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const site = makeSite(siteOverrides);
  const context = {
    space: mockFn().mockResolvedValue({
      space,
      site,
      tenantId: TENANT_A,
      access: { level: 'ORG' },
    }),
    site: mockFn().mockResolvedValue({
      site,
      tenantId: TENANT_A,
      access: { level: 'ORG' },
    }),
  };
  const spacesRepo = {
    findBySiteAndCode: mockFn().mockResolvedValue(null),
    findByIdInTenant: mockFn().mockResolvedValue(null),
    subtreeIds: mockFn().mockResolvedValue([space.id]),
  };
  const rulesRepo = { loadRuleSet: mockFn().mockResolvedValue(ruleSet()) };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const reader = {
    detailsOf: mockFn(async (_tx: any, spaces: any[]) =>
      spaces.map(detailStub),
    ),
  };
  const service = new CareSpaceUpdateService(
    em as any,
    context as any,
    spacesRepo as any,
    rulesRepo as any,
    historyRepo as any,
    events as any,
    reader as any,
  );
  return {
    service,
    tx,
    context,
    spacesRepo,
    rulesRepo,
    historyRepo,
    events,
    reader,
  };
}

describe('CareSpaceUpdateService.patch', () => {
  it('con la versión vigente cambia, versiona y publica con los campos tocados', async () => {
    const space = makeSpace();
    const d = build(space);
    await d.service.patch(
      space.id,
      { name: 'Nuevo', areaM2: 12.5, description: 'x' },
      1,
      actor,
      'req-1',
    );
    expect(space).toMatchObject({
      name: 'Nuevo',
      areaM2: '12.5',
      description: 'x',
    });
    expect(d.tx.flush).toHaveBeenCalled();
    expect(d.historyRepo.append).toHaveBeenCalledWith(
      d.tx,
      'care_spaces',
      space.id,
      expect.objectContaining({
        tenantId: TENANT_A,
        changedByUserId: actor.id,
      }),
    );
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.care_space.updated',
        correlationId: 'req-1',
        payload: expect.objectContaining({
          changedFields: expect.arrayContaining([
            'name',
            'areaM2',
            'description',
          ]),
        }),
      }),
    );
  });

  it('una versión vieja es 412 y no toca nada (antes de validar el cuerpo)', async () => {
    const space = makeSpace({ rowVersion: 4 });
    const d = build(space);
    const error = await d.service
      .patch(space.id, { name: 'X' }, 3, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RowVersionMismatchException);
    expect(space.name).toBe('Espacio');
    expect(d.tx.flush).not.toHaveBeenCalled();
    expect(d.events.publish).not.toHaveBeenCalled();
  });

  it('un PATCH que no cambia nada no versiona ni publica', async () => {
    const space = makeSpace();
    const d = build(space);
    await d.service.patch(space.id, { name: space.name }, 1, actor);
    expect(d.tx.flush).not.toHaveBeenCalled();
    expect(d.historyRepo.append).not.toHaveBeenCalled();
    expect(d.events.publish).not.toHaveBeenCalled();
  });

  it('INV-09: code y formCode son inmutables una vez activo (422 SPACE_IMMUTABLE_FIELD); name sí cambia', async () => {
    const space = makeSpace({ statusConceptId: PRAC.SPACE_ACTIVE });
    const d = build(space);
    await expect(
      d.service.patch(space.id, { code: 'OTRO' }, 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.SPACE_IMMUTABLE_FIELD,
    });
    await expect(
      d.service.patch(
        space.id,
        { formCode: 'LOC_FORM_AREA', functionCode: 'SPACE_FN_AREA_GENERIC' },
        1,
        actor,
      ),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.SPACE_IMMUTABLE_FIELD,
    });
    expect(space.code).toBe('C-1');
    await d.service.patch(space.id, { name: 'Renombrado' }, 1, actor);
    expect(space.name).toBe('Renombrado');
  });

  it('mientras está planificado el código sí cambia, pero no a uno ya usado (409)', async () => {
    const space = makeSpace();
    const d = build(space);
    await d.service.patch(space.id, { code: 'NUEVO' }, 1, actor);
    expect(space.code).toBe('NUEVO');
    const choca = build(makeSpace());
    choca.spacesRepo.findBySiteAndCode.mockResolvedValue(
      makeSpace({ id: 'otro' }),
    );
    await expect(
      choca.service.patch('sp-1', { code: 'USADO' }, 1, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('un clausurado es de sólo lectura', async () => {
    const space = makeSpace({ statusConceptId: PRAC.SPACE_RETIRED });
    const d = build(space);
    await expect(
      d.service.patch(space.id, { name: 'X' }, 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
    });
  });

  it('atributos inválidos son 422 con el campo; un espacio activo no puede perder los datos que su perfil exige', async () => {
    const d = build(makeSpace());
    await expect(
      d.service.patch('sp-1', { asepsisCode: 'NO' }, 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.CATALOG_CODE_INVALID,
    });
    const quirofano = makeSpace({
      statusConceptId: PRAC.SPACE_ACTIVE,
      spaceTypeConceptId: FUNCTIONS.byInput('SPACE_FN_OPERATING_ROOM')!.id,
      areaM2: '36.00',
      pressureConceptId: 'p',
      airChangesPerHour: '20.00',
      hvacValidatedOn: new Date(),
    });
    const activo = build(quirofano);
    await expect(
      activo.service.patch(quirofano.id, { areaM2: null }, 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.SPACE_PROFILE_INCOMPLETE,
    });
  });

  it('la tipología se revalida al cambiar la función', async () => {
    const puesto = build(makeSpace(), {
      facilityTypologyConceptId: REGULATORY.typology.byInput(
        'TYPOLOGY_HEALTH_POST',
      )!.id,
    });
    await expect(
      puesto.service.patch(
        'sp-1',
        { functionCode: 'SPACE_FN_OPERATING_ROOM' },
        1,
        actor,
      ),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.TYPOLOGY_NOT_ALLOWED,
    });
  });

  it('un espacio de otro tenant o de otra sucursal responde lo que diga el contexto (404) sin mirar el cuerpo', async () => {
    const d = build(makeSpace());
    d.context.space.mockRejectedValue(
      new ResourceNotFoundException('Espacio no encontrado'),
    );
    await expect(
      d.service.patch('x', { name: 'X' }, 1, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.rulesRepo.loadRuleSet).not.toHaveBeenCalled();
  });
});

describe('CareSpaceUpdateService.move', () => {
  const parent = (form: string, extra: Record<string, unknown> = {}) =>
    makeSpace({
      id: 'np',
      formConceptId: FORMS.byInput(form)!.id,
      statusConceptId: PRAC.SPACE_ACTIVE,
      ...extra,
    });

  it('mueve bajo un padre válido y publica moved con desde/hasta', async () => {
    const space = makeSpace({ parentSpaceId: 'viejo' });
    const d = build(space);
    d.spacesRepo.findByIdInTenant.mockResolvedValue(
      parent('LOC_FORM_BUILDING'),
    );
    await d.service.move(space.id, 'np', 1, actor, 'req-9');
    expect(space.parentSpaceId).toBe('np');
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.care_space.moved',
        payload: expect.objectContaining({
          fromParentSpaceId: 'viejo',
          toParentSpaceId: 'np',
        }),
      }),
    );
    expect(d.historyRepo.append).toHaveBeenCalledTimes(1);
  });

  it('INV-03: bajo sí mismo o bajo un descendiente es 422 SPACE_CYCLE', async () => {
    const space = makeSpace({ formConceptId: FORMS.byInput('AREA')!.id });
    const d = build(space);
    d.spacesRepo.findByIdInTenant.mockResolvedValue(parent('LOC_FORM_AREA'));
    d.spacesRepo.subtreeIds.mockResolvedValue([space.id, 'np']);
    await expect(
      d.service.move(space.id, 'np', 1, actor),
    ).rejects.toMatchObject({ reason: PracticeErrorReason.SPACE_CYCLE });
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('INV-04: la regla padre→hijo se aplica al mover; a la raíz sólo formas raíz', async () => {
    const cama = makeSpace({
      formConceptId: FORMS.byInput('BED')!.id,
      spaceTypeConceptId: FUNCTIONS.byInput('SPACE_FN_BED_STANDARD')!.id,
      parentSpaceId: 'hab',
    });
    const d = build(cama);
    d.spacesRepo.findByIdInTenant.mockResolvedValue(parent('LOC_FORM_LEVEL'));
    await expect(d.service.move(cama.id, 'np', 1, actor)).rejects.toMatchObject(
      { reason: PracticeErrorReason.SPACE_PARENT_RULE },
    );
    await expect(
      build(cama).service.move(cama.id, null, 1, actor),
    ).rejects.toMatchObject({ reason: PracticeErrorReason.SPACE_PARENT_RULE });
  });

  it('el nuevo padre debe existir en el tenant (404), ser de la misma sede y estar abierto', async () => {
    const space = makeSpace();
    const ajeno = build(space);
    await expect(
      ajeno.service.move(space.id, 'np', 1, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    const otraSede = build(space);
    otraSede.spacesRepo.findByIdInTenant.mockResolvedValue(
      parent('LOC_FORM_BUILDING', { practiceSiteId: 's9' }),
    );
    await expect(
      otraSede.service.move(space.id, 'np', 1, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.PARENT_SITE_MISMATCH,
    });
    const suspendido = build(space);
    suspendido.spacesRepo.findByIdInTenant.mockResolvedValue(
      parent('LOC_FORM_BUILDING', { statusConceptId: PRAC.SPACE_SUSPENDED }),
    );
    await expect(
      suspendido.service.move(space.id, 'np', 1, actor),
    ).rejects.toMatchObject({ reason: PracticeErrorReason.PARENT_NOT_ACTIVE });
  });

  it('un activo no cuelga de un padre sin activar; mover al mismo padre es un no-op; versión vieja es 412', async () => {
    const activo = makeSpace({ statusConceptId: PRAC.SPACE_ACTIVE });
    const d = build(activo);
    d.spacesRepo.findByIdInTenant.mockResolvedValue(
      parent('LOC_FORM_BUILDING', { statusConceptId: PRAC.SPACE_PLANNED }),
    );
    await expect(
      d.service.move(activo.id, 'np', 1, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    const igual = makeSpace({ parentSpaceId: 'np' });
    const noop = build(igual);
    await noop.service.move(igual.id, 'np', 1, actor);
    expect(noop.tx.flush).not.toHaveBeenCalled();
    await expect(
      build(makeSpace({ rowVersion: 3 })).service.move('sp-1', null, 1, actor),
    ).rejects.toBeInstanceOf(RowVersionMismatchException);
  });
});
