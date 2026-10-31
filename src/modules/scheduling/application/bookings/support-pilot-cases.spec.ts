import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { CONCEPTS } from '../../../../common';
import { DIR } from '../../../directory/directory.concepts';
import { DELEG } from '../../../delegated_access/delegated_access.concepts';
import { supportPermissionId } from '../../../delegated_access/domain/support-actions';
import { SUPPORT_TEMPLATE_DEFAULTS } from '../../../delegated_access/domain';
import { STATUS } from '../../../delegated_access/services/concept-maps';
import { SupportAccessPolicy } from '../../../delegated_access/services/support-access.policy';
import { DelegatedAccessSupportAgendaAdapter } from '../../infrastructure/adapters/delegated-access-support-agenda.adapter';
import { SchedulingSupportAgendaService } from '../agenda/scheduling-support-agenda.service';
import { BookingAccess } from './support/booking-access';
import { CheckInBookingUseCase } from './use-cases/check-in-booking.use-case';
import { CreateDirectAppointmentUseCase } from './use-cases/create-direct-appointment.use-case';

/**
 * Los casos del hospital piloto (01–08, 11 y 12) a nivel de servicio: la política
 * REAL del personal de apoyo (`SupportAccessPolicy`) sobre un repositorio en doble
 * con la estructura del Hospital Piloto Mantra, detrás del adaptador de agenda,
 * `BookingAccess` y los casos de uso que de verdad operan la cita. Lo único falso
 * es la persistencia. El caso 13 (búsqueda exacta) y el 09/10 viven en
 * `delegated_access`.
 */

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const HOSPITAL = 'tenant-hospital';
const OTRA_ORG = 'tenant-consultorio-cespedes';

/* ---- estructura del hospital: doctores, servicios y espacios ---------------- */

const DOCTOR = {
  perez: { prof: 'prof-perez', pra: 'pra-perez', resource: 'res-perez' },
  rojas: { prof: 'prof-rojas', pra: 'pra-rojas', resource: 'res-rojas' },
  suarez: { prof: 'prof-suarez', pra: 'pra-suarez', resource: 'res-suarez' },
  mendez: { prof: 'prof-mendez', pra: 'pra-mendez', resource: 'res-mendez' },
  antelo: { prof: 'prof-antelo', pra: 'pra-antelo', resource: 'res-antelo' },
};
const SVC = {
  consulta: 'svc-consulta',
  eco: 'svc-ecografia',
  ecoObstetrica: 'svc-eco-obstetrica',
  ecocardio: 'svc-ecocardiograma',
};
const path = (...ids: string[]): string => `/${ids.join('/')}/`;
const SPACES: Record<string, { site: string; path: string }> = {
  'a-103': {
    site: 'site-central',
    path: path('site-central', 'bld-a', 'a-p1', 'a-103'),
  },
  'a-105': {
    site: 'site-central',
    path: path('site-central', 'bld-a', 'a-p1', 'a-105'),
  },
  'a-201': {
    site: 'site-central',
    path: path('site-central', 'bld-a', 'a-p2', 'a-201'),
  },
  'a-401': {
    site: 'site-central',
    path: path('site-central', 'bld-a', 'a-p4', 'a-401'),
  },
  'b-102': {
    site: 'site-central',
    path: path('site-central', 'bld-b', 'b-p1', 'b-102'),
  },
  'b-204': {
    site: 'site-central',
    path: path('site-central', 'bld-b', 'b-p2', 'b-204'),
  },
  'n-102': { site: 'site-norte', path: path('site-norte', 'n-p1', 'n-102') },
};
/** Dónde atiende y qué presta cada doctor (lo que el caso de uso contrasta con lo declarado). */
const PLACEMENTS: Record<string, { spaceIds: string[]; serviceIds: string[] }> =
  {
    [DOCTOR.perez.prof]: {
      spaceIds: ['a-103', 'a-201'],
      serviceIds: [SVC.consulta, SVC.ecocardio],
    },
    [DOCTOR.rojas.prof]: {
      spaceIds: ['b-204'],
      serviceIds: [SVC.ecoObstetrica],
    },
    [DOCTOR.suarez.prof]: {
      spaceIds: ['b-102', 'n-102'],
      serviceIds: [SVC.consulta],
    },
    [DOCTOR.mendez.prof]: {
      spaceIds: ['a-105', 'a-401'],
      serviceIds: [SVC.consulta],
    },
    [DOCTOR.antelo.prof]: { spaceIds: ['a-201'], serviceIds: [SVC.eco] },
  };

