import {
  DISPATCH_MARK_PREFIX,
  GATEWAY_IDEMPOTENCY_RETENTION_MS,
  MAX_RESEND_AGE_MS,
  MIN_DISPATCH_LEASE_MS,
  canResendWithSameKey,
  classifyInFlight,
  dispatchLeaseMs,
  dispatchMarkAgeMs,
  isDispatchMark,
  newDispatchMark,
} from './payments-gateway-dispatch-mark';

const MIN = 60_000;
const HOUR = 60 * MIN;
const NOW = Date.parse('2026-10-30T12:00:00Z');

describe('marca de despacho', () => {
  describe('isDispatchMark / newDispatchMark', () => {
    it('correcto: una marca nueva se reconoce y nunca tiene la forma de un pi_ de la pasarela', () => {
      const mark = newDispatchMark(NOW);
      expect(isDispatchMark(mark)).toBe(true);
      expect(mark.startsWith(DISPATCH_MARK_PREFIX)).toBe(true);
      // El receptor de webhooks sólo acepta `pi_[a-z0-9]{10,40}`.
      expect(/^pi_[a-z0-9]{10,40}$/u.test(mark)).toBe(false);
      expect(newDispatchMark(NOW)).not.toBe(mark);
    });

    it.each([
      ['un pi_ real', 'pi_abcdefghij12'],
      ['vacío', ''],
      ['null', null],
      ['undefined', undefined],
      ['el prefijo en medio', 'x-dispatching:abc'],
      ['mayúsculas', 'DISPATCHING:abc'],
    ])('inválido: %s no es una marca', (_name, value) => {
      expect(isDispatchMark(value)).toBe(false);
    });
  });

  describe('dispatchMarkAgeMs', () => {
    it('correcto: la antigüedad sale de la fecha DENTRO de la marca', () => {
      expect(dispatchMarkAgeMs(newDispatchMark(NOW - 5 * MIN), NOW)).toBe(
        5 * MIN,
      );
    });

    it('límite: una marca fechada en el futuro tiene antigüedad 0, no negativa', () => {
      expect(dispatchMarkAgeMs(newDispatchMark(NOW + 2 * MIN), NOW)).toBe(0);
    });

    it('D4: una fecha más allá de la deriva de reloj tolerada (5 min) es ilegible, no «reciente»', () => {
      expect(dispatchMarkAgeMs(newDispatchMark(NOW + 4 * MIN), NOW)).toBe(0);
      expect(
        dispatchMarkAgeMs(newDispatchMark(NOW + 6 * MIN), NOW),
      ).toBeUndefined();
      expect(
        classifyInFlight(
          { gatewayIntentRef: newDispatchMark(NOW + 3 * HOUR) },
          NOW,
          15 * MIN,
        ),
      ).toBe('reconciliation_required');
    });

    it.each([
      [
        'formato anterior sin fecha (dispatching:<uuid>)',
        'dispatching:123e4567-e89b-12d3-a456-426614174000',
      ],
      ['otro formato', 'dispatching:x'],
      ['sin uuid', `dispatching:${NOW}`],
      [
        'fecha no numérica',
        'dispatching:abc:123e4567-e89b-12d3-a456-426614174000',
      ],
      ['un pi_', 'pi_abcdefghij12'],
      ['null', null],
    ])(
      'inválido: %s => antigüedad desconocida (nunca «reciente»)',
      (_n, ref) => {
        expect(dispatchMarkAgeMs(ref, NOW)).toBeUndefined();
      },
    );
  });

  describe('dispatchLeaseMs', () => {
    it('correcto: con los valores por defecto (10 s, 3 intentos) es el mínimo de 15 minutos', () => {
      expect(dispatchLeaseMs({ timeoutMs: 10_000, maxAttempts: 3 })).toBe(
        MIN_DISPATCH_LEASE_MS,
      );
      expect(MIN_DISPATCH_LEASE_MS).toBe(15 * MIN);
    });

    it('límite: nunca baja de cuatro veces el peor caso de la llamada', () => {
      const config = { timeoutMs: 120_000, maxAttempts: 10 };
      const worstCase = 10 * 120_000 + 9 * 5_000;
      expect(dispatchLeaseMs(config)).toBe(4 * worstCase);
    });

    it('límite: el plazo siempre supera el peor caso de la llamada (una reserva viva no se confunde con una abandonada)', () => {
      for (const [timeoutMs, maxAttempts] of [
        [1, 1],
        [10_000, 3],
        [60_000, 5],
        [300_000, 8],
      ]) {
        const worstCase = maxAttempts * timeoutMs + (maxAttempts - 1) * 5_000;
        expect(dispatchLeaseMs({ timeoutMs, maxAttempts })).toBeGreaterThan(
          worstCase,
        );
      }
    });
  });

  describe('classifyInFlight: toda referencia BLOQUEA; la antigüedad sólo cambia la clase', () => {
    const LEASE = 15 * MIN;
    const markAged = (ms: number) => newDispatchMark(NOW - ms);

    it('correcto: un pi_ real está en vuelo sea cual sea su antigüedad', () => {
      expect(
        classifyInFlight({ gatewayIntentRef: 'pi_abcdefghij12' }, NOW, LEASE),
      ).toBe('in_flight');
    });

    it('correcto: una marca reciente está en vuelo', () => {
      expect(
        classifyInFlight({ gatewayIntentRef: markAged(1_000) }, NOW, LEASE),
      ).toBe('in_flight');
    });

    it('límite: justo dentro del plazo está en vuelo y en el plazo pasa a requerir conciliación', () => {
      expect(
        classifyInFlight({ gatewayIntentRef: markAged(LEASE - 1) }, NOW, LEASE),
      ).toBe('in_flight');
      expect(
        classifyInFlight({ gatewayIntentRef: markAged(LEASE) }, NOW, LEASE),
      ).toBe('reconciliation_required');
    });

    it('límite: una marca vencida (incluso de hace días) requiere conciliación, NUNCA queda en «none»', () => {
      for (const ms of [LEASE + 1, 5 * HOUR, 30 * HOUR, 400 * 24 * HOUR]) {
        expect(
          classifyInFlight({ gatewayIntentRef: markAged(ms) }, NOW, LEASE),
        ).toBe('reconciliation_required');
      }
    });

    it.each([
      ['formato ilegible', 'dispatching:x'],
      ['fecha ausente', `dispatching:${NOW}`],
    ])(
      'inválido: una marca con %s requiere conciliación (ante la duda no se desbloquea)',
      (_name, ref) => {
        expect(classifyInFlight({ gatewayIntentRef: ref }, NOW, LEASE)).toBe(
          'reconciliation_required',
        );
      },
    );

    it('inválido: sin referencia no hay cobro ni reserva', () => {
      expect(classifyInFlight({ gatewayIntentRef: null }, NOW, LEASE)).toBe(
        'none',
      );
      expect(classifyInFlight({}, NOW, LEASE)).toBe('none');
    });
  });

  describe('canResendWithSameKey: sólo mientras la pasarela recuerda la clave', () => {
    it('correcto: una marca reciente se puede reenviar', () => {
      expect(canResendWithSameKey(newDispatchMark(NOW - 20 * MIN), NOW)).toBe(
        true,
      );
    });

    it('límite: el margen es de una hora bajo las 24 h de retención', () => {
      expect(GATEWAY_IDEMPOTENCY_RETENTION_MS).toBe(24 * HOUR);
      expect(MAX_RESEND_AGE_MS).toBe(23 * HOUR);
      expect(
        canResendWithSameKey(newDispatchMark(NOW - MAX_RESEND_AGE_MS + 1), NOW),
      ).toBe(true);
      expect(
        canResendWithSameKey(newDispatchMark(NOW - MAX_RESEND_AGE_MS), NOW),
      ).toBe(false);
    });

    it.each([
      ['más de 24 h', newDispatchMark(NOW - 25 * HOUR)],
      ['fecha ilegible', 'dispatching:x'],
      ['un pi_', 'pi_abcdefghij12'],
      ['sin referencia', null],
    ])('inválido: %s no se reenvía', (_n, ref) => {
      expect(canResendWithSameKey(ref, NOW)).toBe(false);
    });
  });
});
