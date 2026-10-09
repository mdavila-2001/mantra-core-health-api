import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../common';
import { SCHED } from '../../domain/scheduling.concepts';
import { SchedulingServiceAgendaService } from './scheduling-service-agenda.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PRACTITIONER_ACTOR = '22222222-2222-4222-8222-222222222222';
const SITE = '33333333-3333-4333-8333-333333333333';

/** Un instante de un lunes fijo (2026-10-05) en UTC. */
const monday = (h: number, m = 0): Date =>
  new Date(Date.UTC(2026, 9, 5, h, m, 0, 0));

function build() {
  const em = {} as any;
  const offeringsRepo = {
    findLiveHoldsOfProfessional: mockFn(async () => []),
    findLiveServiceSlotsOfProfessional: mockFn(async () => []),
    findRetractedSlotsOfProfessional: mockFn(async () => []),
    findOfferingById: mockFn(),
    findCatalogItem: mockFn(),
  };
  const catalogRepo = {
    findRulesByResourceOwner: mockFn(async () => []),
    findTemplateById: mockFn(async () => ({ bookingPolicyId: null })),
    findPolicyById: mockFn(async () => null),
    findOpenSlotsOfProfessionalInWindow: mockFn(async () => []),
    findResourceById: mockFn(),
  };
  const professionalTime = { commitments: mockFn(async () => []) };
  const service = new SchedulingServiceAgendaService(
    offeringsRepo as any,
    catalogRepo as any,
    professionalTime as any,
  );
  return { service, em, offeringsRepo, catalogRepo, professionalTime: professionalTime };
}

const rule = (over: Record<string, unknown> = {}) => ({
  rule: {
    scheduleTemplateId: 'tpl-1',
    dayOfWeek: 1, // lunes
    startTime: '08:00',
    endTime: '10:00',
    bookingModeConceptId: SCHED.RULE_MODE_SERVICES,
    validFrom: null,
    validTo: null,
    ...over,
  },
  resourceId: SITE,
  resourceName: 'Consultorio central',
  timeZone: 'UTC',
  validTo: undefined,
});

const site = { id: SITE, name: 'Consultorio central', timeZone: 'UTC' };
const day = {
  from: monday(0),
  to: new Date(monday(0).getTime() + 86_400_000),
};

