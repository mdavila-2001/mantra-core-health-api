import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { MedicalGroupsService } from './medical-groups.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
} from '../../../common';
import { MEDICAL_GROUP_STATUS } from '../entities/medical_groups.entity';

/** Ejecuta la operación mock fn. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const DAY_MS = 24 * 60 * 60 * 1000;

const creator = {
  id: 'user-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;
const invitee = {
  id: 'user-2',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-2',
} as any;
const stranger = {
  id: 'user-9',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-9',
} as any;
const withoutProfile = { id: 'user-0', roles: ['PRACTITIONER'] } as any;

const service1 = {
  id: 'svc-1',
  practiceId: 'pr1',
  isActive: true,
  descriptionText: 'Condiciones del servicio',
};

const baseDto = {
  serviceCatalogId: 'svc-1',
  scheduledAt: new Date(Date.now() + 3 * DAY_MS).toISOString(),
  locationText: 'Clínica Norte',
  members: [] as any[],
};

const forbidden = () =>
  new ForbiddenException('Sólo puede consultar su propia historia clínica.');

/** Grupo persistido, con los campos que lee el servicio. */
function groupRow(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'g-1',
    tenantId: 'tenant-1',
    practiceId: 'pr1',
    serviceCatalogId: 'svc-1',
    requestingPractitionerId: 'hp-1',
    patientProfileId: undefined,
    conditionId: undefined,
    scheduledAt: new Date(Date.now() + 3 * DAY_MS),
    locationText: 'Clínica Norte',
    termsText: '',
    status: MEDICAL_GROUP_STATUS.SCHEDULED,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    ...overrides,
  };
}

function memberRow(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'm-1',
    groupId: 'g-1',
    practitionerProfileId: 'hp-2',
    roleTitle: 'Anestesiólogo',
    agreedPaymentAmount: '100.00',
    isCreator: false,
    invitationStatus: 'PENDING',
    ...overrides,
  };
}