/* ---- personas de apoyo y sus permisos --------------------------------------- */

const persona = (id: string, tenantIds = [HOSPITAL]) =>
  ({ id, roles: ['SUPPORT_STAFF'], tenantIds }) as any;
const ANA = persona('user-ana');
const LUCIA = persona('user-lucia');
const MARCOS = persona('user-marcos');
const ROSA = persona('user-rosa', [OTRA_ORG]);

const grantRow = (
  id: string,
  engagement: string,
  fields: Record<string, unknown>,
) => ({
  id,
  organizationUserAssignmentId: engagement,
  expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
  statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
  ...fields,
});
const ids = (codes: readonly string[]): string[] =>
  codes.map((c) => supportPermissionId(c as any));

/** Permisos de cada vínculo, como los del hospital piloto del contrato. */
const GRANTS: Record<string, { grant: any; permissionIds: string[] }[]> = {
  'eng-ana': [
    {
      grant: grantRow('g-ana-perez', 'eng-ana', {
        targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
        practitionerRoleAssignmentId: DOCTOR.perez.pra,
      }),
      permissionIds: ids(SUPPORT_TEMPLATE_DEFAULTS.SECRETARY),
    },
  ],
  'eng-lucia': [
    {
      grant: grantRow('g-lucia-a-p1', 'eng-lucia', {
        targetKindConceptId: DELEG.SUPPORT_TARGET_LOCATION,
        careSpaceId: 'a-p1',
      }),
      permissionIds: ids(SUPPORT_TEMPLATE_DEFAULTS.FRONT_DESK),
    },
  ],
  'eng-marcos': [
    {
      grant: grantRow('g-marcos-eco', 'eng-marcos', {
        targetKindConceptId: DELEG.SUPPORT_TARGET_SERVICE,
        healthcareServiceId: SVC.eco,
      }),
      permissionIds: ids(SUPPORT_TEMPLATE_DEFAULTS.CALL_CENTER),
    },
    {
      grant: grantRow('g-marcos-suarez-norte', 'eng-marcos', {
        targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER_LOCATION,
        practitionerRoleAssignmentId: DOCTOR.suarez.pra,
        practiceSiteId: 'site-norte',
      }),
      permissionIds: ids(SUPPORT_TEMPLATE_DEFAULTS.CALL_CENTER),
    },
  ],
};

const ENGAGEMENT_OF: Record<string, string> = {
  'user-ana': 'eng-ana',
  'user-lucia': 'eng-lucia',
  'user-marcos': 'eng-marcos',
};
/** Qué doctores aceptaron a cada persona. */
const ACCEPTED_BY: Record<string, string[]> = {
  'eng-ana': [DOCTOR.perez.prof, DOCTOR.rojas.prof],
  'eng-lucia': [DOCTOR.mendez.prof, DOCTOR.perez.prof],
  'eng-marcos': [DOCTOR.antelo.prof, DOCTOR.rojas.prof, DOCTOR.suarez.prof],
};

