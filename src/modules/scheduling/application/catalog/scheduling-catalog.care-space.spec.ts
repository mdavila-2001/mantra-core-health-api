import { jest } from '@jest/globals';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { SCHED } from '../../domain/scheduling.concepts';
import { SchedulingErrorReason } from '../../scheduling.error-reasons';
import { createCatalogService } from './scheduling-catalog.testing';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const RESOURCE = '22222222-2222-4222-8222-222222222222';
const SPACE = '33333333-3333-4333-8333-333333333333';
const SITE = '44444444-4444-4444-8444-444444444444';
const TEMPLATE = '55555555-5555-4555-8555-555555555555';
const admin = { id: 'user-1', roles: ['SCHEDULING_ADMIN'] } as any;

const rules = [{ dayOfWeek: 1, startTime: '14:00:00', endTime: '14:30:00' }];

/** El catálogo con sus colaboradores de F5d simulados, para ver qué le pide a cada uno. */
function build() {
  const tx = { flush: mockFn() };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const resource = {
    id: RESOURCE,
    tenantId: TENANT,
    timeZone: 'America/La_Paz',
    resourceRefType: 'health_practitioner_profiles',
    resourceRefId: 'hp-1',
  };
  const catalogRepo = {
    findResourceById: mockFn().mockResolvedValue(resource),
    createTemplate: mockFn().mockReturnValue({ id: TEMPLATE }),
    createRule: mockFn(),
    findRulesByResourceOwner: mockFn().mockResolvedValue([]),
    findTemplateById: mockFn(),
    findRulesByTemplate: mockFn().mockResolvedValue([]),
    deleteRulesByTemplate: mockFn().mockResolvedValue(0),
    createException: mockFn().mockReturnValue({ id: 'exc-1' }),
    findOpenSlotsInWindow: mockFn().mockResolvedValue([]),
    findExceptionById: mockFn(),
    removeException: mockFn(),
    findSlotsOfResourceForUpdate: mockFn().mockResolvedValue([]),
    findSlotsOverlappingForUpdate: mockFn().mockResolvedValue([]),
    findSlotsByTemplateInRange: mockFn().mockResolvedValue([]),
    createSlot: mockFn(),
    reactivateTemplate: mockFn(),
  };
  const careSpaces = {
    assertResourceInActiveTenant: mockFn(),
    attach: mockFn().mockResolvedValue({ id: SPACE, practiceSiteId: SITE }),
    assertNoOverlap: mockFn().mockResolvedValue(undefined),
    assertReactivable: mockFn().mockResolvedValue(undefined),
    announce: mockFn().mockResolvedValue(undefined),
  };
  const slotSync = {
    unavailableWindows: mockFn().mockResolvedValue([]),
    coveredSlotIds: mockFn().mockResolvedValue(new Set()),
  };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  const service = createCatalogService({
    em,
    catalogRepo,
    logger: { setContext: mockFn(), info: mockFn(), warn: mockFn() },
    affiliations: { evaluate: mockFn(async () => 'sin-vinculos') },
    professionalTime: {
      assertRangeFree: mockFn(),
      commitments: mockFn(async () => []),
      confirmedBookings: mockFn(async () => []),
    },
    noticeRepo: {},
    notices: {},
    careSpaces,
    slotSync,
    outbox,
  });
  return { service, tx, catalogRepo, careSpaces, slotSync, outbox, resource };
}