/** Construye el sistema bajo prueba con dependencias controladas. */
function build() {
  const concepts: any[] = [];
  const forked = {
    find: mockFn().mockResolvedValue(concepts),
    flush: mockFn().mockResolvedValue(undefined),
  };
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    persist: mockFn(),
  };
  const em = {
    fork: mockFn().mockReturnValue(forked),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const groupsRepo = {
    findById: mockFn(),
    create: mockFn((_em: unknown, data: any) => groupRow({ ...data })),
    findByIdsPage: mockFn().mockResolvedValue([]),
    findIdsByRequester: mockFn().mockResolvedValue([]),
  };
  const membersRepo = {
    findById: mockFn(),
    findByGroup: mockFn().mockResolvedValue([]),
    findManyByGroups: mockFn().mockResolvedValue([]),
    findGroupIdsByInvitee: mockFn().mockResolvedValue([]),
    findGroupIdsWithPendingInvites: mockFn().mockResolvedValue([]),
    hasPendingInvites: mockFn().mockResolvedValue(false),
    create: mockFn((_em: unknown, data: any) => memberRow({ ...data })),
  };
  const serviceCatalogRepo = { findById: mockFn().mockResolvedValue(service1) };
  // Por defecto el profesional pertenece a `pr1`, la práctica del servicio.
  const practiceTenantLookup = {
    findActivePracticeIdsForPractitioner: mockFn().mockResolvedValue(['pr1']),
    findTenantOfPractice: mockFn().mockResolvedValue('tenant-1'),
  };
  const practitionerProfilesRepo = {
    findById: mockFn().mockResolvedValue({ id: 'hp-2' }),
  };
  const patientProfilesRepo = {
    findById: mockFn().mockResolvedValue({ id: 'pat-1' }),
  };
  const conditionsRepo = {
    findById: mockFn(),
    findByPatient: mockFn().mockResolvedValue([]),
  };
  const clinicalRead = {
    assertCanReadHistory: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new MedicalGroupsService(
    em as any,
    groupsRepo as any,
    membersRepo as any,
    serviceCatalogRepo as any,
    practiceTenantLookup as any,
    practitionerProfilesRepo as any,
    patientProfilesRepo as any,
    conditionsRepo as any,
    clinicalRead as any,
    logger as any,
  );
  return {
    service,
    em,
    forked,
    tx,
    groupsRepo,
    membersRepo,
    serviceCatalogRepo,
    practiceTenantLookup,
    practitionerProfilesRepo,
    patientProfilesRepo,
    conditionsRepo,
    clinicalRead,
    concepts,
  };
}

type Deps = ReturnType<typeof build>;

/** Nada se persistió. */
function expectNoWrites(d: Deps) {
  expect(d.groupsRepo.create).not.toHaveBeenCalled();
  expect(d.membersRepo.create).not.toHaveBeenCalled();
  expect(d.tx.persist).not.toHaveBeenCalled();
  expect(d.tx.flush).not.toHaveBeenCalled();
}

describe('MedicalGroupsService.create', () => {
  it('sin paciente: crea el grupo y al creador como miembro ACCEPTED sin pago', async () => {
    const d = build();

    const dto = await d.service.create(baseDto as any, creator);

    expect(d.groupsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: 'tenant-1',
        practiceId: 'pr1',
        requestingPractitionerId: 'hp-1',
        status: MEDICAL_GROUP_STATUS.SCHEDULED,
      }),
    );
    expect(d.membersRepo.create).toHaveBeenCalledTimes(1);
    expect(d.membersRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        practitionerProfileId: 'hp-1',
        isCreator: true,
        invitationStatus: 'ACCEPTED',
        agreedPaymentAmount: '0.00',
      }),
    );
    expect(d.clinicalRead.assertCanReadHistory).not.toHaveBeenCalled();
    expect(dto.id).toBe('g-1');
  });

  it('con invitados queda PENDING_TEAM y cada invitado entra PENDING', async () => {
    const d = build();

    await d.service.create(
      {
        ...baseDto,
        members: [
          {
            practitionerProfileId: 'hp-2',
            roleTitle: 'Anestesiólogo',
            agreedPaymentAmount: '100.00',
          },
        ],
      } as any,
      creator,
    );

    expect(d.groupsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ status: MEDICAL_GROUP_STATUS.PENDING_TEAM }),
    );
    expect(d.membersRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        practitionerProfileId: 'hp-2',
        isCreator: false,
        invitationStatus: 'PENDING',
      }),
    );
  });

  it('une los términos del servicio con los adicionales', async () => {
    const d = build();

    await d.service.create(
      { ...baseDto, additionalTermsText: 'Adicional' } as any,
      creator,
    );

    expect(d.groupsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        termsText: 'Condiciones del servicio\n\nAdicional',
      }),
    );
  });

  it('401 si la cuenta no tiene perfil profesional, sin leer nada', async () => {
    const d = build();

    await expect(
      d.service.create(baseDto as any, withoutProfile),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(d.serviceCatalogRepo.findById).not.toHaveBeenCalled();
    expectNoWrites(d);
  });

  it('404 si el servicio no existe o está inactivo', async () => {
    const d = build();
    d.serviceCatalogRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.create(baseDto as any, creator),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);

    d.serviceCatalogRepo.findById.mockResolvedValue({
      ...service1,
      isActive: false,
    });
    await expect(
      d.service.create(baseDto as any, creator),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expectNoWrites(d);
  });

  it('404 (no 403) si el servicio es de una práctica ajena', async () => {
    const d = build();
    d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
      ['otra-practica'],
    );

    await expect(
      d.service.create(baseDto as any, creator),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expectNoWrites(d);
  });

  it('412 si pide diagnóstico sin paciente', async () => {
    const d = build();

    await expect(
      d.service.create({ ...baseDto, conditionId: 'c-1' } as any, creator),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expectNoWrites(d);
  });

  it('409 si un invitado se repite o es el propio creador', async () => {
    const d = build();
    const member = {
      practitionerProfileId: 'hp-2',
      roleTitle: 'Anestesiólogo',
      agreedPaymentAmount: '100.00',
    };

    await expect(
      d.service.create(
        { ...baseDto, members: [member, member] } as any,
        creator,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      d.service.create(
        {
          ...baseDto,
          members: [{ ...member, practitionerProfileId: 'hp-1' }],
        } as any,
        creator,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expectNoWrites(d);
  });

  it('404 si un invitado no existe', async () => {
    const d = build();
    d.practitionerProfilesRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.create(
        {
          ...baseDto,
          members: [
            {
              practitionerProfileId: 'hp-x',
              roleTitle: 'Cirujano',
              agreedPaymentAmount: '10.00',
            },
          ],
        } as any,
        creator,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expectNoWrites(d);
  });

  /*
   * MG-01 — la política clínica corre SIEMPRE que haya paciente, no sólo si
   * viene un diagnóstico. Un profesional de T1 no asocia a un paciente de T2.
   */
  describe('paciente (MG-01)', () => {
    it('paciente autorizado, sin diagnóstico: consulta la política y crea con el paciente', async () => {
      const d = build();

      await d.service.create(
        { ...baseDto, patientProfileId: 'pat-1' } as any,
        creator,
      );

      expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
        'pat-1',
        creator,
      );
      expect(d.groupsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ patientProfileId: 'pat-1' }),
      );
    });

    it('paciente autorizado con su diagnóstico: crea con paciente y diagnóstico', async () => {
      const d = build();
      d.conditionsRepo.findById.mockResolvedValue({
        id: 'c-1',
        patientProfileId: 'pat-1',
      });

      await d.service.create(
        { ...baseDto, patientProfileId: 'pat-1', conditionId: 'c-1' } as any,
        creator,
      );

      expect(d.groupsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          patientProfileId: 'pat-1',
          conditionId: 'c-1',
        }),
      );
    });

    it('paciente de otro tenant SIN diagnóstico: 404 MEDICAL_GROUP_PATIENT_NOT_AVAILABLE y no persiste nada', async () => {
      const d = build();
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(forbidden());

      const error = await d.service
        .create({ ...baseDto, patientProfileId: 'pat-t2' } as any, creator)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect((error as ResourceNotFoundException).getStatus()).toBe(404);
      expect((error as ResourceNotFoundException).reason).toBe(
        'MEDICAL_GROUP_PATIENT_NOT_AVAILABLE',
      );
      expectNoWrites(d);
    });

    it('paciente de otro tenant CON diagnóstico: el mismo 404 catalogado', async () => {
      const d = build();
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(forbidden());

      const error = await d.service
        .create(
          { ...baseDto, patientProfileId: 'pat-t2', conditionId: 'c-1' } as any,
          creator,
        )
        .catch((e: unknown) => e);

      expect((error as ResourceNotFoundException).reason).toBe(
        'MEDICAL_GROUP_PATIENT_NOT_AVAILABLE',
      );
      expect(d.conditionsRepo.findById).not.toHaveBeenCalled();
      expectNoWrites(d);
    });

    it('paciente inexistente: el MISMO 404 catalogado que el ajeno', async () => {
      const d = build();
      d.patientProfilesRepo.findById.mockResolvedValue(null);

      const error = await d.service
        .create({ ...baseDto, patientProfileId: 'pat-x' } as any, creator)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect((error as ResourceNotFoundException).reason).toBe(
        'MEDICAL_GROUP_PATIENT_NOT_AVAILABLE',
      );
      expectNoWrites(d);
    });

    it('un fallo que no es 403 de la política no se disfraza de 404', async () => {
      const d = build();
      const boom = new Error('base caída');
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(boom);

      await expect(
        d.service.create(
          { ...baseDto, patientProfileId: 'pat-1' } as any,
          creator,
        ),
      ).rejects.toBe(boom);
      expectNoWrites(d);
    });

    it('404 si el diagnóstico es de otro paciente o no existe', async () => {
      const d = build();
      d.conditionsRepo.findById.mockResolvedValue({
        id: 'c-1',
        patientProfileId: 'otro',
      });
      await expect(
        d.service.create(
          { ...baseDto, patientProfileId: 'pat-1', conditionId: 'c-1' } as any,
          creator,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);

      d.conditionsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.create(
          { ...baseDto, patientProfileId: 'pat-1', conditionId: 'c-1' } as any,
          creator,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expectNoWrites(d);
    });
  });
});

describe('MedicalGroupsService.findOne', () => {
  it('el creador lo ve', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(groupRow());
    d.membersRepo.findByGroup.mockResolvedValue([
      memberRow({ practitionerProfileId: 'hp-1', isCreator: true }),
    ]);

    const dto = await d.service.findOne('g-1', creator);

    expect(dto.id).toBe('g-1');
    expect(dto.members).toHaveLength(1);
  });

  it('un invitado (aún sin responder) lo ve', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(groupRow());
    d.membersRepo.findByGroup.mockResolvedValue([memberRow()]);

    await expect(d.service.findOne('g-1', invitee)).resolves.toBeDefined();
  });

  it('un tercero recibe el MISMO 404 que un grupo inexistente', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(groupRow());
    d.membersRepo.findByGroup.mockResolvedValue([memberRow()]);
    await expect(d.service.findOne('g-1', stranger)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );

    d.groupsRepo.findById.mockResolvedValue(null);
    await expect(d.service.findOne('g-x', stranger)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('sin perfil profesional: 404', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(groupRow());

    await expect(
      d.service.findOne('g-1', withoutProfile),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('pasada la semana de la cita lo cierra en la base la primera vez y lo informa cerrado', async () => {
    const d = build();
    const group = groupRow({ scheduledAt: new Date(Date.now() - 8 * DAY_MS) });
    d.groupsRepo.findById.mockResolvedValue(group);
    d.membersRepo.findByGroup.mockResolvedValue([
      memberRow({ practitionerProfileId: 'hp-1', isCreator: true }),
    ]);

    const dto = await d.service.findOne('g-1', creator);

    expect(dto.isClosed).toBe(true);
    expect(dto.status).toBe(MEDICAL_GROUP_STATUS.CLOSED);
    expect(group.closedAt).toBeInstanceOf(Date);
    expect(d.forked.flush).toHaveBeenCalledTimes(1);
  });
});

describe('MedicalGroupsService.list', () => {
  it('401 sin perfil profesional', async () => {
    const d = build();

    await expect(
      d.service.list('historico', withoutProfile, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('historico une creados y aceptados sin repetir', async () => {
    const d = build();
    d.groupsRepo.findIdsByRequester.mockResolvedValue(['g-1', 'g-2']);
    d.membersRepo.findGroupIdsByInvitee.mockResolvedValue(['g-2', 'g-3']);

    await d.service.list('historico', creator, {});

    expect(d.membersRepo.findGroupIdsByInvitee).toHaveBeenCalledWith(
      expect.anything(),
      'hp-1',
      'ACCEPTED',
    );
    const ids = d.groupsRepo.findByIdsPage.mock.calls[0][1];
    expect([...ids].sort()).toEqual(['g-1', 'g-2', 'g-3']);
  });

  it('recibidas lista las invitaciones PENDING del profesional', async () => {
    const d = build();
    d.membersRepo.findGroupIdsByInvitee.mockResolvedValue(['g-5']);

    await d.service.list('recibidas', invitee, {});

    expect(d.membersRepo.findGroupIdsByInvitee).toHaveBeenCalledWith(
      expect.anything(),
      'hp-2',
      'PENDING',
    );
    expect(d.groupsRepo.findByIdsPage.mock.calls[0][1]).toEqual(['g-5']);
  });

  it('enviadas acota a los grupos que creó con cargos sin responder', async () => {
    const d = build();
    d.groupsRepo.findIdsByRequester.mockResolvedValue(['g-1', 'g-2']);
    d.membersRepo.findGroupIdsWithPendingInvites.mockResolvedValue(['g-2']);

    await d.service.list('enviadas', creator, {});

    expect(d.membersRepo.findGroupIdsWithPendingInvites).toHaveBeenCalledWith(
      expect.anything(),
      ['g-1', 'g-2'],
    );
    expect(d.groupsRepo.findByIdsPage.mock.calls[0][1]).toEqual(['g-2']);
  });

  it('límite: con una fila más que el tope hay página siguiente con cursor, y se pide limit+1', async () => {
    const d = build();
    d.groupsRepo.findIdsByRequester.mockResolvedValue(['g-1', 'g-2', 'g-3']);
    d.groupsRepo.findByIdsPage.mockResolvedValue([
      groupRow({ id: 'g-1', createdAt: new Date('2026-10-03T00:00:00.000Z') }),
      groupRow({ id: 'g-2', createdAt: new Date('2026-10-02T00:00:00.000Z') }),
      groupRow({ id: 'g-3', createdAt: new Date('2026-10-01T00:00:00.000Z') }),
    ]);

    const page = await d.service.list('historico', creator, { limit: 2 });

    expect(d.groupsRepo.findByIdsPage).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      3,
      undefined,
    );
    expect(page.items.map((i) => i.id)).toEqual(['g-1', 'g-2']);
    expect(
      Buffer.from(page.nextCursor as string, 'base64url').toString('utf8'),
    ).toBe('2026-10-02T00:00:00.000Z');
  });

  it('el cursor se decodifica a la fecha y se pasa a la consulta; sin más filas no hay cursor', async () => {
    const d = build();
    d.groupsRepo.findIdsByRequester.mockResolvedValue(['g-1']);
    d.groupsRepo.findByIdsPage.mockResolvedValue([groupRow()]);
    const cursor = Buffer.from('2026-10-02T00:00:00.000Z', 'utf8').toString(
      'base64url',
    );

    const page = await d.service.list('historico', creator, { cursor });

    expect(d.groupsRepo.findByIdsPage.mock.calls[0][3]).toEqual(
      new Date('2026-10-02T00:00:00.000Z'),
    );
    expect(page.nextCursor).toBeNull();
  });

  it('cuenta los cargos pendientes no creadores y marca isCreator', async () => {
    const d = build();
    d.groupsRepo.findIdsByRequester.mockResolvedValue(['g-1']);
    d.groupsRepo.findByIdsPage.mockResolvedValue([groupRow()]);
    d.membersRepo.findManyByGroups.mockResolvedValue([
      memberRow({ isCreator: true, invitationStatus: 'ACCEPTED' }),
      memberRow({ id: 'm-2', invitationStatus: 'PENDING' }),
      memberRow({ id: 'm-3', invitationStatus: 'REJECTED' }),
    ]);

    const page = await d.service.list('historico', creator, {});

    expect(page.items[0].isCreator).toBe(true);
    expect(page.items[0].pendingMembersCount).toBe(1);
  });
});

describe('MedicalGroupsService.listPatientConditions', () => {
  it('con permiso devuelve los diagnósticos con su descripción y marca el más reciente', async () => {
    const d = build();
    d.conditionsRepo.findByPatient.mockResolvedValue([
      { id: 'c-1', codeConceptId: 'k-1', onsetAt: new Date('2026-09-01') },
      { id: 'c-2', codeConceptId: 'k-2', onsetAt: new Date('2026-01-01') },
    ]);
    d.forked.find.mockResolvedValue([
      { id: 'k-1', code: 'I10', display: 'Hipertensión' },
    ]);

    const res = await d.service.listPatientConditions('pat-1', creator);

    expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
      'pat-1',
      creator,
    );
    expect(res.map((c) => [c.id, c.code, c.isMostRecent])).toEqual([
      ['c-1', 'I10', true],
      ['c-2', 'k-2', false],
    ]);
  });

  it('sin diagnósticos devuelve vacío', async () => {
    const d = build();

    await expect(
      d.service.listPatientConditions('pat-1', creator),
    ).resolves.toEqual([]);
  });

  it('sin permiso sobre la historia propaga el 403 y no lee diagnósticos', async () => {
    const d = build();
    d.clinicalRead.assertCanReadHistory.mockRejectedValue(forbidden());

    await expect(
      d.service.listPatientConditions('pat-t2', creator),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.conditionsRepo.findByPatient).not.toHaveBeenCalled();
  });
});

describe('MedicalGroupsService.respondToInvitation', () => {
  it('aceptar la última invitación pendiente programa el grupo', async () => {
    const d = build();
    const group = groupRow({ status: MEDICAL_GROUP_STATUS.PENDING_TEAM });
    const member = memberRow();
    d.groupsRepo.findById.mockResolvedValue(group);
    d.membersRepo.findById.mockResolvedValue(member);
    d.membersRepo.hasPendingInvites.mockResolvedValue(false);

    await d.service.respondToInvitation('g-1', 'm-1', 'ACCEPTED', invitee);

    expect(member.invitationStatus).toBe('ACCEPTED');
    expect(member.respondedAt).toBeInstanceOf(Date);
    expect(group.status).toBe(MEDICAL_GROUP_STATUS.SCHEDULED);
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('límite: si quedan invitaciones pendientes el grupo sigue PENDING_TEAM', async () => {
    const d = build();
    const group = groupRow({ status: MEDICAL_GROUP_STATUS.PENDING_TEAM });
    d.groupsRepo.findById.mockResolvedValue(group);
    d.membersRepo.findById.mockResolvedValue(memberRow());
    d.membersRepo.hasPendingInvites.mockResolvedValue(true);

    await d.service.respondToInvitation('g-1', 'm-1', 'ACCEPTED', invitee);

    expect(group.status).toBe(MEDICAL_GROUP_STATUS.PENDING_TEAM);
  });

  it('rechazar no programa el grupo', async () => {
    const d = build();
    const group = groupRow({ status: MEDICAL_GROUP_STATUS.PENDING_TEAM });
    const member = memberRow();
    d.groupsRepo.findById.mockResolvedValue(group);
    d.membersRepo.findById.mockResolvedValue(member);

    await d.service.respondToInvitation('g-1', 'm-1', 'REJECTED', invitee);

    expect(member.invitationStatus).toBe('REJECTED');
    expect(group.status).toBe(MEDICAL_GROUP_STATUS.PENDING_TEAM);
    expect(d.membersRepo.hasPendingInvites).not.toHaveBeenCalled();
  });

  it('404 si el grupo no existe', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.respondToInvitation('g-x', 'm-1', 'ACCEPTED', invitee),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('404 si la solicitud no existe o es de otro grupo', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(groupRow());
    d.membersRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.respondToInvitation('g-1', 'm-x', 'ACCEPTED', invitee),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);

    d.membersRepo.findById.mockResolvedValue(memberRow({ groupId: 'g-otro' }));
    await expect(
      d.service.respondToInvitation('g-1', 'm-1', 'ACCEPTED', invitee),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('quien no es el invitado recibe 404, no 403, y la fila no cambia', async () => {
    const d = build();
    const member = memberRow();
    d.groupsRepo.findById.mockResolvedValue(groupRow());
    d.membersRepo.findById.mockResolvedValue(member);

    await expect(
      d.service.respondToInvitation('g-1', 'm-1', 'ACCEPTED', stranger),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(member.invitationStatus).toBe('PENDING');
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('412 si la solicitud ya fue respondida', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(groupRow());
    d.membersRepo.findById.mockResolvedValue(
      memberRow({ invitationStatus: 'ACCEPTED' }),
    );

    await expect(
      d.service.respondToInvitation('g-1', 'm-1', 'REJECTED', invitee),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('401 sin perfil profesional', async () => {
    const d = build();

    await expect(
      d.service.respondToInvitation('g-1', 'm-1', 'ACCEPTED', withoutProfile),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('MedicalGroupsService.requestReschedule', () => {
  const proposed = new Date(Date.now() + 10 * DAY_MS).toISOString();

  it('el creador aplica el cambio directo, sin pendiente', async () => {
    const d = build();
    const group = groupRow();
    d.groupsRepo.findById.mockResolvedValue(group);
    d.membersRepo.findByGroup.mockResolvedValue([]);

    await d.service.requestReschedule('g-1', proposed, creator);

    expect(group.scheduledAt.toISOString()).toBe(proposed);
    expect(group.status).toBe(MEDICAL_GROUP_STATUS.SCHEDULED);
    expect(group.proposedRescheduleAt).toBeUndefined();
  });

  it('un miembro aceptado propone: queda RESCHEDULE_PENDING con su propuesta', async () => {
    const d = build();
    const group = groupRow();
    const originalAt = group.scheduledAt;
    d.groupsRepo.findById.mockResolvedValue(group);
    d.membersRepo.findByGroup.mockResolvedValue([
      memberRow({ invitationStatus: 'ACCEPTED' }),
    ]);

    await d.service.requestReschedule('g-1', proposed, invitee);

    expect(group.status).toBe(MEDICAL_GROUP_STATUS.RESCHEDULE_PENDING);
    expect(group.proposedRescheduleAt.toISOString()).toBe(proposed);
    expect(group.proposedByPractitionerId).toBe('hp-2');
    expect(group.scheduledAt).toBe(originalAt);
  });

  it('404 si el grupo no existe', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.requestReschedule('g-x', proposed, creator),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('un invitado que aún no aceptó y un tercero reciben 404', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(groupRow());
    d.membersRepo.findByGroup.mockResolvedValue([memberRow()]);

    await expect(
      d.service.requestReschedule('g-1', proposed, invitee),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(
      d.service.requestReschedule('g-1', proposed, stranger),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('412 si el expediente ya está cerrado (inmutable)', async () => {
    const d = build();
    const group = groupRow({
      scheduledAt: new Date(Date.now() - 9 * DAY_MS),
      closedAt: new Date(Date.now() - DAY_MS),
    });
    d.groupsRepo.findById.mockResolvedValue(group);

    await expect(
      d.service.requestReschedule('g-1', proposed, creator),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('412 si la cita no está programada (pendiente de equipo)', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(
      groupRow({ status: MEDICAL_GROUP_STATUS.PENDING_TEAM }),
    );

    await expect(
      d.service.requestReschedule('g-1', proposed, creator),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('412 si la fecha propuesta es inválida y no cambia nada', async () => {
    const d = build();
    const group = groupRow();
    const originalAt = group.scheduledAt;
    d.groupsRepo.findById.mockResolvedValue(group);

    await expect(
      d.service.requestReschedule('g-1', 'no-es-fecha', creator),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(group.scheduledAt).toBe(originalAt);
  });
});

describe('MedicalGroupsService.respondToReschedule', () => {
  const pendingGroup = () =>
    groupRow({
      status: MEDICAL_GROUP_STATUS.RESCHEDULE_PENDING,
      proposedRescheduleAt: new Date('2027-01-01T10:00:00.000Z'),
      proposedByPractitionerId: 'hp-2',
    });

  it('aceptar mueve la cita a la fecha propuesta y limpia la propuesta', async () => {
    const d = build();
    const group = pendingGroup();
    d.groupsRepo.findById.mockResolvedValue(group);

    await d.service.respondToReschedule('g-1', 'ACCEPTED', creator);

    expect(group.scheduledAt.toISOString()).toBe('2027-01-01T10:00:00.000Z');
    expect(group.status).toBe(MEDICAL_GROUP_STATUS.SCHEDULED);
    expect(group.proposedRescheduleAt).toBeUndefined();
    expect(group.proposedByPractitionerId).toBeUndefined();
  });

  it('rechazar conserva la fecha original y limpia la propuesta', async () => {
    const d = build();
    const group = pendingGroup();
    const originalAt = group.scheduledAt;
    d.groupsRepo.findById.mockResolvedValue(group);

    await d.service.respondToReschedule('g-1', 'REJECTED', creator);

    expect(group.scheduledAt).toBe(originalAt);
    expect(group.status).toBe(MEDICAL_GROUP_STATUS.SCHEDULED);
    expect(group.proposedRescheduleAt).toBeUndefined();
  });

  it('404 si el grupo no existe', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.respondToReschedule('g-x', 'ACCEPTED', creator),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('401 si quien responde no es el creador', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(pendingGroup());

    await expect(
      d.service.respondToReschedule('g-1', 'ACCEPTED', invitee),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('412 si no hay cambio de horario pendiente', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(groupRow());

    await expect(
      d.service.respondToReschedule('g-1', 'ACCEPTED', creator),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});

describe('MedicalGroupsService.updateExerciseNotes', () => {
  const realized = (overrides: Record<string, unknown> = {}) =>
    groupRow({ scheduledAt: new Date(Date.now() - 2 * DAY_MS), ...overrides });

  it('realizada la cita y dentro de la semana, el creador guarda las notas', async () => {
    const d = build();
    const group = realized();
    d.groupsRepo.findById.mockResolvedValue(group);

    const dto = await d.service.updateExerciseNotes(
      'g-1',
      'Sin novedades',
      creator,
    );

    expect(group.exerciseNotesText).toBe('Sin novedades');
    expect(group.exerciseNotesUpdatedAt).toBeInstanceOf(Date);
    expect(dto.canEditExerciseNotes).toBe(true);
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('un miembro aceptado también las guarda', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(realized());
    d.membersRepo.findByGroup.mockResolvedValue([
      memberRow({ invitationStatus: 'ACCEPTED' }),
    ]);

    await expect(
      d.service.updateExerciseNotes('g-1', 'Notas', invitee),
    ).resolves.toBeDefined();
  });

  it('412 si la cita todavía no ocurrió', async () => {
    const d = build();
    const group = groupRow();
    d.groupsRepo.findById.mockResolvedValue(group);

    await expect(
      d.service.updateExerciseNotes('g-1', 'Notas', creator),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(group.exerciseNotesText).toBeUndefined();
  });

  it('inmutabilidad: pasada la semana se cierra y rechaza la edición con 412', async () => {
    const d = build();
    const group = groupRow({ scheduledAt: new Date(Date.now() - 8 * DAY_MS) });
    d.groupsRepo.findById.mockResolvedValue(group);

    await expect(
      d.service.updateExerciseNotes('g-1', 'Tarde', creator),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(group.exerciseNotesText).toBeUndefined();
    expect(group.status).toBe(MEDICAL_GROUP_STATUS.CLOSED);
  });

  it('412 si el expediente ya figuraba cerrado', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(
      realized({ closedAt: new Date(Date.now() - DAY_MS) }),
    );

    await expect(
      d.service.updateExerciseNotes('g-1', 'Notas', creator),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('404 si el grupo no existe y para un tercero', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.updateExerciseNotes('g-x', 'Notas', creator),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);

    d.groupsRepo.findById.mockResolvedValue(realized());
    await expect(
      d.service.updateExerciseNotes('g-1', 'Notas', stranger),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('un invitado que no aceptó recibe 404', async () => {
    const d = build();
    d.groupsRepo.findById.mockResolvedValue(realized());
    d.membersRepo.findByGroup.mockResolvedValue([memberRow()]);

    await expect(
      d.service.updateExerciseNotes('g-1', 'Notas', invitee),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
