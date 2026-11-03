import { jest } from '@jest/globals';
import { CONCEPTS, runWithTenant } from '../../../../common';
import { SCHED } from '../../domain/scheduling.concepts';
import { SchedulingFlexibleBookingService } from './scheduling-flexible-booking.service';

const PRACTITIONER = '22222222-2222-4222-8222-222222222222';
const SITE = '33333333-3333-4333-8333-333333333333';
const TENANT = '44444444-4444-4444-8444-444444444444';
const OTHER_TENANT = '66666666-6666-4666-8666-666666666666';
const PATIENT = '55555555-5555-4555-8555-555555555555';
const TEMPLATE = '77777777-7777-4777-8777-777777777777';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Mañana (o `days` días) a las `h:m` UTC. */
const t = (days: number, h: number, m = 0): Date => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(h, m, 0, 0);
  return d;
};
/** 0 = domingo … 6 = sábado, del día `days` desde hoy, en UTC. */
const dow = (days: number): number => t(days, 12).getUTCDay();

const patient = {
  id: 'user-pac',
  roles: ['PATIENT'],
  tenantIds: [TENANT],
} as any;

function site(over: Record<string, unknown> = {}) {
  return {
    id: SITE,
    tenantId: TENANT,
    name: 'Consultorio central',
    timeZone: 'UTC',
    resourceRefId: PRACTITIONER,
    resourceRefType: 'health_practitioner_profiles',
    ...over,
  };
}

/** Una plantilla flexible de 08:00 a 10:00 UTC el día de mañana, 30 min por paciente. */
function flexibleTemplate(over: Record<string, unknown> = {}, rules?: any[]) {
  return {
    template: {
      id: TEMPLATE,
      resourceId: SITE,
      flexibleHours: true,
      slotMinutes: 30,
      bookingPolicyId: undefined,
      ...over,
    },
    rules: rules ?? [
      {
        scheduleTemplateId: TEMPLATE,
        dayOfWeek: dow(1),
        startTime: '08:00',
        endTime: '10:00',
      },
    ],
  };
}

