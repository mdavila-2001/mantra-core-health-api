import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { SCHED } from '../scheduling.concepts';
import { SchedulingServiceAgendaService } from './scheduling-service-agenda.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const MEDICO = '22222222-2222-4222-8222-222222222222';
const SEDE = '33333333-3333-4333-8333-333333333333';

/** Un instante de un lunes fijo (2026-10-05) en UTC. */
const lunes = (h: number, m = 0): Date =>
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
  const tiempoProfesional = { compromisos: mockFn(async () => []) };
  const service = new SchedulingServiceAgendaService(
    offeringsRepo as any,
    catalogRepo as any,
    tiempoProfesional as any,
  );
  return { service, em, offeringsRepo, catalogRepo, tiempoProfesional };
}

const regla = (over: Record<string, unknown> = {}) => ({
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
  resourceId: SEDE,
  resourceName: 'Consultorio central',
  timeZone: 'UTC',
  validTo: undefined,
});

const sede = { id: SEDE, name: 'Consultorio central', timeZone: 'UTC' };
const dia = {
  desde: lunes(0),
  hasta: new Date(lunes(0).getTime() + 86_400_000),
};

describe('SchedulingServiceAgendaService', () => {
  describe('franjasDeServicios', () => {
    it('toma las franjas SERVICES y MIXED y deja las de sólo consultas', async () => {
      const d = build();
      d.catalogRepo.findRulesByResourceOwner.mockResolvedValue([
        regla({ bookingModeConceptId: SCHED.RULE_MODE_SERVICES }),
        {
          ...regla({
            scheduleTemplateId: 'tpl-2',
            bookingModeConceptId: SCHED.RULE_MODE_MIXED,
            startTime: '14:00',
            endTime: '16:00',
          }),
        },
        regla({
          scheduleTemplateId: 'tpl-3',
          bookingModeConceptId: SCHED.RULE_MODE_CONSULTATIONS,
        }),
        // Sin modo declarado ≡ sólo consultas: lo que toda franja era antes.
        regla({ scheduleTemplateId: 'tpl-4', bookingModeConceptId: null }),
      ]);

      const grupos = await d.service.franjasDeServicios(
        d.em,
        MEDICO,
        [sede],
        dia.desde,
        dia.hasta,
      );

      expect(grupos).toHaveLength(2);
      expect(grupos.flatMap((g) => g.franjas.map((f) => f.startAt))).toEqual([
        lunes(8),
        lunes(14),
      ]);
    });

    it('ignora las sedes que no se pidieron', async () => {
      const d = build();
      d.catalogRepo.findRulesByResourceOwner.mockResolvedValue([regla()]);

      const grupos = await d.service.franjasDeServicios(
        d.em,
        MEDICO,
        [{ ...sede, id: 'otra-sede' }],
        dia.desde,
        dia.hasta,
      );

      expect(grupos).toEqual([]);
    });

    it('respeta la hora LOCAL de la sede, no la UTC', async () => {
      const d = build();
      d.catalogRepo.findRulesByResourceOwner.mockResolvedValue([regla()]);

      // La Paz es UTC−4: las 08:00 locales son las 12:00 UTC.
      const grupos = await d.service.franjasDeServicios(
        d.em,
        MEDICO,
        [{ ...sede, timeZone: 'America/La_Paz' }],
        lunes(0),
        new Date(lunes(0).getTime() + 2 * 86_400_000),
      );

      expect(grupos[0].franjas[0].startAt).toEqual(lunes(12));
      expect(grupos[0].franjas[0].endAt).toEqual(lunes(14));
    });

    it('no incluye días fuera de la vigencia de la franja', async () => {
      const d = build();
      d.catalogRepo.findRulesByResourceOwner.mockResolvedValue([
        regla({ validTo: '2026-10-04' }),
      ]);

      const grupos = await d.service.franjasDeServicios(
        d.em,
        MEDICO,
        [sede],
        dia.desde,
        dia.hasta,
      );

      expect(grupos[0]?.franjas ?? []).toEqual([]);
    });

    it('arrastra el aviso mínimo y la anticipación de la política de la plantilla', async () => {
      const d = build();
      d.catalogRepo.findRulesByResourceOwner.mockResolvedValue([regla()]);
      d.catalogRepo.findTemplateById.mockResolvedValue({
        bookingPolicyId: 'pol-1',
      });
      d.catalogRepo.findPolicyById.mockResolvedValue({
        minNoticeMinutes: 90,
        maxAdvanceDays: 30,
      });

      const [grupo] = await d.service.franjasDeServicios(
        d.em,
        MEDICO,
        [sede],
        dia.desde,
        dia.hasta,
      );

      expect(grupo.minNoticeMinutes).toBe(90);
      expect(grupo.maxAdvanceDays).toBe(30);
    });
  });

  describe('ocupadoDelProfesional', () => {
    it('une citas, retenciones y turnos de servicio, y ensancha estos con sus colchones', async () => {
      const d = build();
      d.tiempoProfesional.compromisos.mockResolvedValue([
        { startAt: lunes(8), endAt: lunes(9) },
      ]);
      d.offeringsRepo.findLiveHoldsOfProfessional.mockResolvedValue([
        { holdId: 'h', startAt: lunes(10), endAt: lunes(11) },
      ]);
      d.offeringsRepo.findLiveServiceSlotsOfProfessional.mockResolvedValue([
        {
          slotId: 's',
          startAt: lunes(12),
          endAt: lunes(12, 45),
          prepMinutes: 5,
          cleanupMinutes: 10,
        },
      ]);

      const ocupado = await d.service.ocupadoDelProfesional(
        d.em,
        MEDICO,
        lunes(0),
        lunes(23),
        lunes(7),
      );

      expect(ocupado).toEqual([
        { startAt: lunes(8), endAt: lunes(9) },
        { startAt: lunes(10), endAt: lunes(11) },
        // 12:00–12:45 con 5 de preparación antes y 10 de limpieza después.
        { startAt: lunes(11, 55), endAt: lunes(12, 55) },
      ]);
    });

    it('mira un margen alrededor del rango: un colchón puede llegar desde afuera', async () => {
      const d = build();

      await d.service.ocupadoDelProfesional(
        d.em,
        MEDICO,
        lunes(8),
        lunes(9),
        lunes(7),
      );

      const [, , desdeAncho, hastaAncho] =
        d.tiempoProfesional.compromisos.mock.calls[0];
      expect(desdeAncho.getTime()).toBeLessThan(lunes(8).getTime());
      expect(hastaAncho.getTime()).toBeGreaterThan(lunes(9).getTime());
    });

    it('pregunta por retenciones ACTIVAS que no hayan vencido', async () => {
      const d = build();

      await d.service.ocupadoDelProfesional(
        d.em,
        MEDICO,
        lunes(8),
        lunes(9),
        lunes(7),
      );

      const llamada = d.offeringsRepo.findLiveHoldsOfProfessional.mock.calls[0];
      expect(llamada[4]).toBe(CONCEPTS.HOLD_ACTIVE);
      expect(llamada[5]).toEqual(lunes(7));
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

      const n = await d.service.retraer(
        d.em,
        MEDICO,
        lunes(8),
        lunes(9),
        'u-1',
      );

      expect(n).toBe(2);
      expect(a.statusConceptId).toBe(SCHED.SLOT_RETRACTED);
      expect(b.statusConceptId).toBe(SCHED.SLOT_RETRACTED);
    });
  });

  describe('reabrir', () => {
    const cupo = (id: string, h: number, m = 0) => ({
      id,
      startAt: lunes(h, m),
      endAt: lunes(h, m + 30),
      statusConceptId: SCHED.SLOT_RETRACTED,
    });

    it('vuelve a ofrecer los retraídos que ya no chocan con nada', async () => {
      const d = build();
      const a = cupo('a', 9);
      const b = cupo('b', 9, 30);
      d.offeringsRepo.findRetractedSlotsOfProfessional.mockResolvedValue([
        a,
        b,
      ]);

      const n = await d.service.reabrir(
        d.em,
        MEDICO,
        lunes(9),
        lunes(10),
        'u-1',
      );

      expect(n).toBe(2);
      expect(a.statusConceptId).toBe(CONCEPTS.SLOT_OPEN);
      expect(b.statusConceptId).toBe(CONCEPTS.SLOT_OPEN);
    });

    it('deja retraído el que otro turno sigue pisando', async () => {
      const d = build();
      const a = cupo('a', 9);
      const b = cupo('b', 9, 30);
      d.offeringsRepo.findRetractedSlotsOfProfessional.mockResolvedValue([
        a,
        b,
      ]);
      // Otro servicio vivo pisa 09:30–10:00.
      d.offeringsRepo.findLiveServiceSlotsOfProfessional.mockResolvedValue([
        {
          slotId: 's',
          startAt: lunes(9, 40),
          endAt: lunes(10, 10),
          prepMinutes: 0,
          cleanupMinutes: 0,
        },
      ]);

      const n = await d.service.reabrir(
        d.em,
        MEDICO,
        lunes(9),
        lunes(10),
        'u-1',
      );

      expect(n).toBe(1);
      expect(a.statusConceptId).toBe(CONCEPTS.SLOT_OPEN);
      expect(b.statusConceptId).toBe(SCHED.SLOT_RETRACTED);
    });

    it('no calcula nada si no hay retraídos que mirar', async () => {
      const d = build();

      const n = await d.service.reabrir(
        d.em,
        MEDICO,
        lunes(9),
        lunes(10),
        'u-1',
      );

      expect(n).toBe(0);
      expect(d.tiempoProfesional.compromisos).not.toHaveBeenCalled();
    });
  });

  describe('reabrirTramo', () => {
    it('un cupo de una sala o equipo no retrae ni devuelve nada', async () => {
      const d = build();
      d.catalogRepo.findResourceById.mockResolvedValue({
        resourceRefType: 'rooms',
        resourceRefId: 'sala-1',
      });

      const n = await d.service.reabrirTramo(
        d.em,
        { resourceId: 'r' },
        lunes(9),
        lunes(10),
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
        await d.service.reabrirTramo(d.em, {}, lunes(9), lunes(10), 'u'),
      ).toBe(0);
    });
  });
});
