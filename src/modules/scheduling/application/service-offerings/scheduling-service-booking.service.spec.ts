import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../common';
import { SCHED } from '../../domain/scheduling.concepts';
import { SchedulingServiceBookingService } from './scheduling-service-booking.service';

const OFERTA = '11111111-1111-4111-8111-111111111111';
const MEDICO = '22222222-2222-4222-8222-222222222222';
const SEDE = '33333333-3333-4333-8333-333333333333';
const TENANT = '44444444-4444-4444-8444-444444444444';
const PACIENTE = '55555555-5555-4555-8555-555555555555';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const t = (dias: number, h: number, m = 0): Date => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dias);
  d.setUTCHours(h, m, 0, 0);
  return d;
};

const paciente = {
  id: 'user-pac',
  roles: ['PATIENT'],
  tenantIds: [TENANT],
} as any;
const medico = {
  id: 'user-med',
  roles: ['PRACTITIONER'],
  tenantIds: [TENANT],
  practitionerProfileId: MEDICO,
} as any;

function oferta(over: Record<string, unknown> = {}) {
  return {
    id: OFERTA,
    practitionerProfileId: MEDICO,
    serviceCatalogId: 'cat-1',
    minDurationMinutes: 30,
    maxDurationMinutes: 45,
    prepMinutes: 0,
    cleanupMinutes: 0,
    isPatientBookable: true,
    requiresApproval: false,
    statusConceptId: SCHED.OFFERING_ACTIVE,
    ...over,
  };
}

function sede(over: Record<string, unknown> = {}) {
  return {
    id: SEDE,
    tenantId: TENANT,
    name: 'Consultorio central',
    timeZone: 'UTC',
    resourceRefId: MEDICO,
    resourceRefType: 'health_practitioner_profiles',
    ...over,
  };
}

/** Una franja de servicios de mañana, 08:00–10:00 UTC. */
function franjaDeManana() {
  return {
    resourceId: SEDE,
    resourceName: 'Consultorio central',
    franjas: [{ startAt: t(1, 8), endAt: t(1, 10) }],
    minNoticeMinutes: 0,
    maxAdvanceDays: undefined,
  };
}

