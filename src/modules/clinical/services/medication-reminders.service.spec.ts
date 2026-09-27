import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { MedicationRemindersService } from './medication-reminders.service';
import { CLIN } from '../clinical.concepts';

const PACIENTE = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const CUENTA = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
// 11:50 en La Paz; la toma de las 12:00 locales (16:00 UTC) cae en la ventana.
const NOW = new Date('2026-09-26T15:50:00Z');

/** Receta emitida con una toma diaria a las 12:00 de La Paz. */
function receta(over: Record<string, unknown> = {}): any {
  return {
    id: 'rx-1',
    custodianTenantId: 'tenant-1',
    patientProfileId: PACIENTE,
    statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
    timingAsNeeded: false,
    timingTimesOfDay: ['12:00'],
    timingStartAt: new Date('2026-09-20T04:00:00Z'),
    timingTimeZone: 'America/La_Paz',
    ...over,
  };
}

/**
 * Servicio con sus dobles. La marca de despacho se simula con un `Set` que se
 * comporta como el UNIQUE de la tabla: el segundo `claim` de la misma toma no
 * recibe fila.
 */
function build(requests: any[] = [receta()]) {
  const em: any = {};
  em.fork = mockFn(() => em);
  const requestsRepo = {
    findSchedulable: mockFn(() => Promise.resolve(requests)),
  };
  const claimed = new Map<string, string>();
  let seq = 0;
  const dispatchesRepo = {
    claim: mockFn((_em: any, requestId: string, doseAt: Date) => {
      const key = `${requestId}|${doseAt.toISOString()}`;
      if (claimed.has(key)) return Promise.resolve(undefined);
      const id = `dispatch-${++seq}`;
      claimed.set(key, id);
      return Promise.resolve(id);
    }),
    attachNotification: mockFn(() => Promise.resolve()),
    release: mockFn((_em: any, dispatchId: string) => {
      for (const [key, id] of claimed) {
        if (id === dispatchId) claimed.delete(key);
      }
      return Promise.resolve();
    }),
  };
  const accountLinks = {
    findActiveByPerson: mockFn(() => Promise.resolve({ userId: CUENTA })),
  };
  const notifications = {
    emitInApp: mockFn(() =>
      Promise.resolve({ requestId: 'notif-1', suppressed: false }),
    ),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const service = new MedicationRemindersService(
    em,
    requestsRepo as any,
    dispatchesRepo as any,
    accountLinks as any,
    notifications as any,
    logger as any,
  );
  return {
    service,
    requestsRepo,
    dispatchesRepo,
    accountLinks,
    notifications,
    logger,
    claimed,
  };
}

describe('MedicationRemindersService · despacho de recordatorios de toma', () => {
  describe('correcto', () => {
    it('avisa la toma de la ventana por la campana, sin nombrar el fármaco', async () => {
      const d = build();

      const res = await d.service.dispatchDue({ now: NOW });

      expect(res.processed).toBe(1);
      const [input] = d.notifications.emitInApp.mock.calls[0] as any[];
      expect(input.recipientUserId).toBe(CUENTA);
      expect(input.category).toBe('CLINICAL');
      expect(input.destination).toEqual({ type: 'PRESCRIPTION', id: 'rx-1' });
      expect(input.debounceKey).toBe('medrem:rx-1:2026-09-26T16:00:00.000Z');
      expect(input.bodyText).toContain('12:00');
      expect(input.tenantId).toBe('tenant-1');
      expect(d.dispatchesRepo.attachNotification).toHaveBeenCalledWith(
        expect.anything(),
        'dispatch-1',
        'notif-1',
      );
      // Busca sólo recetas en efecto y con la ventana de 15 minutos.
      const [, criteria] = d.requestsRepo.findSchedulable.mock
        .calls[0] as any[];
      expect(criteria.statusConceptIds).toEqual([
        CLIN.MEDICATION_REQUEST_ISSUED,
        CLIN.MEDICATION_REQUEST_ACTIVE,
      ]);
      expect(criteria.windowEnd.toISOString()).toBe('2026-09-26T16:05:00.000Z');
    });

    it('dedupe: la segunda pasada sobre la misma toma no vuelve a avisar', async () => {
      const d = build();

      await d.service.dispatchDue({ now: NOW });
      const second = await d.service.dispatchDue({
        now: new Date(NOW.getTime() + 60_000),
      });

      expect(second.processed).toBe(0);
      expect(second.detail).toContain('ya_avisados=1');
      expect(d.notifications.emitInApp).toHaveBeenCalledTimes(1);
    });
  });

  describe('límite', () => {
    it('la toma fuera de la ventana todavía no se avisa', async () => {
      const d = build();
      const res = await d.service.dispatchDue({
        now: new Date('2026-09-26T15:40:00Z'), // 16:00 queda a 20 min
      });
      expect(res.processed).toBe(0);
      expect(d.dispatchesRepo.claim).not.toHaveBeenCalled();
    });

    it('paciente sin cuenta: no es error, y la toma queda marcada', async () => {
      const d = build();
      d.accountLinks.findActiveByPerson.mockResolvedValue(null);

      const res = await d.service.dispatchDue({ now: NOW });

      expect(res.processed).toBe(0);
      expect(res.detail).toContain('sin_cuenta=1');
      expect(d.notifications.emitInApp).not.toHaveBeenCalled();
      expect(d.claimed.size).toBe(1);
    });

    it('PRN no genera avisos', async () => {
      const d = build([
        receta({ timingAsNeeded: true, timingTimesOfDay: undefined }),
      ]);
      const res = await d.service.dispatchDue({ now: NOW });
      expect(res.processed).toBe(0);
      expect(d.dispatchesRepo.claim).not.toHaveBeenCalled();
    });
  });

  describe('inválido', () => {
    it('si emitir falla, libera la marca y el resto del lote sigue', async () => {
      const d = build([receta(), receta({ id: 'rx-2' })]);
      d.notifications.emitInApp
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ requestId: 'notif-2', suppressed: false });

      const res = await d.service.dispatchDue({ now: NOW });

      expect(res.processed).toBe(1);
      expect(res.detail).toContain('fallidos=1');
      expect(d.dispatchesRepo.release).toHaveBeenCalledWith(
        expect.anything(),
        'dispatch-1',
      );
      // Liberada: la pasada siguiente la puede reintentar.
      expect(d.claimed.has('rx-1|2026-09-26T16:00:00.000Z')).toBe(false);
      expect(d.claimed.has('rx-2|2026-09-26T16:00:00.000Z')).toBe(true);
    });

    it('emitInApp informa failed (no lanza): también libera la marca', async () => {
      const d = build();
      d.notifications.emitInApp.mockResolvedValue({
        suppressed: false,
        failed: true,
      });
      const res = await d.service.dispatchDue({ now: NOW });
      expect(res.processed).toBe(0);
      expect(d.claimed.size).toBe(0);
    });

    it('posología incoherente guardada: se saltea con aviso en el log, sin datos clínicos', async () => {
      const d = build([
        receta({ timingTimesOfDay: ['25:00'] }),
        receta({ id: 'rx-2' }),
      ]);
      const res = await d.service.dispatchDue({ now: NOW });
      expect(res.processed).toBe(1);
      expect(res.detail).toContain('incoherentes=1');
      const [payload] = d.logger.warn.mock.calls[0] as any[];
      expect(payload).toEqual({
        operation: 'clinical.medication.reminders',
        requestId: 'rx-1',
        reason: 'INVALID_TIME_OF_DAY',
      });
    });
  });
});