describe('SchedulingServiceAgendaService', () => {
  describe('bandsOfServices', () => {
    it('toma las franjas SERVICES y MIXED y deja las de sólo consultas', async () => {
      const d = build();
      d.catalogRepo.findRulesByResourceOwner.mockResolvedValue([
        rule({ bookingModeConceptId: SCHED.RULE_MODE_SERVICES }),
        {
          ...rule({
            scheduleTemplateId: 'tpl-2',
            bookingModeConceptId: SCHED.RULE_MODE_MIXED,
            startTime: '14:00',
            endTime: '16:00',
          }),
        },
        rule({
          scheduleTemplateId: 'tpl-3',
          bookingModeConceptId: SCHED.RULE_MODE_CONSULTATIONS,
        }),
        // Sin modo declarado ≡ sólo consultas: lo que toda franja era antes.
        rule({ scheduleTemplateId: 'tpl-4', bookingModeConceptId: null }),
      ]);

      const groups = await d.service.bandsOfServices(
        d.em,
        PRACTITIONER_ACTOR,
        [site],
        day.from,
        day.to,
      );

      expect(groups).toHaveLength(2);
      expect(groups.flatMap((g) => g.bands.map((f) => f.startAt))).toEqual([
        monday(8),
        monday(14),
      ]);
    });

    it('ignora las sedes que no se pidieron', async () => {
      const d = build();
      d.catalogRepo.findRulesByResourceOwner.mockResolvedValue([rule()]);

      const groups = await d.service.bandsOfServices(
        d.em,
        PRACTITIONER_ACTOR,
        [{ ...site, id: 'otra-sede' }],
        day.from,
        day.to,
      );

      expect(groups).toEqual([]);
    });

    it('respeta la hora LOCAL de la sede, no la UTC', async () => {
      const d = build();
      d.catalogRepo.findRulesByResourceOwner.mockResolvedValue([rule()]);

      // La Paz es UTC−4: las 08:00 locales son las 12:00 UTC.
      const groups = await d.service.bandsOfServices(
        d.em,
        PRACTITIONER_ACTOR,
        [{ ...site, timeZone: 'America/La_Paz' }],
        monday(0),
        new Date(monday(0).getTime() + 2 * 86_400_000),
      );

      expect(groups[0].bands[0].startAt).toEqual(monday(12));
      expect(groups[0].bands[0].endAt).toEqual(monday(14));
    });

    it('no incluye días fuera de la vigencia de la franja', async () => {
      const d = build();
      d.catalogRepo.findRulesByResourceOwner.mockResolvedValue([
        rule({ validTo: '2026-10-04' }),
      ]);

      const groups = await d.service.bandsOfServices(
        d.em,
        PRACTITIONER_ACTOR,
        [site],
        day.from,
        day.to,
      );

      expect(groups[0]?.bands ?? []).toEqual([]);
    });

    it('arrastra el aviso mínimo y la anticipación de la política de la plantilla', async () => {
      const d = build();
      d.catalogRepo.findRulesByResourceOwner.mockResolvedValue([rule()]);
      d.catalogRepo.findTemplateById.mockResolvedValue({
        bookingPolicyId: 'pol-1',
      });
      d.catalogRepo.findPolicyById.mockResolvedValue({
        minNoticeMinutes: 90,
        maxAdvanceDays: 30,
      });

      const [group] = await d.service.bandsOfServices(
        d.em,
        PRACTITIONER_ACTOR,
        [site],
        day.from,
        day.to,
      );

      expect(group.minNoticeMinutes).toBe(90);
      expect(group.maxAdvanceDays).toBe(30);
    });
  });

  describe('practitionerBusyTime', () => {
    it('une citas, retenciones y turnos de servicio, y ensancha estos con sus colchones', async () => {
      const d = build();
      d.professionalTime.commitments.mockResolvedValue([
        { startAt: monday(8), endAt: monday(9) },
      ]);
      d.offeringsRepo.findLiveHoldsOfProfessional.mockResolvedValue([
        { holdId: 'h', startAt: monday(10), endAt: monday(11) },
      ]);
      d.offeringsRepo.findLiveServiceSlotsOfProfessional.mockResolvedValue([
        {
          slotId: 's',
          startAt: monday(12),
          endAt: monday(12, 45),
          prepMinutes: 5,
          cleanupMinutes: 10,
        },
      ]);

      const busy = await d.service.practitionerBusyTime(
        d.em,
        PRACTITIONER_ACTOR,
        monday(0),
        monday(23),
        monday(7),
      );

      expect(busy).toEqual([
        { startAt: monday(8), endAt: monday(9) },
        { startAt: monday(10), endAt: monday(11) },
        // 12:00–12:45 con 5 de preparación antes y 10 de limpieza después.
        { startAt: monday(11, 55), endAt: monday(12, 55) },
      ]);
    });

    it('mira un margen alrededor del rango: un colchón puede llegar desde afuera', async () => {
      const d = build();

      await d.service.practitionerBusyTime(
        d.em,
        PRACTITIONER_ACTOR,
        monday(8),
        monday(9),
        monday(7),
      );

      const [, , wideFrom, wideTo] =
        d.professionalTime.commitments.mock.calls[0];
      expect(wideFrom.getTime()).toBeLessThan(monday(8).getTime());
      expect(wideTo.getTime()).toBeGreaterThan(monday(9).getTime());
    });

    it('pregunta por retenciones ACTIVAS que no hayan vencido', async () => {
      const d = build();

      await d.service.practitionerBusyTime(
        d.em,
        PRACTITIONER_ACTOR,
        monday(8),
        monday(9),
        monday(7),
      );

      const call = d.offeringsRepo.findLiveHoldsOfProfessional.mock.calls[0];
      expect(call[4]).toBe(CONCEPTS.HOLD_ACTIVE);
      expect(call[5]).toEqual(monday(7));
    });
  });

  describe('retraer', () => {
    it('pasa los cupos libres a RETRAÍDO (no a bloqueado) y cuenta cuántos', async () => {
      const d = build();
      const a = { statusConceptId: CONCEPTS.SLOT_OPEN };
      const b = { statusConceptId: CONCEPTS.SLOT_OPEN };
      d.catalogRepo.findOpenSlotsOfProfessionalInWindow.mockResolvedValue([
        a,
        b,
      ]);

      const n = await d.service.retract(
        d.em,
        PRACTITIONER_ACTOR,
        monday(8),
        monday(9),
        'u-1',
      );

      expect(n).toBe(2);
      expect(a.statusConceptId).toBe(SCHED.SLOT_RETRACTED);
      expect(b.statusConceptId).toBe(SCHED.SLOT_RETRACTED);
    });
  });

  describe('reabrir', () => {
    const slot = (id: string, h: number, m = 0) => ({
      id,
      startAt: monday(h, m),
      endAt: monday(h, m + 30),
      statusConceptId: SCHED.SLOT_RETRACTED,
    });

    it('vuelve a ofrecer los retraídos que ya no chocan con nada', async () => {
      const d = build();
      const a = slot('a', 9);
      const b = slot('b', 9, 30);
      d.offeringsRepo.findRetractedSlotsOfProfessional.mockResolvedValue([
        a,
        b,
      ]);

      const n = await d.service.reopen(
        d.em,
        PRACTITIONER_ACTOR,
        monday(9),
        monday(10),
        'u-1',
      );

      expect(n).toBe(2);
      expect(a.statusConceptId).toBe(CONCEPTS.SLOT_OPEN);
      expect(b.statusConceptId).toBe(CONCEPTS.SLOT_OPEN);
    });

    it('deja retraído el que otro turno sigue pisando', async () => {
      const d = build();
      const a = slot('a', 9);
      const b = slot('b', 9, 30);
      d.offeringsRepo.findRetractedSlotsOfProfessional.mockResolvedValue([
        a,
        b,
      ]);
      // Otro servicio vivo pisa 09:30–10:00.
      d.offeringsRepo.findLiveServiceSlotsOfProfessional.mockResolvedValue([
        {
          slotId: 's',
          startAt: monday(9, 40),
          endAt: monday(10, 10),
          prepMinutes: 0,
          cleanupMinutes: 0,
        },
      ]);

      const n = await d.service.reopen(
        d.em,
        PRACTITIONER_ACTOR,
        monday(9),
        monday(10),
        'u-1',
      );

      expect(n).toBe(1);
      expect(a.statusConceptId).toBe(CONCEPTS.SLOT_OPEN);
      expect(b.statusConceptId).toBe(SCHED.SLOT_RETRACTED);
    });

    it('no calcula nada si no hay retraídos que mirar', async () => {
      const d = build();

      const n = await d.service.reopen(
        d.em,
        PRACTITIONER_ACTOR,
        monday(9),
        monday(10),
        'u-1',
      );

      expect(n).toBe(0);
      expect(d.professionalTime.commitments).not.toHaveBeenCalled();
    });
  });

  describe('reopenSpan', () => {
    it('un cupo de una sala o equipo no retrae ni devuelve nada', async () => {
      const d = build();
      d.catalogRepo.findResourceById.mockResolvedValue({
        resourceRefType: 'rooms',
        resourceRefId: 'sala-1',
      });

      const n = await d.service.reopenSpan(
        d.em,
        { resourceId: 'r' },
        monday(9),
        monday(10),
        'u-1',
      );

      expect(n).toBe(0);
      expect(
        d.offeringsRepo.findRetractedSlotsOfProfessional,
      ).not.toHaveBeenCalled();
    });

    it('un cupo sin recurso no hace nada', async () => {
      const d = build();
      expect(
        await d.service.reopenSpan(d.em, {}, monday(9), monday(10), 'u'),
      ).toBe(0);
    });
  });
});