function build() {
  const callOrder: string[] = [];
  const tx = { flush: mockFn(async () => undefined) };
  const em = { transactional: mockFn(async (fn: any) => fn(tx)) };
  const offeringsRepo = {
    findOfferingById: mockFn(async () => oferta()),
    findResourcesOfProfessional: mockFn(async () => [sede()]),
    findCatalogItem: mockFn(async () => ({
      id: 'cat-1',
      isActive: true,
      serviceConceptId: 'concepto-servicio',
    })),
  };
  const catalogRepo = {
    findResourceById: mockFn(async () => sede()),
    createSlot: mockFn(() => ({ id: 'slot-nuevo' })),
  };
  const bookingsRepo = {
    createHold: mockFn((_tx: unknown, data: any) => ({
      id: 'hold-1',
      expiresAt: data.expiresAt,
    })),
  };
  const agenda = {
    franjasDeServicios: mockFn(async () => [franjaDeManana()]),
    ocupadoDelProfesional: mockFn(async () => []),
    retraer: mockFn(async () => 2),
  };
  const tiempoProfesional = {
    bloquearAgendaDeProfesional: mockFn(async () => {
      callOrder.push('lock');
    }),
  };
  const vinculos = { evaluar: mockFn(async () => 'sin-vinculos') };
  const representation = {
    assertMayActForPatient: mockFn(async () => undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn() };

  // El orden importa: el candado tiene que tomarse ANTES de leer lo ocupado.
  agenda.ocupadoDelProfesional.mockImplementation(async () => {
    callOrder.push('ocupado');
    return [];
  });

  const service = new SchedulingServiceBookingService(
    em as any,
    offeringsRepo as any,
    catalogRepo as any,
    bookingsRepo as any,
    agenda as any,
    tiempoProfesional as any,
    vinculos as any,
    representation as any,
    logger as any,
  );
  return {
    service,
    tx,
    offeringsRepo,
    catalogRepo,
    bookingsRepo,
    agenda,
    tiempoProfesional,
    vinculos,
    representation,
    callOrder,
  };
}

describe('SchedulingServiceBookingService', () => {
  describe('availability', () => {
    const query = {
      offeringId: OFERTA,
      from: t(1, 0).toISOString(),
      to: t(2, 0).toISOString(),
    };

    it('ofrece inicios donde cabe la duración MÁXIMA, y dice el mínimo como fin posible', async () => {
      const d = build();

      const res = await d.service.availability(query, paciente);

      expect(res.minDurationMinutes).toBe(30);
      expect(res.maxDurationMinutes).toBe(45);
      expect(res.items[0]).toEqual({
        resourceId: SEDE,
        startAt: t(1, 8).toISOString(),
        endAtMax: t(1, 8, 45).toISOString(),
        endAtMin: t(1, 8, 30).toISOString(),
      });
      // 45 min dentro de 08:00–10:00 con paso de 15: el último arranca 09:15.
      expect(res.items[res.items.length - 1].startAt).toBe(
        t(1, 9, 15).toISOString(),
      );
    });

    it('no ofrece un inicio que pise a una cita confirmada', async () => {
      const d = build();
      d.agenda.ocupadoDelProfesional.mockResolvedValue([
        { startAt: t(1, 8, 30), endAt: t(1, 9) },
      ]);

      const res = await d.service.availability(query, paciente);

      expect(res.items.map((i) => i.startAt)).toEqual([
        t(1, 9).toISOString(),
        t(1, 9, 15).toISOString(),
      ]);
    });

    it('un paciente no ve una oferta que no se puede reservar: responde 404', async () => {
      const d = build();
      d.offeringsRepo.findOfferingById.mockResolvedValue(
        oferta({ isPatientBookable: false }),
      );

      await expect(d.service.availability(query, paciente)).rejects.toThrow(
        /Servicio no encontrado/,
      );
    });

    it('el dueño sí ve su oferta aunque no esté abierta a pacientes', async () => {
      const d = build();
      d.offeringsRepo.findOfferingById.mockResolvedValue(
        oferta({ isPatientBookable: false }),
      );

      const res = await d.service.availability(query, medico);

      expect(res.items.length).toBeGreaterThan(0);
    });

    it('no ofrece sedes de otra organización', async () => {
      const d = build();
      d.offeringsRepo.findResourcesOfProfessional.mockResolvedValue([
        sede({ tenantId: 'otro-tenant' }),
      ]);

      await d.service.availability(query, paciente);

      expect(d.agenda.franjasDeServicios.mock.calls[0][2]).toEqual([]);
    });

    it('rechaza una ventana invertida y una demasiado larga', async () => {
      const d = build();
      await expect(
        d.service.availability(
          { ...query, from: t(3, 0).toISOString(), to: t(2, 0).toISOString() },
          paciente,
        ),
      ).rejects.toThrow(/empezar antes de terminar/);
      await expect(
        d.service.availability(
          {
            ...query,
            from: t(1, 0).toISOString(),
            to: t(200, 0).toISOString(),
          },
          paciente,
        ),
      ).rejects.toThrow(/hasta 62 días/);
    });

    it('respeta el aviso mínimo de la política de la plantilla', async () => {
      const d = build();
      d.agenda.franjasDeServicios.mockResolvedValue([
        { ...franjaDeManana(), minNoticeMinutes: 60 * 24 * 365 },
      ]);

      const res = await d.service.availability(query, paciente);

      expect(res.items).toEqual([]);
    });
  });

  describe('placeHold', () => {
    const dto = {
      resourceId: SEDE,
      startAt: t(1, 8, 15).toISOString(),
      patientProfileId: PACIENTE,
    };

    it('toma el candado del profesional ANTES de leer lo ocupado', async () => {
      const d = build();

      await d.service.placeHold(OFERTA, dto, paciente);

      expect(d.callOrder).toEqual(['lock', 'ocupado']);
    });

    it('crea el cupo puntual de la duración MÁXIMA, ya tomado, ligado a la oferta', async () => {
      const d = build();

      const res = await d.service.placeHold(OFERTA, dto, paciente);

      const cupo = d.catalogRepo.createSlot.mock.calls[0][1];
      expect(cupo).toMatchObject({
        resourceId: SEDE,
        practitionerServiceOfferingId: OFERTA,
        capacity: 1,
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_HELD,
        serviceConceptId: 'concepto-servicio',
      });
      expect(cupo.endAt.getTime() - cupo.startAt.getTime()).toBe(45 * 60_000);
      // Sin `scheduleTemplateId`: un cupo de servicio no sale de una plantilla.
      expect(cupo.scheduleTemplateId).toBeUndefined();
      expect(res.bookableSlotId).toBe('slot-nuevo');
      expect(res.holdToken).toEqual(expect.any(String));
      expect(res.retractedSlots).toBe(2);
    });

    it('retiene con una retención ACTIVA y vencimiento', async () => {
      const d = build();

      await d.service.placeHold(OFERTA, dto, paciente);

      const hold = d.bookingsRepo.createHold.mock.calls[0][1];
      expect(hold.statusConceptId).toBe(CONCEPTS.HOLD_ACTIVE);
      expect(hold.bookableSlotId).toBe('slot-nuevo');
      expect(hold.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('retrae las consultas incluyendo preparación y limpieza del turno', async () => {
      const d = build();
      d.offeringsRepo.findOfferingById.mockResolvedValue(
        oferta({ prepMinutes: 5, cleanupMinutes: 10 }),
      );
      // 5 + 45 + 10 = 60 min: entra exacto desde las 08:00 con inicio a las 08:05.
      const dto5 = { ...dto, startAt: t(1, 8, 5).toISOString() };

      await d.service.placeHold(OFERTA, dto5, paciente);

      const [, , desde, hasta] = d.agenda.retraer.mock.calls[0];
      expect(desde).toEqual(t(1, 8));
      expect(hasta).toEqual(t(1, 9));
    });

    it('409 si el horario ya no cabe: otro paciente lo tomó entre la lectura y la retención', async () => {
      const d = build();
      d.agenda.ocupadoDelProfesional.mockResolvedValue([
        { startAt: t(1, 8), endAt: t(1, 8, 40) },
      ]);

      await expect(d.service.placeHold(OFERTA, dto, paciente)).rejects.toThrow(
        /ya no está disponible/,
      );
      // Y no deja nada a medias: ni cupo, ni retención, ni consultas retraídas.
      expect(d.catalogRepo.createSlot).not.toHaveBeenCalled();
      expect(d.bookingsRepo.createHold).not.toHaveBeenCalled();
      expect(d.agenda.retraer).not.toHaveBeenCalled();
    });

    it('409 si el inicio cae fuera de toda franja que admita servicios', async () => {
      const d = build();
      d.agenda.franjasDeServicios.mockResolvedValue([]);

      await expect(d.service.placeHold(OFERTA, dto, paciente)).rejects.toThrow(
        /ya no está disponible/,
      );
    });

    it('422 si el horario ya pasó', async () => {
      const d = build();
      await expect(
        d.service.placeHold(
          OFERTA,
          { ...dto, startAt: t(-1, 8).toISOString() },
          paciente,
        ),
      ).rejects.toThrow(/ya pasó/);
    });

    it('404 si la sede no es del profesional dueño de la oferta', async () => {
      const d = build();
      d.catalogRepo.findResourceById.mockResolvedValue(
        sede({ resourceRefId: 'otro-medico' }),
      );

      await expect(d.service.placeHold(OFERTA, dto, paciente)).rejects.toThrow(
        /Agenda no encontrada/,
      );
    });

    it('403 si la sede es de otra organización', async () => {
      const d = build();
      d.catalogRepo.findResourceById.mockResolvedValue(
        sede({ tenantId: 'otro-tenant' }),
      );

      await expect(d.service.placeHold(OFERTA, dto, paciente)).rejects.toThrow(
        /otra organización/,
      );
    });

    it('un paciente no puede retener a nombre de un perfil ajeno', async () => {
      const d = build();
      d.representation.assertMayActForPatient.mockRejectedValue(
        new Error('no representa a ese paciente'),
      );

      await expect(d.service.placeHold(OFERTA, dto, paciente)).rejects.toThrow(
        /no representa/,
      );
      expect(d.catalogRepo.createSlot).not.toHaveBeenCalled();
    });

    it('un profesional con vínculo ya no vigente no compromete turnos de esa organización', async () => {
      const d = build();
      d.vinculos.evaluar.mockResolvedValue('revocado');

      await expect(d.service.placeHold(OFERTA, dto, medico)).rejects.toThrow(
        /ya no está vigente/,
      );
    });

    it('422 si falta más anticipación que la que pide la política', async () => {
      const d = build();
      d.agenda.franjasDeServicios.mockResolvedValue([
        { ...franjaDeManana(), minNoticeMinutes: 60 * 24 * 365 },
      ]);

      await expect(d.service.placeHold(OFERTA, dto, paciente)).rejects.toThrow(
        /demasiado pronto/,
      );
      expect(d.catalogRepo.createSlot).not.toHaveBeenCalled();
    });
  });
});
