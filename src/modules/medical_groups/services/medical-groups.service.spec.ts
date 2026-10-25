import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
} from '../../../common';
import { MedicalGroupsService } from './medical-groups.service';
import { MedicalGroupsErrorReason } from '../medical_groups.error-reasons';

/**
 * Crea un mock tipado de forma laxa.
 *
 * @param impl - Implementación opcional.
 * @returns Función mock.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const PRACTICE_A = 'practice-a';
const PRACTICE_B = 'practice-b';
const PATIENT_A = 'patient-a';
const PATIENT_B = 'patient-b';

const creator = {
  id: 'user-creator',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'pract-creator',
} as any;
const invitee = {
  id: 'user-invitee',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'pract-invitee',
} as any;
const outsider = {
  id: 'user-outsider',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'pract-outsider',
} as any;

/** Pacientes por tenant: el creador sólo tiene base clínica sobre PATIENT_A. */
const patientsAuthorizedForCreator = new Set([PATIENT_A]);

/**
 * Construye el servicio con repositorios en memoria para dos tenants.
 *
 * @returns El servicio y los dobles para afirmar sobre ellos.
 */
function build() {
  const groups = new Map<string, any>();
  const members = new Map<string, any>();
  let seq = 0;

  // Los nombres que el DTO resuelve en lote: un servicio, un perfil y una
  // persona por id, con el nombre derivado del id para poder aseverarlo.
  const tx = {
    persist: mockFn(),
    flush: mockFn().mockResolvedValue(undefined),
    find: mockFn(async (entity: any, where: any) => {
      const ids: string[] = where.id?.$in ?? [];
      if (entity.name === 'ServiceCatalog') {
        return ids.map((id) => ({ id, name: `Servicio ${id}` }));
      }
      if (entity.name === 'PractitionerRoleAssignments') {
        // Vinculaciones activas: el creador y el invitado en la práctica A,
        // el ajeno en la B. Se filtra por las prácticas que pide el servicio.
        const all = [
          { practitionerProfileId: 'pract-creator', practiceId: PRACTICE_A },
          { practitionerProfileId: 'pract-invitee', practiceId: PRACTICE_A },
          { practitionerProfileId: 'pract-foreign', practiceId: PRACTICE_B },
        ];
        return all.filter((a) => where.practiceId.$in.includes(a.practiceId));
      }
      if (entity.name === 'PersonProfiles') {
        return ids.map((id) => ({ id, personId: `person-${id}` }));
      }
      // Persons: sólo existen las `person-*`. Un id de profesional que fuera
      // directamente una persona se prueba aparte.
      return ids
        .filter((id) => id.startsWith('person-') || id === 'pract-persona')
        .map((id) => ({ id, displayName: `Nombre de ${id}` }));
    }),
  };
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const groupsRepo = {
    findById: mockFn(async (_em: any, id: string) => groups.get(id) ?? null),
    create: mockFn((_em: any, data: any) => {
      const group = { id: `group-${++seq}`, createdAt: new Date(), ...data };
      groups.set(group.id, group);
      return group;
    }),
    findIdsByRequester: mockFn(async (_em: any, id: string) =>
      [...groups.values()]
        .filter((g) => g.requestingPractitionerId === id)
        .map((g) => g.id),
    ),
    findByIdsPage: mockFn(async (_em: any, ids: string[]) =>
      ids.map((id) => groups.get(id)).filter(Boolean),
    ),
  };
  const membersRepo = {
    create: mockFn((_em: any, data: any) => {
      const member = { id: `member-${++seq}`, ...data };
      members.set(member.id, member);
      return member;
    }),
    findById: mockFn(async (_em: any, id: string) => members.get(id) ?? null),
    findByGroup: mockFn(async (_em: any, groupId: string) =>
      [...members.values()].filter((m) => m.groupId === groupId),
    ),
    findManyByGroups: mockFn(async (_em: any, ids: string[]) =>
      [...members.values()].filter((m) => ids.includes(m.groupId)),
    ),
    hasPendingInvites: mockFn(async (_em: any, groupId: string) =>
      [...members.values()].some(
        (m) => m.groupId === groupId && m.invitationStatus === 'PENDING',
      ),
    ),
    findGroupIdsByInvitee: mockFn(
      async (_em: any, practitionerId: string, status: string) =>
        [...members.values()]
          .filter(
            (m) =>
              m.practitionerProfileId === practitionerId &&
              m.invitationStatus === status,
          )
          .map((m) => m.groupId),
    ),
    findGroupIdsWithPendingInvites: mockFn(async (_em: any, ids: string[]) =>
      ids.filter((id) =>
        [...members.values()].some(
          (m) => m.groupId === id && m.invitationStatus === 'PENDING',
        ),
      ),
    ),
  };
  const serviceCatalogRepo = {
    findById: mockFn(async (_em: any, id: string) => {
      if (id === 'service-a')
        return {
          id,
          practiceId: PRACTICE_A,
          isActive: true,
          descriptionText: 'Términos base',
        };
      if (id === 'service-sin-descripcion')
        return {
          id,
          practiceId: PRACTICE_A,
          isActive: true,
          descriptionText: null,
        };
      if (id === 'service-b')
        return {
          id,
          practiceId: PRACTICE_B,
          isActive: true,
          descriptionText: 'Términos B',
        };
      return null;
    }),
  };
  const practiceTenantLookup = {
    findActivePracticeIdsForPractitioner: mockFn(async (id: string) => {
      if (
        id === 'pract-creator' ||
        id === 'pract-invitee' ||
        id === 'pract-persona'
      ) {
        return [PRACTICE_A];
      }
      if (id === 'pract-foreign') return [PRACTICE_B];
      if (id === 'pract-unassigned') return [];
      return [];
    }),
    findActivePracticeIdsForTenant: mockFn(async (tenantId: string) =>
      tenantId === TENANT_A ? [PRACTICE_A] : [PRACTICE_B],
    ),
    findTenantOfPractice: mockFn(async (practiceId: string) =>
      practiceId === PRACTICE_A
        ? TENANT_A
        : practiceId === PRACTICE_B
          ? TENANT_B
          : null,
    ),
  };
  const practitionerProfilesRepo = {
    findById: mockFn(async (_em: any, id: string) =>
      id.startsWith('pract-') ? { id } : null,
    ),
  };
  const patientProfilesRepo = {
    findById: mockFn(async (_em: any, id: string) =>
      id === PATIENT_A || id === PATIENT_B ? { id } : null,
    ),
  };
  const conditionsRepo = {
    findById: mockFn(async (_em: any, id: string) =>
      id === 'cond-a' ? { id, patientProfileId: PATIENT_A } : null,
    ),
    findByPatient: mockFn(async () => []),
  };
  const clinicalRead = {
    assertCanReadHistory: mockFn(async (patientId: string) => {
      if (!patientsAuthorizedForCreator.has(patientId)) {
        throw new ForbiddenException('Sin acceso a la historia');
      }
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new MedicalGroupsService(
    em,
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
    groups,
    members,
    tx,
    groupsRepo,
    clinicalRead,
    practiceTenantLookup,
  };
}

const future = (): string =>
  new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

const baseDto = (overrides: Record<string, unknown> = {}): any => ({
  serviceCatalogId: 'service-a',
  scheduledAt: future(),
  locationText: 'Consultorio 1',
  members: [],
  ...overrides,
});

describe('MedicalGroupsService', () => {
  describe('create', () => {
    it('crea un grupo programado sin paciente y con el tenant de la práctica', async () => {
      const d = build();
      const res = await d.service.create(baseDto(), creator);

      expect(res.status).toBe('SCHEDULED');
      expect(res.patientProfileId).toBeUndefined();
      expect(res.members).toHaveLength(1);
      expect(res.members[0]).toMatchObject({
        isCreator: true,
        invitationStatus: 'ACCEPTED',
      });
      expect(d.groupsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT_A, practiceId: PRACTICE_A }),
      );
      expect(d.clinicalRead.assertCanReadHistory).not.toHaveBeenCalled();
    });

    it('asocia un paciente autorizado con su diagnóstico correcto', async () => {
      const d = build();
      const res = await d.service.create(
        baseDto({ patientProfileId: PATIENT_A, conditionId: 'cond-a' }),
        creator,
      );

      expect(res.patientProfileId).toBe(PATIENT_A);
      expect(res.conditionId).toBe('cond-a');
      expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
        PATIENT_A,
        creator,
      );
    });

    it('MG-01: asocia un paciente autorizado SIN diagnóstico ejecutando la política clínica', async () => {
      const d = build();
      const res = await d.service.create(
        baseDto({ patientProfileId: PATIENT_A }),
        creator,
      );

      expect(res.patientProfileId).toBe(PATIENT_A);
      expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledTimes(1);
      expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
        PATIENT_A,
        creator,
      );
    });

    it('MG-01: un paciente sin base clínica y sin diagnóstico responde 404 uniforme y no persiste nada', async () => {
      const d = build();
      const attempt = d.service.create(
        baseDto({ patientProfileId: PATIENT_B }),
        creator,
      );

      await expect(attempt).rejects.toBeInstanceOf(ResourceNotFoundException);
      await expect(attempt).rejects.toMatchObject({
        reason: MedicalGroupsErrorReason.MEDICAL_GROUP_PATIENT_NOT_AVAILABLE,
        details: undefined,
      });
      expect(d.groupsRepo.create).not.toHaveBeenCalled();
      expect(d.groups.size).toBe(0);
      expect(d.members.size).toBe(0);
    });

    it('MG-01: un paciente ajeno responde igual que uno inexistente', async () => {
      const d = build();
      const foreign = await d.service
        .create(baseDto({ patientProfileId: PATIENT_B }), creator)
        .catch((e) => e);
      const missing = await d.service
        .create(baseDto({ patientProfileId: 'no-existe' }), creator)
        .catch((e) => e);

      expect(foreign.getStatus()).toBe(404);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
    });

    it('MG-01: un paciente ajeno con diagnóstico también responde 404 uniforme', async () => {
      const d = build();
      await expect(
        d.service.create(
          baseDto({ patientProfileId: PATIENT_B, conditionId: 'cond-a' }),
          creator,
        ),
      ).rejects.toMatchObject({
        reason: MedicalGroupsErrorReason.MEDICAL_GROUP_PATIENT_NOT_AVAILABLE,
      });
      expect(d.groups.size).toBe(0);
    });

    it('propaga errores no clínicos del gate sin traducirlos a 404', async () => {
      const d = build();
      d.clinicalRead.assertCanReadHistory.mockRejectedValueOnce(
        new Error('base caída'),
      );
      await expect(
        d.service.create(baseDto({ patientProfileId: PATIENT_A }), creator),
      ).rejects.toThrow('base caída');
    });

    it('exige paciente para elegir diagnóstico (412)', async () => {
      const d = build();
      await expect(
        d.service.create(baseDto({ conditionId: 'cond-a' }), creator),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('un diagnóstico de otro paciente responde 404', async () => {
      const d = build();
      await expect(
        d.service.create(
          baseDto({ patientProfileId: PATIENT_A, conditionId: 'cond-x' }),
          creator,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.groups.size).toBe(0);
    });

    it('un servicio de otra práctica responde 404', async () => {
      const d = build();
      await expect(
        d.service.create(baseDto({ serviceCatalogId: 'service-b' }), creator),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.groups.size).toBe(0);
    });

    it('invita a un profesional de la misma organización y deja el grupo pendiente', async () => {
      const d = build();
      const res = await d.service.create(
        baseDto({
          members: [
            {
              practitionerProfileId: 'pract-invitee',
              roleTitle: 'Anestesista',
              agreedPaymentAmount: '100.00',
            },
          ],
        }),
        creator,
      );

      expect(res.status).toBe('PENDING_TEAM');
      expect(res.members).toHaveLength(2);
    });

    it('rechaza invitar a un profesional vinculado a otro tenant (404 uniforme)', async () => {
      const d = build();
      const foreign = await d.service
        .create(
          baseDto({
            members: [
              {
                practitionerProfileId: 'pract-foreign',
                roleTitle: 'Cirujano',
                agreedPaymentAmount: '10.00',
              },
            ],
          }),
          creator,
        )
        .catch((e) => e);
      const missing = await d.service
        .create(
          baseDto({
            members: [
              {
                practitionerProfileId: 'otro-id',
                roleTitle: 'Cirujano',
                agreedPaymentAmount: '10.00',
              },
            ],
          }),
          creator,
        )
        .catch((e) => e);

      expect(foreign.getStatus()).toBe(404);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreign.reason).toBe(
        MedicalGroupsErrorReason.MEDICAL_GROUP_PRACTITIONER_NOT_AVAILABLE,
      );
      expect(d.groups.size).toBe(0);
    });

    it('rechaza invitar a un profesional sin vinculación activa', async () => {
      const d = build();
      await expect(
        d.service.create(
          baseDto({
            members: [
              {
                practitionerProfileId: 'pract-unassigned',
                roleTitle: 'Enfermero',
                agreedPaymentAmount: '10.00',
              },
            ],
          }),
          creator,
        ),
      ).rejects.toMatchObject({
        reason:
          MedicalGroupsErrorReason.MEDICAL_GROUP_PRACTITIONER_NOT_AVAILABLE,
      });
    });

    it('rechaza repetir al creador como invitado (409)', async () => {
      const d = build();
      await expect(
        d.service.create(
          baseDto({
            members: [
              {
                practitionerProfileId: 'pract-creator',
                roleTitle: 'X',
                agreedPaymentAmount: '1.00',
              },
            ],
          }),
          creator,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza una cuenta sin perfil profesional (401)', async () => {
      const d = build();
      await expect(
        d.service.create(baseDto(), {
          id: 'u',
          roles: ['PRACTITIONER'],
        } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  it('un servicio sin descripción (null en la base) no rompe el alta', async () => {
    const d = build();
    const created = await d.service.create(
      baseDto({ serviceCatalogId: 'service-sin-descripcion' }),
      creator,
    );
    expect(created.termsText).toBe('');
  });

  it('un grupo leído de la base (closed_at y paciente null) no figura cerrado', async () => {
    const d = build();
    const created = await d.service.create(baseDto(), creator);
    // Lo que MikroORM hidrata desde Postgres: null, no undefined.
    const stored = d.groups.get(created.id);
    stored.closedAt = null;
    stored.patientProfileId = null;

    const group = await d.service.findOne(created.id, creator);
    expect(group.isClosed).toBe(false);
    expect(group.status).not.toBe('CLOSED');
    expect(group.patientName).toBeNull();
  });

  describe('colegas que se pueden invitar', () => {
    it('ofrece a los de la misma organización del servicio, sin quien pregunta', async () => {
      const d = build();
      const eligible = await d.service.listEligibleMembers(
        'service-a',
        creator,
      );
      expect(eligible).toEqual([
        {
          practitionerProfileId: 'pract-invitee',
          name: 'Nombre de person-pract-invitee',
        },
      ]);
    });

    it('un servicio de otra práctica responde 404, como al crear', async () => {
      const d = build();
      await expect(
        d.service.listEligibleMembers('service-b', creator),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('findOne y list', () => {
    it('el grupo trae el nombre del servicio, de cada miembro y del paciente', async () => {
      const d = build();
      const created = await d.service.create(
        baseDto({
          patientProfileId: PATIENT_A,
          members: [
            {
              practitionerProfileId: 'pract-invitee',
              roleTitle: 'Anestesista',
              agreedPaymentAmount: '100.00',
            },
          ],
        }),
        creator,
      );

      const group = await d.service.findOne(created.id, creator);
      expect(group.serviceName).toBe(`Servicio ${group.serviceCatalogId}`);
      expect(group.patientName).toBe(`Nombre de person-${PATIENT_A}`);
      expect(
        group.members.map((m) => [m.practitionerProfileId, m.practitionerName]),
      ).toEqual(
        expect.arrayContaining([
          ['pract-creator', 'Nombre de person-pract-creator'],
          ['pract-invitee', 'Nombre de person-pract-invitee'],
        ]),
      );

      const page = await d.service.list('historico', creator, {});
      expect(page.items[0]?.serviceName).toBe(
        `Servicio ${group.serviceCatalogId}`,
      );
    });

    it('el invitado ve al paciente recién cuando acepta; pendiente o rechazado, no', async () => {
      const d = build();
      const created = await d.service.create(
        baseDto({
          patientProfileId: PATIENT_A,
          members: [
            {
              practitionerProfileId: 'pract-invitee',
              roleTitle: 'Anestesista',
              agreedPaymentAmount: '100.00',
            },
          ],
        }),
        creator,
      );
      const memberId = created.members.find((m) => !m.isCreator)!.id;

      const pendiente = await d.service.findOne(created.id, invitee);
      expect(pendiente.patientProfileId).toBe(PATIENT_A);
      expect(pendiente.patientName).toBeNull();

      const aceptado = await d.service.respondToInvitation(
        created.id,
        memberId,
        'ACCEPTED',
        invitee,
      );
      expect(aceptado.patientName).toBe(`Nombre de person-${PATIENT_A}`);
    });

    it('quien rechaza la invitación no recibe el nombre del paciente', async () => {
      const d = build();
      const created = await d.service.create(
        baseDto({
          patientProfileId: PATIENT_A,
          members: [
            {
              practitionerProfileId: 'pract-invitee',
              roleTitle: 'Anestesista',
              agreedPaymentAmount: '100.00',
            },
          ],
        }),
        creator,
      );
      const memberId = created.members.find((m) => !m.isCreator)!.id;
      const rechazado = await d.service.respondToInvitation(
        created.id,
        memberId,
        'REJECTED',
        invitee,
      );
      expect(rechazado.patientName).toBeNull();
    });

    it('un perfil profesional cuyo id es el de su persona se nombra sin pasar por person_profiles', async () => {
      const d = build();
      const created = await d.service.create(baseDto(), {
        ...creator,
        practitionerProfileId: 'pract-persona',
      });
      expect(created.members[0]?.practitionerName).toBe(
        'Nombre de pract-persona',
      );
    });

    it('sin nombre cargado el miembro viaja con null, no con el id', async () => {
      const d = build();
      // Ningún perfil resuelve a una persona: cuenta a medio crear.
      d.tx.find.mockImplementation(async (entity: any, where: any) =>
        entity.name === 'ServiceCatalog'
          ? where.id.$in.map((id: string) => ({ id, name: 'Servicio' }))
          : [],
      );
      const created = await d.service.create(baseDto(), creator);
      expect(created.members[0]?.practitionerName).toBeNull();
      expect(created.patientName).toBeNull();
    });

    it('el creador y el invitado ven el grupo; un tercero recibe 404', async () => {
      const d = build();
      const created = await d.service.create(
        baseDto({
          members: [
            {
              practitionerProfileId: 'pract-invitee',
              roleTitle: 'Anestesista',
              agreedPaymentAmount: '100.00',
            },
          ],
        }),
        creator,
      );

      await expect(
        d.service.findOne(created.id, creator),
      ).resolves.toMatchObject({ id: created.id });
      await expect(
        d.service.findOne(created.id, invitee),
      ).resolves.toMatchObject({ id: created.id });
      await expect(
        d.service.findOne(created.id, outsider),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      await expect(
        d.service.findOne('no-existe', creator),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('lista por pestañas: histórico del creador y recibidas del invitado', async () => {
      const d = build();
      await d.service.create(
        baseDto({
          members: [
            {
              practitionerProfileId: 'pract-invitee',
              roleTitle: 'Anestesista',
              agreedPaymentAmount: '100.00',
            },
          ],
        }),
        creator,
      );

      const historico = await d.service.list('historico', creator, {});
      const enviadas = await d.service.list('enviadas', creator, {});
      const recibidas = await d.service.list('recibidas', invitee, {});
      const vacio = await d.service.list('recibidas', outsider, {});

      expect(historico.items).toHaveLength(1);
      expect(enviadas.items[0].pendingMembersCount).toBe(1);
      expect(recibidas.items).toHaveLength(1);
      expect(vacio.items).toHaveLength(0);
      expect(vacio.nextCursor).toBeNull();
    });

    it('lista con límite y devuelve cursor cuando hay más páginas', async () => {
      const d = build();
      await d.service.create(baseDto(), creator);
      await d.service.create(baseDto(), creator);
      const page = await d.service.list('historico', creator, { limit: 1 });
      expect(page.items).toHaveLength(1);
      expect(page.nextCursor).not.toBeNull();
    });
  });

  describe('respondToInvitation', () => {
    const invited = {
      members: [
        {
          practitionerProfileId: 'pract-invitee',
          roleTitle: 'Anestesista',
          agreedPaymentAmount: '100.00',
        },
      ],
    };

    it('al aceptar la última invitación el grupo pasa a SCHEDULED', async () => {
      const d = build();
      const created = await d.service.create(baseDto(invited), creator);
      const memberId = created.members.find((m) => !m.isCreator)!.id;

      const res = await d.service.respondToInvitation(
        created.id,
        memberId,
        'ACCEPTED',
        invitee,
      );
      expect(res.status).toBe('SCHEDULED');
      expect(res.members.find((m) => m.id === memberId)?.invitationStatus).toBe(
        'ACCEPTED',
      );
    });

    it('rechazar deja el grupo pendiente; responder dos veces es 412', async () => {
      const d = build();
      const created = await d.service.create(baseDto(invited), creator);
      const memberId = created.members.find((m) => !m.isCreator)!.id;

      const res = await d.service.respondToInvitation(
        created.id,
        memberId,
        'REJECTED',
        invitee,
      );
      expect(res.status).toBe('PENDING_TEAM');
      await expect(
        d.service.respondToInvitation(
          created.id,
          memberId,
          'ACCEPTED',
          invitee,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('quien no es el invitado recibe 404 y no cambia la fila', async () => {
      const d = build();
      const created = await d.service.create(baseDto(invited), creator);
      const memberId = created.members.find((m) => !m.isCreator)!.id;

      await expect(
        d.service.respondToInvitation(
          created.id,
          memberId,
          'ACCEPTED',
          outsider,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.members.get(memberId).invitationStatus).toBe('PENDING');
    });

    it('un grupo inexistente o un miembro de otro grupo responden 404', async () => {
      const d = build();
      const created = await d.service.create(baseDto(invited), creator);
      const memberId = created.members.find((m) => !m.isCreator)!.id;
      await expect(
        d.service.respondToInvitation('nope', memberId, 'ACCEPTED', invitee),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      await expect(
        d.service.respondToInvitation(created.id, 'nope', 'ACCEPTED', invitee),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('reprogramación', () => {
    const invited = {
      members: [
        {
          practitionerProfileId: 'pract-invitee',
          roleTitle: 'Anestesista',
          agreedPaymentAmount: '100.00',
        },
      ],
    };

    /**
     * Crea un grupo programado con el invitado ya aceptado.
     *
     * @param d - Entorno de prueba.
     * @returns El grupo programado.
     */
    async function scheduled(d: ReturnType<typeof build>) {
      const created = await d.service.create(baseDto(invited), creator);
      const memberId = created.members.find((m) => !m.isCreator)!.id;
      return d.service.respondToInvitation(
        created.id,
        memberId,
        'ACCEPTED',
        invitee,
      );
    }

    it('el creador reprograma directo', async () => {
      const d = build();
      const group = await scheduled(d);
      const proposed = new Date(Date.now() + 5 * 86400000).toISOString();
      const res = await d.service.requestReschedule(
        group.id,
        proposed,
        creator,
      );
      expect(res.status).toBe('SCHEDULED');
      expect(res.scheduledAt.toISOString()).toBe(proposed);
    });

    it('un integrante propone y el creador acepta o rechaza', async () => {
      const d = build();
      const group = await scheduled(d);
      const proposed = new Date(Date.now() + 5 * 86400000).toISOString();

      const pending = await d.service.requestReschedule(
        group.id,
        proposed,
        invitee,
      );
      expect(pending.status).toBe('RESCHEDULE_PENDING');

      await expect(
        d.service.respondToReschedule(group.id, 'ACCEPTED', invitee),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      const accepted = await d.service.respondToReschedule(
        group.id,
        'ACCEPTED',
        creator,
      );
      expect(accepted.status).toBe('SCHEDULED');
      expect(accepted.scheduledAt.toISOString()).toBe(proposed);
      await expect(
        d.service.respondToReschedule(group.id, 'REJECTED', creator),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('un tercero no puede pedir cambio de horario (404) ni una fecha inválida pasa (412)', async () => {
      const d = build();
      const group = await scheduled(d);
      await expect(
        d.service.requestReschedule(group.id, future(), outsider),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      await expect(
        d.service.requestReschedule(group.id, 'no-es-fecha', creator),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('un grupo con invitación sin aceptar no admite cambio de horario (412)', async () => {
      const d = build();
      const created = await d.service.create(baseDto(invited), creator);
      await expect(
        d.service.requestReschedule(created.id, future(), creator),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('notas del ejercicio e inmutabilidad', () => {
    it('antes de la cita no se cargan notas (412)', async () => {
      const d = build();
      const created = await d.service.create(baseDto(), creator);
      await expect(
        d.service.updateExerciseNotes(created.id, 'notas', creator),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('realizada la cita y dentro de la semana, el creador carga las notas', async () => {
      const d = build();
      const created = await d.service.create(baseDto(), creator);
      d.groups.get(created.id).scheduledAt = new Date(Date.now() - 3600_000);

      const res = await d.service.updateExerciseNotes(
        created.id,
        'Procedimiento sin novedades',
        creator,
      );
      expect(res.exerciseNotesText).toBe('Procedimiento sin novedades');
      expect(res.canEditExerciseNotes).toBe(true);
    });

    it('pasada la semana el expediente se cierra y es inmutable', async () => {
      const d = build();
      const created = await d.service.create(baseDto(), creator);
      d.groups.get(created.id).scheduledAt = new Date(
        Date.now() - 8 * 24 * 3600_000,
      );

      await expect(
        d.service.updateExerciseNotes(created.id, 'tarde', creator),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.groups.get(created.id).status).toBe('CLOSED');
      expect(d.groups.get(created.id).closedAt).toBeInstanceOf(Date);
      await expect(
        d.service.requestReschedule(created.id, future(), creator),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('un tercero no edita notas (404)', async () => {
      const d = build();
      const created = await d.service.create(baseDto(), creator);
      d.groups.get(created.id).scheduledAt = new Date(Date.now() - 3600_000);
      await expect(
        d.service.updateExerciseNotes(created.id, 'x', outsider),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('listPatientConditions', () => {
    it('devuelve lista vacía para un paciente autorizado sin diagnósticos', async () => {
      const d = build();
      await expect(
        d.service.listPatientConditions(PATIENT_A, creator),
      ).resolves.toEqual([]);
    });

    it('propaga el 403 clínico para un paciente sin base de lectura', async () => {
      const d = build();
      await expect(
        d.service.listPatientConditions(PATIENT_B, creator),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