function build() {
  const callOrder: string[] = [];
  const tx = { flush: mockFn(async () => undefined) };
  const em = { transactional: mockFn(async (fn: any) => fn(tx)) };
  const catalogRepo = {
    findResourceById: mockFn(async () => site()),
    findFlexibleTemplatesOfResource: mockFn(async () => [flexibleTemplate()]),
    findPolicyById: mockFn(async () => null),
    createSlot: mockFn((_tx: unknown, data: any) => ({
      id: 'slot-nuevo',
      ...data,
    })),
  };
  const bookingsRepo = {
    createHold: mockFn((_tx: unknown, data: any) => ({
      id: 'hold-1',
      expiresAt: data.expiresAt,
    })),
    countActiveBookingsForPatient: mockFn(async () => 0),
  };
  const agenda = {
    practitionerBusyTime: mockFn(async () => {
      callOrder.push('ocupado');
      return [];
    }),
  };
  const professionalTime = {
    lockPractitionerAgenda: mockFn(async () => {
      callOrder.push('lock');
    }),
  };
  const affiliations = { evaluate: mockFn(async () => 'sin-vinculos') };
  const representation = {
    assertMayActForPatient: mockFn(async () => undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn() };

  const service = new SchedulingFlexibleBookingService(
    em as any,
    catalogRepo as any,
    bookingsRepo as any,
    agenda as any,
    professionalTime as any,
    affiliations as any,
    representation as any,
    logger as any,
  );
  return {
    service,
    tx,
    catalogRepo,
    bookingsRepo,
    agenda,
    professionalTime,
    representation,
    callOrder,
  };
}

const inTenant = <T>(fn: () => Promise<T>): Promise<T> =>
  runWithTenant(TENANT, fn);

describe('SchedulingFlexibleBookingService', () => {
  describe('availability', () => {
    const query = {
      from: t(1, 0).toISOString(),
      to: t(2, 0).toISOString(),
    };

    it('ofrece una hora cada 15 min en la franja, y cada una reserva el tiempo por paciente', async () => {
      const d = build();
      const result = await inTenant(() =>
        d.service.availability(SITE, query, patient),
      );

      expect(result.stepMinutes).toBe(15);
      // 08:00 … 09:30: la última que deja entrar una consulta de 30 antes de las 10.
      expect(result.items.map((item) => item.startAt)).toEqual(
        [0, 15, 30, 45, 60, 75, 90].map((min) => t(1, 8, min).toISOString()),
      );
      expect(result.items[0].endAt).toBe(t(1, 8, 30).toISOString());
      expect(result.items[0].templateId).toBe(TEMPLATE);
    });

    it('no ofrece horas que pisan lo que el profesional ya tiene ocupado', async () => {
      const d = build();
      d.agenda.practitionerBusyTime.mockImplementation(async () => [
        { startAt: t(1, 8, 30), endAt: t(1, 9, 0) },
      ]);
      const result = await inTenant(() =>
        d.service.availability(SITE, query, patient),
      );

      // 08:00 entra (termina 08:30); 08:15 pisaría. Después del hueco, desde las 09:00.
      expect(result.items.map((item) => item.startAt)).toEqual(
        [t(1, 8, 0), t(1, 9, 0), t(1, 9, 15), t(1, 9, 30)].map((d0) =>
          d0.toISOString(),
        ),
      );
    });

    it('una agenda sin horario flexible publicado responde vacío sin leer lo ocupado', async () => {
      const d = build();
      d.catalogRepo.findFlexibleTemplatesOfResource.mockImplementation(
        async () => [],
      );
      const result = await inTenant(() =>
        d.service.availability(SITE, query, patient),
      );

      expect(result.items).toEqual([]);
      expect(d.agenda.practitionerBusyTime).not.toHaveBeenCalled();
    });

    it('una franja sólo de servicios no ofrece consultas flexibles', async () => {
      const d = build();
      d.catalogRepo.findFlexibleTemplatesOfResource.mockImplementation(
        async () => [
          flexibleTemplate({}, [
            {
              scheduleTemplateId: TEMPLATE,
              dayOfWeek: dow(1),
              startTime: '08:00',
              endTime: '10:00',
              bookingModeConceptId: SCHED.RULE_MODE_SERVICES,
            },
          ]),
        ],
      );
      const result = await inTenant(() =>
        d.service.availability(SITE, query, patient),
      );
      expect(result.items).toEqual([]);
    });

    it('respeta el aviso mínimo de la política', async () => {
      const d = build();
      d.catalogRepo.findFlexibleTemplatesOfResource.mockImplementation(
        async () => [flexibleTemplate({ bookingPolicyId: 'pol-1' })],
      );
      // Un aviso que llega hasta mañana a las 09:00.
      const notice = Math.ceil((t(1, 9).getTime() - Date.now()) / 60_000);
      d.catalogRepo.findPolicyById.mockImplementation(async () => ({
        minNoticeMinutes: notice,
      }));
      const result = await inTenant(() =>
        d.service.availability(SITE, query, patient),
      );
      expect(result.items.map((item) => item.startAt)).toEqual(
        [t(1, 9, 15), t(1, 9, 30)].map((d0) => d0.toISOString()),
      );
    });

    it('404 si la agenda no es de un profesional', async () => {
      const d = build();
      d.catalogRepo.findResourceById.mockImplementation(async () =>
        site({ resourceRefType: 'rooms' }),
      );
      await expect(
        inTenant(() => d.service.availability(SITE, query, patient)),
      ).rejects.toMatchObject({ status: 404 });
    });

    it('403 si la agenda es de otra organización', async () => {
      const d = build();
      d.catalogRepo.findResourceById.mockImplementation(async () =>
        site({ tenantId: OTHER_TENANT }),
      );
      await expect(
        inTenant(() => d.service.availability(SITE, query, patient)),
      ).rejects.toMatchObject({ status: 403 });
    });

    it('422 con una ventana de más de 62 días', async () => {
      const d = build();
      await expect(
        inTenant(() =>
          d.service.availability(
            SITE,
            { from: t(1, 0).toISOString(), to: t(80, 0).toISOString() },
            patient,
          ),
        ),
      ).rejects.toMatchObject({ status: 422 });
    });

    // `SUPERADMIN` acotado a un tenant (`scopedRoles`, MCH-001) no es plataforma
    // fuera de él: la agenda de otra organización sigue respondiendo 403 (#1241).
    describe('SUPERADMIN acotado a un tenant', () => {
      const scopedTo = (tenantId: string) =>
        ({
          id: 'admin-a',
          roles: ['SUPERADMIN'],
          scopedRoles: { [tenantId]: ['SUPERADMIN'] },
          tenantIds: [TENANT],
        }) as any;

      it('acotado a A: 403 sobre la agenda de B', async () => {
        const d = build();
        d.catalogRepo.findResourceById.mockImplementation(async () =>
          site({ tenantId: OTHER_TENANT }),
        );
        await expect(
          inTenant(() => d.service.availability(SITE, query, scopedTo(TENANT))),
        ).rejects.toMatchObject({ status: 403 });
      });

      it('acotado a B (la de la agenda) sí la consulta, aun con otro tenant activo', async () => {
        const d = build();
        d.catalogRepo.findResourceById.mockImplementation(async () =>
          site({ tenantId: OTHER_TENANT }),
        );
        const result = await inTenant(() =>
          d.service.availability(SITE, query, scopedTo(OTHER_TENANT)),
        );
        expect(result.items.length).toBeGreaterThan(0);
      });

      it('global: consulta la agenda de B', async () => {
        const d = build();
        d.catalogRepo.findResourceById.mockImplementation(async () =>
          site({ tenantId: OTHER_TENANT }),
        );
        const result = await inTenant(() =>
          d.service.availability(SITE, query, {
            id: 'root',
            roles: ['SUPERADMIN'],
            tenantIds: [],
          } as any),
        );
        expect(result.items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('placeHold', () => {
    it('crea el cupo de la hora pedida —capacidad 1, ya tomado, con su plantilla— y lo retiene', async () => {
      const d = build();
      const result = await inTenant(() =>
        d.service.placeHold(
          SITE,
          { startAt: t(1, 8, 40).toISOString(), patientProfileId: PATIENT },
          patient,
        ),
      );

      expect(d.catalogRepo.createSlot).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          resourceId: SITE,
          scheduleTemplateId: TEMPLATE,
          startAt: t(1, 8, 40),
          endAt: t(1, 9, 10),
          capacity: 1,
          remainingCapacity: 0,
          statusConceptId: CONCEPTS.SLOT_HELD,
        }),
      );
      expect(d.bookingsRepo.createHold).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          bookableSlotId: 'slot-nuevo',
          patientProfileId: PATIENT,
          statusConceptId: CONCEPTS.HOLD_ACTIVE,
        }),
      );
      expect(result).toMatchObject({
        id: 'hold-1',
        bookableSlotId: 'slot-nuevo',
        startAt: t(1, 8, 40).toISOString(),
        endAt: t(1, 9, 10).toISOString(),
      });
      expect(typeof result.holdToken).toBe('string');
    });

    it('toma el candado del profesional ANTES de leer lo ocupado', async () => {
      const d = build();
      await inTenant(() =>
        d.service.placeHold(SITE, { startAt: t(1, 8).toISOString() }, patient),
      );
      expect(d.professionalTime.lockPractitionerAgenda).toHaveBeenCalledWith(
        d.tx,
        PRACTITIONER,
      );
      expect(d.callOrder).toEqual(['lock', 'ocupado']);
    });

    it('409 si otra reserva o retención ya ocupa esa hora, y no crea nada', async () => {
      const d = build();
      d.agenda.practitionerBusyTime.mockImplementation(async () => [
        { startAt: t(1, 8, 30), endAt: t(1, 9, 0) },
      ]);
      await expect(
        inTenant(() =>
          d.service.placeHold(
            SITE,
            { startAt: t(1, 8, 15).toISOString() },
            patient,
          ),
        ),
      ).rejects.toMatchObject({ status: 409 });
      expect(d.catalogRepo.createSlot).not.toHaveBeenCalled();
      expect(d.bookingsRepo.createHold).not.toHaveBeenCalled();
    });

    it('422 si la hora cae fuera de la franja (o la consulta no termina dentro)', async () => {
      const d = build();
      await expect(
        inTenant(() =>
          d.service.placeHold(
            SITE,
            { startAt: t(1, 9, 45).toISOString() },
            patient,
          ),
        ),
      ).rejects.toMatchObject({ status: 422 });
      expect(d.catalogRepo.createSlot).not.toHaveBeenCalled();
    });

    it('422 si la hora ya pasó', async () => {
      const d = build();
      await expect(
        inTenant(() =>
          d.service.placeHold(
            SITE,
            { startAt: t(-1, 8).toISOString() },
            patient,
          ),
        ),
      ).rejects.toMatchObject({ status: 422 });
    });

    it('422 si la hora no es un minuto entero', async () => {
      const d = build();
      const odd = new Date(t(1, 8, 10).getTime() + 30_000);
      await expect(
        inTenant(() =>
          d.service.placeHold(SITE, { startAt: odd.toISOString() }, patient),
        ),
      ).rejects.toMatchObject({ status: 422 });
      expect(d.professionalTime.lockPractitionerAgenda).not.toHaveBeenCalled();
    });

    it('un paciente no puede retener para otro paciente que no representa', async () => {
      const d = build();
      const denied = Object.assign(new Error('No representa'), {
        status: 403,
      });
      d.representation.assertMayActForPatient.mockImplementation(async () => {
        throw denied;
      });
      await expect(
        inTenant(() =>
          d.service.placeHold(
            SITE,
            { startAt: t(1, 8).toISOString(), patientProfileId: PATIENT },
            patient,
          ),
        ),
      ).rejects.toBe(denied);
      expect(d.catalogRepo.createSlot).not.toHaveBeenCalled();
    });

    it('403 si la agenda es de otra organización', async () => {
      const d = build();
      d.catalogRepo.findResourceById.mockImplementation(async () =>
        site({ tenantId: OTHER_TENANT }),
      );
      await expect(
        inTenant(() =>
          d.service.placeHold(
            SITE,
            { startAt: t(1, 8).toISOString() },
            patient,
          ),
        ),
      ).rejects.toMatchObject({ status: 403 });
      expect(d.catalogRepo.createSlot).not.toHaveBeenCalled();
    });

    it('409 si el paciente alcanzó el tope de citas activas de la política', async () => {
      const d = build();
      d.catalogRepo.findFlexibleTemplatesOfResource.mockImplementation(
        async () => [flexibleTemplate({ bookingPolicyId: 'pol-1' })],
      );
      d.catalogRepo.findPolicyById.mockImplementation(async () => ({
        maxActivePerPatient: 1,
      }));
      d.bookingsRepo.countActiveBookingsForPatient.mockImplementation(
        async () => 1,
      );
      await expect(
        inTenant(() =>
          d.service.placeHold(
            SITE,
            { startAt: t(1, 8).toISOString(), patientProfileId: PATIENT },
            patient,
          ),
        ),
      ).rejects.toMatchObject({ status: 409 });
      expect(d.catalogRepo.createSlot).not.toHaveBeenCalled();
    });

    it('la retención vence según la política de la plantilla', async () => {
      const d = build();
      d.catalogRepo.findFlexibleTemplatesOfResource.mockImplementation(
        async () => [flexibleTemplate({ bookingPolicyId: 'pol-1' })],
      );
      d.catalogRepo.findPolicyById.mockImplementation(async () => ({
        holdTtlSeconds: 60,
      }));
      const before = Date.now();
      const result = await inTenant(() =>
        d.service.placeHold(SITE, { startAt: t(1, 8).toISOString() }, patient),
      );
      const ttl = new Date(result.expiresAt).getTime() - before;
      expect(ttl).toBeGreaterThanOrEqual(59_000);
      expect(ttl).toBeLessThanOrEqual(61_000);
    });
  });
});