describe('createTemplate · horario por espacio (F5d)', () => {
  it('sin espacio no ata nada, no comprueba solape de espacio y escribe el tenant del recurso', async () => {
    const d = build();
    const res = await d.service.createTemplate(
      RESOURCE,
      { name: 'H', rules } as any,
      admin,
    );
    expect(d.careSpaces.attach).not.toHaveBeenCalled();
    expect(d.careSpaces.assertNoOverlap).not.toHaveBeenCalled();
    expect(d.careSpaces.announce).not.toHaveBeenCalled();
    expect(d.catalogRepo.createTemplate).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ tenantId: TENANT, careSpaceId: undefined }),
    );
    expect(res).not.toHaveProperty('careSpaceId');
  });

  it('con espacio: lo ata, comprueba el solape con las franjas y la vigencia, lo escribe y lo anuncia', async () => {
    const d = build();
    const res = await d.service.createTemplate(
      RESOURCE,
      {
        name: 'H',
        rules,
        careSpaceId: SPACE,
        validFrom: '2026-11-01T00:00:00Z',
        validTo: '2026-12-01T00:00:00Z',
      } as any,
      admin,
    );
    expect(d.careSpaces.attach).toHaveBeenCalledWith(
      d.tx,
      d.resource,
      SPACE,
      admin,
    );
    expect(d.careSpaces.assertNoOverlap).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        careSpaceId: SPACE,
        bands: rules,
        validFrom: new Date('2026-11-01T00:00:00Z'),
        validTo: new Date('2026-12-01T00:00:00Z'),
      }),
    );
    expect(d.catalogRepo.createTemplate).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ tenantId: TENANT, careSpaceId: SPACE }),
    );
    expect(d.careSpaces.announce).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        templateId: TEMPLATE,
        careSpaceId: SPACE,
        previousCareSpaceId: null,
        siteId: SITE,
      }),
    );
    expect(res).toMatchObject({ careSpaceId: SPACE });
  });

  it('el solape se comprueba antes de escribir la plantilla: si falla no queda nada', async () => {
    const d = build();
    d.careSpaces.assertNoOverlap.mockRejectedValue(
      new PreconditionFailedException(
        'x',
        undefined,
        SchedulingErrorReason.TEMPLATE_RULE_OVERLAP_CARE_SPACE,
      ),
    );
    await expect(
      d.service.createTemplate(
        RESOURCE,
        { name: 'H', rules, careSpaceId: SPACE } as any,
        admin,
      ),
    ).rejects.toMatchObject({
      reason: SchedulingErrorReason.TEMPLATE_RULE_OVERLAP_CARE_SPACE,
    });
    expect(d.catalogRepo.createTemplate).not.toHaveBeenCalled();
  });

  it('un recurso de otra organización es 404 antes que 403 y antes de leer el espacio', async () => {
    const d = build();
    d.careSpaces.assertResourceInActiveTenant.mockImplementation(() => {
      throw new ResourceNotFoundException('Recurso no encontrado');
    });
    await expect(
      d.service.createTemplate(
        RESOURCE,
        { name: 'H', rules, careSpaceId: SPACE } as any,
        admin,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.careSpaces.attach).not.toHaveBeenCalled();
  });
});

describe('updateTemplate · el espacio de un horario ya publicado', () => {
  const template = (over: Record<string, unknown> = {}) => ({
    id: TEMPLATE,
    resourceId: RESOURCE,
    name: 'H',
    statusConceptId: CONCEPTS.TEMPLATE_PUBLISHED,
    careSpaceId: undefined,
    validFrom: undefined,
    validTo: undefined,
    flexibleHours: false,
    ...over,
  });

  it('omitir careSpaceId lo conserva y no vuelve a atar', async () => {
    const d = build();
    d.catalogRepo.findTemplateById.mockResolvedValue(
      template({ careSpaceId: SPACE }),
    );
    await d.service.updateTemplate(TEMPLATE, { name: 'Nuevo' } as any, admin);
    expect(d.careSpaces.attach).not.toHaveBeenCalled();
    expect(d.careSpaces.announce).not.toHaveBeenCalled();
    // Pero el solape se vuelve a comprobar con lo que queda (la plantilla sigue en el espacio).
    expect(d.careSpaces.assertNoOverlap).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ careSpaceId: SPACE, templateId: TEMPLATE }),
    );
  });

  it('un id nuevo la ata (mismas reglas que al publicar), comprueba solape con las franjas nuevas y anuncia el cambio', async () => {
    const d = build();
    const t = template();
    d.catalogRepo.findTemplateById.mockResolvedValue(t);
    const res = await d.service.updateTemplate(
      TEMPLATE,
      { careSpaceId: SPACE, rules } as any,
      admin,
    );
    expect(d.careSpaces.attach).toHaveBeenCalledWith(
      d.tx,
      d.resource,
      SPACE,
      admin,
    );
    expect(d.careSpaces.assertNoOverlap).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ bands: rules, templateId: TEMPLATE }),
    );
    expect(t.careSpaceId).toBe(SPACE);
    expect(d.careSpaces.announce).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        careSpaceId: SPACE,
        previousCareSpaceId: null,
      }),
    );
    expect(res).toMatchObject({ careSpaceId: SPACE });
  });

  it('null suelta el espacio: escribe NULL, no comprueba solape y anuncia con el anterior', async () => {
    const d = build();
    const t = template({ careSpaceId: SPACE });
    d.catalogRepo.findTemplateById.mockResolvedValue(t);
    await d.service.updateTemplate(
      TEMPLATE,
      { careSpaceId: null } as any,
      admin,
    );
    expect(d.careSpaces.attach).not.toHaveBeenCalled();
    expect(d.careSpaces.assertNoOverlap).not.toHaveBeenCalled();
    expect((t as any).careSpaceId).toBeNull();
    expect(d.careSpaces.announce).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        careSpaceId: null,
        previousCareSpaceId: SPACE,
      }),
    );
  });

  it('una plantilla retirada no ocupa el espacio: no se compara', async () => {
    const d = build();
    d.catalogRepo.findTemplateById.mockResolvedValue(
      template({
        careSpaceId: SPACE,
        statusConceptId: CONCEPTS.TEMPLATE_RETIRED,
      }),
    );
    await d.service.updateTemplate(TEMPLATE, { name: 'x' } as any, admin);
    expect(d.careSpaces.assertNoOverlap).not.toHaveBeenCalled();
  });
});