/** Repositorio de la política con el hospital piloto; `ended` simula el fin de vínculo. */
function policyRepo(ended: string[] = []) {
  const roles = Object.values(DOCTOR).map((d) => ({
    id: d.pra,
    practitionerProfileId: d.prof,
    practiceId: 'practice-1',
    tenantId: HOSPITAL,
  }));
  return {
    findEngagements: mockFn().mockImplementation(
      async (_em: unknown, filter: { userId?: string; tenantId?: string }) => {
        const id = filter.userId ? ENGAGEMENT_OF[filter.userId] : undefined;
        if (!id || filter.tenantId !== HOSPITAL) return [];
        return [
          {
            assignment: {
              id,
              statusConceptId: ended.includes(id)
                ? STATUS.REVOKED
                : STATUS.ACTIVE,
              validFrom: new Date('2026-01-01'),
            },
            tenantId: HOSPITAL,
            userId: filter.userId,
            membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
          },
        ];
      },
    ),
    findGrantsWithActions: mockFn().mockImplementation(
      async (_em: unknown, engagementIds: string[]) =>
        engagementIds.flatMap((id) => GRANTS[id] ?? []),
    ),
    findDelegationsOfEngagements: mockFn().mockImplementation(
      async (_em: unknown, engagementIds: string[]) =>
        engagementIds.flatMap((id) =>
          (ACCEPTED_BY[id] ?? []).map((prof) => ({
            delegate: {
              id: `del-${id}-${prof}`,
              delegateUserAssignmentId: id,
              acceptedAt: new Date('2026-02-01'),
              statusConceptId: STATUS.ACTIVE,
              mayReplyOnBehalf: false,
            },
            practitionerProfileId: prof,
          })),
        ),
    ),
    findRoleAssignments: mockFn().mockImplementation(
      async (_em: unknown, raIds: string[]) =>
        new Map(
          roles.filter((r) => raIds.includes(r.id)).map((r) => [r.id, r]),
        ),
    ),
    findRoleAssignmentsOfPractitioner: mockFn().mockImplementation(
      async (_em: unknown, prof: string, tenant: string) =>
        roles.filter(
          (r) => r.practitionerProfileId === prof && r.tenantId === tenant,
        ),
    ),
    findServices: mockFn().mockImplementation(
      async (_em: unknown, svcIds: string[]) =>
        new Map(
          svcIds
            .filter((id) => Object.values(SVC).includes(id))
            .map((id) => [
              id,
              { id, practiceId: 'practice-1', tenantId: HOSPITAL },
            ]),
        ),
    ),
    findCareSpaces: mockFn().mockImplementation(
      async (_em: unknown, spaceIds: string[]) =>
        new Map(
          spaceIds
            .filter((id) => SPACES[id])
            .map((id) => [
              id,
              {
                id,
                practiceSiteId: SPACES[id].site,
                locationPath: SPACES[id].path,
                tenantId: HOSPITAL,
              },
            ]),
        ),
    ),
    findCareSpaceIdsOfTenant: mockFn().mockResolvedValue(Object.keys(SPACES)),
    findRoleAssignmentsOfTenant: mockFn().mockResolvedValue(roles),
  };
}

/** Arma el ecosistema: política real → adaptador → acceso a citas → casos de uso. */
function build(ended: string[] = []) {
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const policy = new SupportAccessPolicy(
    { fork: () => ({}) } as any,
    policyRepo(ended) as any,
    logger as any,
  );
  const adapter = new DelegatedAccessSupportAgendaAdapter(policy);

  const resources = Object.values(DOCTOR).map((d) => ({
    id: d.resource,
    tenantId: HOSPITAL,
    resourceRefType: 'health_practitioner_profiles',
    resourceRefId: d.prof,
    practiceId: 'practice-1',
    timeZone: 'America/La_Paz',
  }));
  const catalogRepo = {
    findResourceById: mockFn().mockImplementation(
      async (_tx: unknown, id: string) =>
        resources.find((r) => r.id === id) ?? null,
    ),
    findOpenSlotsOfProfessionalInWindow: mockFn().mockResolvedValue([]),
    createSlot: mockFn((_: any, data: any) => ({ id: 'slot-nuevo', ...data })),
  };
  const bookings: Record<string, any> = {};
  const bookingsRepo = {
    findBookingByIdForUpdate: mockFn().mockImplementation(
      async (_tx: unknown, id: string) => bookings[id] ?? null,
    ),
    findPatientNames: mockFn().mockResolvedValue(
      new Map([['pat-1', 'Paciente']]),
    ),
    findPatientBookingsOverlapping: mockFn().mockResolvedValue([]),
    createBooking: mockFn((_: any, data: any) => ({ id: 'bk-nuevo', ...data })),
    createReminder: mockFn(),
  };
  const audit = { record: mockFn().mockResolvedValue(undefined) };
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: () => ({ transactional: (cb: any) => cb(tx) }),
  };
  const access = new BookingAccess(
    bookingsRepo as any,
    catalogRepo as any,
    {} as any,
    {} as any,
    adapter,
    em as any,
    audit as any,
  );
  jest.spyOn(access, 'assertAffiliationCurrent').mockResolvedValue(undefined);
  const places = {
    placementsOf: mockFn().mockImplementation(
      async (_tx: unknown, prof: string) => PLACEMENTS[prof],
    ),
  };
  const createDirect = new CreateDirectAppointmentUseCase(
    em as any,
    bookingsRepo as any,
    catalogRepo as any,
    { assertRangeFree: mockFn().mockResolvedValue(undefined) } as any,
    access,
    {
      createClinicalAppointment: mockFn().mockReturnValue({ id: 'appt-1' }),
    } as any,
    { recordTransition: mockFn().mockResolvedValue(undefined) } as any,
    { notifyChange: mockFn().mockResolvedValue(undefined) } as any,
    {} as any,
    {} as any,
    { setContext: mockFn(), info: mockFn(), warn: mockFn() } as any,
    places as any,
  );
  const checkIn = new CheckInBookingUseCase(
    em as any,
    bookingsRepo as any,
    {
      assertTransition: mockFn(),
      recordTransition: mockFn().mockResolvedValue(undefined),
    } as any,
    access,
    { setContext: mockFn(), info: mockFn() } as any,
  );
  const agenda = new SchedulingSupportAgendaService(
    { fork: () => ({}) } as any,
    {
      findRows: mockFn().mockResolvedValue([]),
      findActiveWaits: mockFn().mockResolvedValue([]),
      namesOf: mockFn().mockResolvedValue({
        doctors: new Map(),
        services: new Map(),
        spaces: new Map(),
      }),
    } as any,
    adapter,
    access,
  );
  return { createDirect, checkIn, agenda, bookings, tx, bookingsRepo };
}

