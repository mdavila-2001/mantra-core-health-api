import { jest } from '@jest/globals';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { VisitAgendaService } from './visit-agenda.service';
import { PHL } from '../pharma_lab.concepts';

const DOCTOR = '11111111-1111-1111-1111-111111111111';
const LAB = '22222222-2222-2222-2222-222222222222';
const VISITOR = '33333333-3333-3333-3333-333333333333';
const ACTOR = { id: DOCTOR } as any;

/**
 * Martes 1 de septiembre de 2026, 15:00 en `America/La_Paz` (UTC-4) = 19:00 UTC.
 * Todas las pruebas de encaje usan esta fecha para que la aritmética de zona sea
 * verificable a mano.
 */
const TUESDAY_15_LOCAL = new Date('2026-09-01T19:00:00.000Z');

/** Política activa por defecto: martes de 15:00 a 17:00, presencial. */
function policy(overrides: Record<string, unknown> = {}): Record<string, any> {
  return {
    id: 'policy-1',
    doctorUserId: DOCTOR,
    timeZone: 'America/La_Paz',
    autoConfirm: false,
    minNoticeHours: 0,
    rescheduleCutoffHours: 12,
    statusConceptId: PHL.POLICY_ACTIVE,
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Ventana del martes por la tarde. */
function window(overrides: Record<string, unknown> = {}): Record<string, any> {
  return {
    id: 'window-1',
    doctorVisitPolicyId: 'policy-1',
    weekday: 2,
    startTime: '15:00:00',
    endTime: '17:00:00',
    slotDurationMinutes: 30,
    modalityConceptId: PHL.MODALITY_IN_PERSON,
    location: 'Consultorio 3',
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param options - Estado inicial de los dobles.
 * @returns El servicio y los dobles.
 */
function build(
  options: {
    /** Política devuelta por el repositorio. */
    policyRow?: Record<string, any> | null;
    /** Ventanas de la política. */
    windows?: Record<string, any>[];
    /** Visitas ya registradas ese día. */
    occupying?: Record<string, any>[];
    /** Conflictos de la agenda clínica. */
    conflicts?: { kind: string; startAt: Date; endAt: Date }[];
    /** Bloqueo aplicable. */
    block?: Record<string, any> | null;
  } = {},
) {
  const policyRow =
    options.policyRow === undefined ? policy() : options.policyRow;

  const repo = {
    findPolicy: mockFn(async () => policyRow),
    createPolicy: mockFn(() => policyRow ?? policy()),
    listWindows: mockFn(async () => options.windows ?? [window()]),
    replaceWindows: mockFn(async () => undefined),
    createBlock: mockFn(() => ({ id: 'block-1' })),
    findBlock: mockFn(async () => options.block ?? null),
    listActiveBlocks: mockFn(async () => []),
    findApplicableBlock: mockFn(async () => options.block ?? null),
  };
  const visitsRepo = {
    listOccupyingRequests: mockFn(async () => options.occupying ?? []),
  };
  const calendar = {
    findConflicts: mockFn(async () => options.conflicts ?? []),
  };
  const audit = { record: mockFn(async () => undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const em: any = {
    transactional: mockFn((cb: any) => cb(em)),
    flush: mockFn(async () => undefined),
  };

  const service = new VisitAgendaService(
    em,
    repo as any,
    visitsRepo as any,
    calendar as any,
    audit as any,
    logger as any,
  );
  return { service, repo, em };
}

describe('VisitAgendaService', () => {
  describe('configuración', () => {
    it('rechaza una ventana con la hora de fin antes que la de inicio', async () => {
      const { service } = build();

      await expect(
        service.putPolicy(
          {
            windows: [
              {
                weekday: 2,
                startTime: '17:00',
                endTime: '15:00',
                slotDurationMinutes: 30,
                modalityConceptId: PHL.MODALITY_IN_PERSON,
              },
            ],
          } as any,
          ACTOR,
        ),
      ).rejects.toThrow('posterior a la de inicio');
    });

    it('rechaza dos ventanas del mismo día que se superponen', async () => {
      const { service } = build();

      await expect(
        service.putPolicy(
          {
            windows: [
              {
                weekday: 2,
                startTime: '15:00',
                endTime: '17:00',
                slotDurationMinutes: 30,
                modalityConceptId: PHL.MODALITY_IN_PERSON,
              },
              {
                weekday: 2,
                startTime: '16:30',
                endTime: '18:00',
                slotDurationMinutes: 30,
                modalityConceptId: PHL.MODALITY_IN_PERSON,
              },
            ],
          } as any,
          ACTOR,
        ),
      ).rejects.toThrow('se superponen');
    });

    it('admite dos ventanas contiguas del mismo día', async () => {
      const { service, repo } = build();

      await service.putPolicy(
        {
          windows: [
            {
              weekday: 2,
              startTime: '15:00',
              endTime: '17:00',
              slotDurationMinutes: 30,
              modalityConceptId: PHL.MODALITY_IN_PERSON,
            },
            {
              weekday: 2,
              startTime: '17:00',
              endTime: '18:00',
              slotDurationMinutes: 30,
              modalityConceptId: PHL.MODALITY_IN_PERSON,
            },
          ],
        } as any,
        ACTOR,
      );

      expect(repo.replaceWindows).toHaveBeenCalled();
    });
  });

  describe('disponibilidad', () => {
    it('acepta un horario que cae dentro de la ventana', async () => {
      const { service, em } = build();

      const slot = await service.assertSlotAvailable(
        em,
        DOCTOR,
        TUESDAY_15_LOCAL,
        30,
        PHL.MODALITY_IN_PERSON,
      );

      expect(slot.timeZone).toBe('America/La_Paz');
      expect(slot.window.location).toBe('Consultorio 3');
    });

    it('rechaza un horario fuera de la ventana', async () => {
      const { service, em } = build();
      // 11:00 local del martes: la ventana empieza a las 15:00.
      const tooEarly = new Date('2026-09-01T15:00:00.000Z');

      await expect(
        service.assertSlotAvailable(
          em,
          DOCTOR,
          tooEarly,
          30,
          PHL.MODALITY_IN_PERSON,
        ),
      ).rejects.toThrow('fuera de las ventanas');
    });

    it('rechaza una visita que se sale del final de la ventana', async () => {
      const { service, em } = build();
      // 16:45 local + 30 minutos termina a las 17:15, y la ventana cierra a las 17:00.
      const almostClosing = new Date('2026-09-01T20:45:00.000Z');

      await expect(
        service.assertSlotAvailable(
          em,
          DOCTOR,
          almostClosing,
          30,
          PHL.MODALITY_IN_PERSON,
        ),
      ).rejects.toThrow('fuera de las ventanas');
    });

    it('rechaza una modalidad que no coincide con la de la ventana', async () => {
      const { service, em } = build();

      await expect(
        service.assertSlotAvailable(
          em,
          DOCTOR,
          TUESDAY_15_LOCAL,
          30,
          PHL.MODALITY_VIRTUAL,
        ),
      ).rejects.toThrow('modalidad');
    });

    it('rechaza una duración mayor a la admitida', async () => {
      const { service, em } = build({
        policyRow: policy({ maxDurationMinutes: 20 }),
      });

      await expect(
        service.assertSlotAvailable(
          em,
          DOCTOR,
          TUESDAY_15_LOCAL,
          30,
          PHL.MODALITY_IN_PERSON,
        ),
      ).rejects.toThrow('duración máxima');
    });

    it('exige la antelación mínima', async () => {
      const { service, em } = build({
        policyRow: policy({ minNoticeHours: 24 }),
      });

      await expect(
        service.assertSlotAvailable(
          em,
          DOCTOR,
          new Date(Date.now() + 3_600_000),
          30,
          PHL.MODALITY_IN_PERSON,
        ),
      ).rejects.toThrow('antelación');
    });

    it('rechaza superponerse con otra visita', async () => {
      const { service, em } = build({
        occupying: [
          {
            id: 'other',
            requestedStartAt: new Date('2026-09-01T19:15:00.000Z'),
            durationMinutes: 30,
          },
        ],
      });

      await expect(
        service.assertSlotAvailable(
          em,
          DOCTOR,
          TUESDAY_15_LOCAL,
          30,
          PHL.MODALITY_IN_PERSON,
        ),
      ).rejects.toThrow('otra visita');
    });

    it('rechaza superponerse con la agenda clínica del doctor', async () => {
      const { service, em } = build({
        conflicts: [
          {
            kind: 'consultation',
            startAt: TUESDAY_15_LOCAL,
            endAt: new Date('2026-09-01T19:30:00.000Z'),
          },
        ],
      });

      await expect(
        service.assertSlotAvailable(
          em,
          DOCTOR,
          TUESDAY_15_LOCAL,
          30,
          PHL.MODALITY_IN_PERSON,
        ),
      ).rejects.toThrow('agenda clínica');
    });

    it('respeta el máximo de visitas por día', async () => {
      const { service, em } = build({
        policyRow: policy({ maxVisitsPerDay: 1 }),
        occupying: [
          {
            id: 'other',
            requestedStartAt: new Date('2026-09-01T21:00:00.000Z'),
            durationMinutes: 30,
          },
        ],
      });

      await expect(
        service.assertSlotAvailable(
          em,
          DOCTOR,
          TUESDAY_15_LOCAL,
          30,
          PHL.MODALITY_IN_PERSON,
        ),
      ).rejects.toThrow('máximo de visitas');
    });

    it('rechaza cuando el doctor no configuró agenda de visitas', async () => {
      const { service, em } = build({ policyRow: null });

      await expect(
        service.assertSlotAvailable(
          em,
          DOCTOR,
          TUESDAY_15_LOCAL,
          30,
          PHL.MODALITY_IN_PERSON,
        ),
      ).rejects.toThrow('no recibe visitas');
    });
  });

  describe('bloqueos', () => {
    it('impide solicitar cuando hay un bloqueo vigente', async () => {
      const { service, em } = build({
        block: { id: 'block-1', reason: 'Publicidad engañosa' },
      });

      await expect(
        service.assertVisitorAccepted(em, DOCTOR, LAB, VISITOR, []),
      ).rejects.toThrow('bloqueó las visitas');
    });

    it('exige que la especialidad esté admitida cuando la política la acota', async () => {
      const { service, em } = build({
        policyRow: policy({
          allowedSpecialtyConceptIds: ['cardio'],
        }),
      });

      await expect(
        service.assertVisitorAccepted(em, DOCTOR, LAB, VISITOR, ['derma']),
      ).rejects.toThrow('determinadas especialidades');
    });

    it('acepta cuando la especialidad del visitador está admitida', async () => {
      const { service, em } = build({
        policyRow: policy({
          allowedSpecialtyConceptIds: ['cardio'],
        }),
      });

      await expect(
        service.assertVisitorAccepted(em, DOCTOR, LAB, VISITOR, ['cardio']),
      ).resolves.toBeUndefined();
    });

    it('exige un motivo para bloquear y no admite bloqueo vacío', async () => {
      const { service } = build();

      await expect(
        service.createBlock({ reason: 'Sin justificación' } as any, ACTOR),
      ).rejects.toThrow('Indicá el laboratorio o el visitador');
    });
  });
});