describe('reactivateTemplate · vuelve a ocupar el espacio', () => {
  it('vuelve a comprobar el solape con las franjas de la plantilla', async () => {
    const d = build();
    const t = {
      id: TEMPLATE,
      resourceId: RESOURCE,
      statusConceptId: CONCEPTS.TEMPLATE_RETIRED,
      careSpaceId: SPACE,
    };
    d.catalogRepo.findTemplateById.mockResolvedValue(t);
    d.catalogRepo.findRulesByTemplate.mockResolvedValue(rules);
    await d.service.reactivateTemplate(TEMPLATE, admin);
    expect(d.careSpaces.assertReactivable).toHaveBeenCalledWith(
      d.tx,
      d.resource,
      t,
      rules,
    );
    expect(d.catalogRepo.reactivateTemplate).toHaveBeenCalled();
  });

  it('si el espacio ya lo ocupa otro, no se reactiva', async () => {
    const d = build();
    d.catalogRepo.findTemplateById.mockResolvedValue({
      id: TEMPLATE,
      resourceId: RESOURCE,
      statusConceptId: CONCEPTS.TEMPLATE_RETIRED,
      careSpaceId: SPACE,
    });
    d.careSpaces.assertReactivable.mockRejectedValue(
      new PreconditionFailedException(
        'x',
        undefined,
        SchedulingErrorReason.TEMPLATE_RULE_OVERLAP_CARE_SPACE,
      ),
    );
    await expect(
      d.service.reactivateTemplate(TEMPLATE, admin),
    ).rejects.toMatchObject({
      reason: SchedulingErrorReason.TEMPLATE_RULE_OVERLAP_CARE_SPACE,
    });
    expect(d.catalogRepo.reactivateTemplate).not.toHaveBeenCalled();
  });
});