/** Cuerpo de una cita nueva en la agenda de un doctor, en un espacio y servicio. */
const cita = (
  doctor: { resource: string },
  space: string,
  service: string,
  extra: Record<string, unknown> = {},
): any => ({
  patientProfileId: 'pat-1',
  resourceId: doctor.resource,
  startAt: '2030-09-10T14:00:00.000Z',
  durationMinutes: 30,
  careSpaceId: space,
  healthcareServiceId: service,
  ...extra,
});

/** Una cita confirmada del doctor en el espacio, lista para el check-in. */
const confirmada = (
  d: ReturnType<typeof build>,
  doctor: { resource: string },
  space: string,
) => {
  d.bookings['bk-1'] = {
    id: 'bk-1',
    tenantId: HOSPITAL,
    resourceId: doctor.resource,
    careSpaceId: space,
    healthcareServiceId: SVC.consulta,
    statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
  };
};

describe('hospital piloto: la política real detrás de los casos de uso de agenda', () => {
  describe('crear cita (schedule.create)', () => {
    it('caso 01: Ana crea cita de Pérez, consulta, en A-P1 → permitida y sellada con su permiso', async () => {
      const d = build();
      const { booking } = await d.createDirect.executeInTransaction(
        d.tx as any,
        cita(DOCTOR.perez, 'a-103', SVC.consulta),
        ANA,
      );
      expect(booking.bookedViaGrantId).toBe('g-ana-perez');
      expect(booking.careSpaceId).toBe('a-103');
    });

    it('caso 02: Ana agenda el ecocardiograma de Pérez en A-P2 → permitida', async () => {
      const d = build();
      const { booking } = await d.createDirect.executeInTransaction(
        d.tx as any,
        cita(DOCTOR.perez, 'a-201', SVC.ecocardio),
        ANA,
      );
      expect(booking.bookedViaGrantId).toBe('g-ana-perez');
      expect(booking.healthcareServiceId).toBe(SVC.ecocardio);
    });

    it('caso 05: Lucía (recepción) crea cita de Pérez en P1 → 403, su plantilla no tiene create', async () => {
      const d = build();
      await expect(
        d.createDirect.executeInTransaction(
          d.tx as any,
          cita(DOCTOR.perez, 'a-103', SVC.consulta),
          LUCIA,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.bookingsRepo.createBooking).not.toHaveBeenCalled();
    });

    it('caso 06: Marcos agenda Ecografía con Antelo en la sala 201 → permitida por su permiso de servicio', async () => {
      const d = build();
      const { booking } = await d.createDirect.executeInTransaction(
        d.tx as any,
        cita(DOCTOR.antelo, 'a-201', SVC.eco),
        MARCOS,
      );
      expect(booking.bookedViaGrantId).toBe('g-marcos-eco');
    });

    it('caso 07: Marcos agenda eco obstétrica con Rojas en B204 → 403 (otro servicio)', async () => {
      const d = build();
      await expect(
        d.createDirect.executeInTransaction(
          d.tx as any,
          cita(DOCTOR.rojas, 'b-204', SVC.ecoObstetrica),
          MARCOS,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.bookingsRepo.createBooking).not.toHaveBeenCalled();
    });

    it('caso 08a: Marcos agenda a Suárez en Sede Norte → permitida por el cruce doctor × sede', async () => {
      const d = build();
      const { booking } = await d.createDirect.executeInTransaction(
        d.tx as any,
        cita(DOCTOR.suarez, 'n-102', SVC.consulta),
        MARCOS,
      );
      expect(booking.bookedViaGrantId).toBe('g-marcos-suarez-norte');
    });

    it('caso 08b: Marcos agenda a Suárez en el Edificio B → 403, fuera de la sede del cruce', async () => {
      const d = build();
      await expect(
        d.createDirect.executeInTransaction(
          d.tx as any,
          cita(DOCTOR.suarez, 'b-102', SVC.consulta),
          MARCOS,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('una cita de mostrador (walkIn) de Lucía se autoriza con schedule.walk_in y nace con la llegada registrada', async () => {
      const d = build();
      const { booking } = await d.createDirect.executeInTransaction(
        d.tx as any,
        cita(DOCTOR.mendez, 'a-105', SVC.consulta, { walkIn: true }),
        LUCIA,
      );
      expect(booking.bookedViaGrantId).toBe('g-lucia-a-p1');
      expect(booking.statusConceptId).toBe(CONCEPTS.BOOKING_CHECKED_IN);
      expect(booking.checkedInAt).toBeInstanceOf(Date);
    });
  });

  describe('llegada del paciente (schedule.check_in)', () => {
    it('caso 03: Lucía registra la llegada de un paciente de Méndez en 105 → permitida', async () => {
      const d = build();
      confirmada(d, DOCTOR.mendez, 'a-105');
      const res = await d.checkIn.execute('bk-1', LUCIA);
      expect(res.bookingId).toBe('bk-1');
      expect(d.bookings['bk-1'].statusConceptId).toBe(
        CONCEPTS.BOOKING_CHECKED_IN,
      );
    });

    it('caso 04: Lucía registra una llegada en A-P4 → 403 y la cita no cambia', async () => {
      const d = build();
      confirmada(d, DOCTOR.mendez, 'a-401');
      await expect(d.checkIn.execute('bk-1', LUCIA)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(d.bookings['bk-1'].statusConceptId).toBe(
        CONCEPTS.BOOKING_CONFIRMED,
      );
    });

    it('el rechazo es el mismo para cualquier causa: no dice si la cita, el doctor o la organización existen', async () => {
      const d = build();
      confirmada(d, DOCTOR.mendez, 'a-401');
      const sinPermiso = await d.checkIn.execute('bk-1', LUCIA).catch((e) => e);
      d.bookings['bk-2'] = {
        ...d.bookings['bk-1'],
        id: 'bk-2',
        tenantId: OTRA_ORG,
      };
      const deOtraOrg = await d.checkIn.execute('bk-2', LUCIA).catch((e) => e);
      expect(deOtraOrg.message).toBe(sinPermiso.message);
    });
  });

  describe('agenda combinada y organización ajena', () => {
    const consulta = {
      org: HOSPITAL,
      from: '2026-11-02T00:00:00Z',
      to: '2026-11-09T00:00:00Z',
    } as any;

    it('caso 11: Rosa (consultorio de Céspedes, otra organización) ve la agenda del Hospital Piloto → 403', async () => {
      const d = build();
      await expect(d.agenda.list(consulta, ROSA)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('caso 11 (crear): Rosa tampoco crea citas en el Hospital Piloto: su organización activa es otra', async () => {
      const d = build();
      await expect(
        d.createDirect.executeInTransaction(
          d.tx as any,
          cita(DOCTOR.perez, 'a-103', SVC.consulta),
          ROSA,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('con el vínculo vigente Ana abre la agenda del hospital', async () => {
      const d = build();
      await expect(d.agenda.list(consulta, ANA)).resolves.toMatchObject({
        items: [],
      });
    });
  });

  describe('caso 12: Ana tras el fin de vínculo', () => {
    it('no crea, no registra llegadas y no abre la agenda', async () => {
      const d = build(['eng-ana']);
      await expect(
        d.createDirect.executeInTransaction(
          d.tx as any,
          cita(DOCTOR.perez, 'a-103', SVC.consulta),
          ANA,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      confirmada(d, DOCTOR.perez, 'a-103');
      await expect(d.checkIn.execute('bk-1', ANA)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(
        d.agenda.list(
          {
            org: HOSPITAL,
            from: '2026-11-02T00:00:00Z',
            to: '2026-11-09T00:00:00Z',
          } as any,
          ANA,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('sus citas siguen: terminar el vínculo no toca las reservas', async () => {
      const d = build(['eng-ana']);
      confirmada(d, DOCTOR.perez, 'a-103');
      expect(d.bookings['bk-1'].statusConceptId).toBe(
        CONCEPTS.BOOKING_CONFIRMED,
      );
    });
  });
});
