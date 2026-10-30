import {
  DISPATCH_MARK_PREFIX,
  MIN_DISPATCH_LEASE_MS,
  blocksOtherCharges,
  dispatchLeaseMs,
  isDispatchMark,
  newDispatchMark,
} from './payments-gateway-dispatch-mark';

const MIN = 60_000;

describe('marca de despacho', () => {
  describe('isDispatchMark / newDispatchMark', () => {
    it('correcto: una marca nueva se reconoce y nunca tiene la forma de un pi_ de la pasarela', () => {
      const mark = newDispatchMark();
      expect(isDispatchMark(mark)).toBe(true);
      expect(mark.startsWith(DISPATCH_MARK_PREFIX)).toBe(true);
      // El receptor de webhooks sólo acepta `pi_[a-z0-9]{10,40}`.
      expect(/^pi_[a-z0-9]{10,40}$/u.test(mark)).toBe(false);
      expect(newDispatchMark()).not.toBe(mark);
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
      expect(dispatchLeaseMs(config)).toBeGreaterThan(worstCase);
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

  describe('blocksOtherCharges', () => {
    const NOW = Date.parse('2026-10-30T12:00:00Z');
    const LEASE = 15 * MIN;
    const mark = newDispatchMark();
    const at = (msAgo: number) => new Date(NOW - msAgo);

    it('correcto: un pi_ real bloquea siempre, sea cual sea su antigüedad', () => {
      expect(
        blocksOtherCharges(
          { gatewayIntentRef: 'pi_abcdefghij12', updatedAt: at(400 * MIN) },
          NOW,
          LEASE,
        ),
      ).toBe(true);
    });

    it('correcto: una marca reciente bloquea', () => {
      expect(
        blocksOtherCharges(
          { gatewayIntentRef: mark, updatedAt: at(1_000) },
          NOW,
          LEASE,
        ),
      ).toBe(true);
    });

    it('límite: una marca justo dentro del plazo bloquea y justo en el plazo deja de bloquear', () => {
      expect(
        blocksOtherCharges(
          { gatewayIntentRef: mark, updatedAt: at(LEASE - 1) },
          NOW,
          LEASE,
        ),
      ).toBe(true);
      expect(
        blocksOtherCharges(
          { gatewayIntentRef: mark, updatedAt: at(LEASE) },
          NOW,
          LEASE,
        ),
      ).toBe(false);
    });

    it('límite: una marca vencida deja de bloquear', () => {
      expect(
        blocksOtherCharges(
          { gatewayIntentRef: mark, updatedAt: at(LEASE + 1) },
          NOW,
          LEASE,
        ),
      ).toBe(false);
    });

    it.each([
      ['sin fecha', undefined],
      ['con fecha nula', null],
      ['con fecha inválida', new Date('no-es-una-fecha')],
    ])(
      'inválido: una marca %s BLOQUEA (ante la duda no se desbloquea)',
      (_name, updatedAt) => {
        expect(
          blocksOtherCharges({ gatewayIntentRef: mark, updatedAt }, NOW, LEASE),
        ).toBe(true);
      },
    );

    it('inválido: sin referencia no bloquea (no hay cobro ni reserva)', () => {
      expect(blocksOtherCharges({ gatewayIntentRef: null }, NOW, LEASE)).toBe(
        false,
      );
      expect(blocksOtherCharges({}, NOW, LEASE)).toBe(false);
    });
  });
});