describe('excepciones de disponibilidad · tenant y origen', () => {
  const exceptionDto = {
    exceptionType: 'VACATION',
    startAt: '2026-11-02T12:00:00Z',
    endAt: '2026-11-02T14:00:00Z',
  } as any;

  it('crear escribe el tenant del recurso y el origen MANUAL, y publica el evento con sourceKind', async () => {
    const d = build();
    await d.service.createException(RESOURCE, exceptionDto, admin);
    expect(d.catalogRepo.createException).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        sourceKindConceptId: SCHED.EXC_SRC_MANUAL,
      }),
    );
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        eventType: 'scheduling.availability_exception.created',
        payloadJson: expect.objectContaining({
          sourceKind: 'MANUAL',
          sourceRefId: null,
        }),
      }),
    );
  });

  it('crear en el recurso de otra organización es 404 y no escribe', async () => {
    const d = build();
    d.careSpaces.assertResourceInActiveTenant.mockImplementation(() => {
      throw new ResourceNotFoundException('Recurso no encontrado');
    });
    await expect(
      d.service.createException(RESOURCE, exceptionDto, admin),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.catalogRepo.createException).not.toHaveBeenCalled();
  });

  it.each([SCHED.EXC_SRC_CARE_SPACE_BLOCK, SCHED.EXC_SRC_EQUIPMENT_STATUS])(
    'editar o quitar una excepción de origen %s es 422 EXCEPTION_SOURCE_READ_ONLY',
    async (sourceKindConceptId) => {
      const d = build();
      d.catalogRepo.findExceptionById.mockResolvedValue({
        id: 'exc-1',
        resourceId: RESOURCE,
        sourceKindConceptId,
        startAt: new Date('2026-11-02T12:00:00Z'),
        endAt: new Date('2026-11-02T14:00:00Z'),
      });
      await expect(
        d.service.updateException('exc-1', { reason: 'x' } as any, admin),
      ).rejects.toMatchObject({
        reason: SchedulingErrorReason.EXCEPTION_SOURCE_READ_ONLY,
      });
      await expect(
        d.service.removeException('exc-1', admin),
      ).rejects.toMatchObject({
        reason: SchedulingErrorReason.EXCEPTION_SOURCE_READ_ONLY,
      });
      expect(d.catalogRepo.removeException).not.toHaveBeenCalled();
    },
  );

  it('una excepción manual (o anterior a F5d, sin origen) se quita', async () => {
    const d = build();
    d.catalogRepo.findExceptionById.mockResolvedValue({
      id: 'exc-1',
      resourceId: RESOURCE,
      sourceKindConceptId: undefined,
    });
    await d.service.removeException('exc-1', admin);
    expect(d.catalogRepo.removeException).toHaveBeenCalled();
  });

  it('quitar la excepción de otra organización es 404', async () => {
    const d = build();
    d.catalogRepo.findExceptionById.mockResolvedValue({
      id: 'exc-1',
      resourceId: RESOURCE,
      sourceKindConceptId: undefined,
    });
    d.careSpaces.assertResourceInActiveTenant.mockImplementation(() => {
      throw new ResourceNotFoundException('Recurso no encontrado');
    });
    await expect(
      d.service.removeException('exc-1', admin),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('generateSlots · no ofrece lo que el espacio o el equipo no puede atender', () => {
  it('omite los cupos que caen en un tramo no disponible y lo cuenta aparte', async () => {
    const d = build();
    d.catalogRepo.findTemplateById.mockResolvedValue({
      id: TEMPLATE,
      resourceId: RESOURCE,
      careSpaceId: SPACE,
      flexibleHours: false,
      slotMinutes: 30,
    });
    d.catalogRepo.findRulesByTemplate.mockResolvedValue([
      {
        dayOfWeek: 1,
        startTime: '14:00:00',
        endTime: '15:00:00',
        slotMinutes: 30,
      },
    ]);
    // El lunes 2026-11-02 a las 14:00 locales (UTC−4) son las 18:00Z.
    d.slotSync.unavailableWindows.mockResolvedValue([
      {
        start: new Date('2026-11-02T18:00:00Z'),
        end: new Date('2026-11-02T18:30:00Z'),
      },
    ]);
    const res = await d.service.generateSlots(
      TEMPLATE,
      { from: '2026-11-02T00:00:00Z', to: '2026-11-02T23:59:59Z' } as any,
      admin,
    );
    expect(res).toMatchObject({ created: 1, omittedByCareSpaceBlock: 1 });
    expect(d.catalogRepo.createSlot).toHaveBeenCalledTimes(1);
    expect(d.slotSync.unavailableWindows).toHaveBeenCalledWith(
      d.tx,
      TENANT,
      expect.objectContaining({ careSpaceIds: [undefined, SPACE] }),
    );
  });

  it('sin tramos no disponibles la respuesta conserva su forma de siempre', async () => {
    const d = build();
    d.catalogRepo.findTemplateById.mockResolvedValue({
      id: TEMPLATE,
      resourceId: RESOURCE,
      flexibleHours: false,
      slotMinutes: 30,
    });
    d.catalogRepo.findRulesByTemplate.mockResolvedValue([
      {
        dayOfWeek: 1,
        startTime: '14:00:00',
        endTime: '14:30:00',
        slotMinutes: 30,
      },
    ]);
    const res = await d.service.generateSlots(
      TEMPLATE,
      { from: '2026-11-02T00:00:00Z', to: '2026-11-02T23:59:59Z' } as any,
      admin,
    );
    expect(res).toEqual({
      templateId: TEMPLATE,
      created: 1,
      skipped: 0,
      omittedByCommitments: 0,
    });
  });
});
