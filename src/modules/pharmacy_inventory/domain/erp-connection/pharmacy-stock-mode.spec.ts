import {
  decideOrderLine,
  lastFour,
  maskSecretHint,
  resolveStockMode,
  type StockModeInput,
} from './pharmacy-stock-mode';

const CONNECTED: StockModeInput = {
  linked: true,
  enabled: true,
  hasCredential: true,
  supportedSystem: true,
};

describe('la regla del modo de la farmacia (FAR-C9, D-7)', () => {
  it('manual por defecto: sin conexión', () => {
    expect(resolveStockMode(null)).toBe('MANUAL');
  });

  it.each([
    ['sin connection_id', { linked: false }],
    ['desactivada', { enabled: false }],
    ['sin clave', { hasCredential: false }],
    ['con un tipo de sistema sin adaptador', { supportedSystem: false }],
  ])('manual %s', (_label, change) => {
    expect(resolveStockMode({ ...CONNECTED, ...change })).toBe('MANUAL');
  });

  it('conectada: activa, con clave y con adaptador', () => {
    expect(resolveStockMode(CONNECTED)).toBe('CONNECTED');
  });
});

describe('cómo entra cada línea', () => {
  const noLedger = { hasPositions: false, available: 0 };

  it('manual: «por confirmar», aunque el libro tenga unidades', () => {
    expect(
      decideOrderLine({ mode: 'MANUAL' }, 'p', 2, {
        hasPositions: true,
        available: 9,
      }),
    ).toEqual({ kind: 'PENDING_CONFIRMATION' });
    expect(decideOrderLine({ mode: 'MANUAL' }, 'p', 2, noLedger)).toEqual({
      kind: 'PENDING_CONFIRMATION',
    });
  });

  it('manual: «No lo tengo» o catálogo en 0 siguen sin stock (C3)', () => {
    expect(
      decideOrderLine({ mode: 'MANUAL' }, 'p', 1, {
        hasPositions: true,
        available: 0,
      }),
    ).toEqual({ kind: 'OUT_OF_STOCK' });
    expect(
      decideOrderLine({ mode: 'MANUAL' }, 'p', 1, {
        ...noLedger,
        declaredStock: 0,
      }),
    ).toEqual({ kind: 'OUT_OF_STOCK' });
  });

  it('conectada con stock: reserva con lo que dice la farmacia', () => {
    const source = {
      mode: 'CONNECTED' as const,
      liveQuantities: new Map([['p', 5]]),
    };
    expect(decideOrderLine(source, 'p', 5, noLedger)).toEqual({
      kind: 'RESERVE_LIVE',
      liveQuantity: 5,
    });
  });

  it('conectada con 0 o con menos de lo pedido: sin stock', () => {
    const source = {
      mode: 'CONNECTED' as const,
      liveQuantities: new Map([
        ['cero', 0],
        ['poco', 1],
      ]),
    };
    expect(decideOrderLine(source, 'cero', 1, noLedger).kind).toBe(
      'OUT_OF_STOCK',
    );
    expect(decideOrderLine(source, 'poco', 2, noLedger).kind).toBe(
      'OUT_OF_STOCK',
    );
  });

  it('conectada sin vínculo para el producto: decide el libro', () => {
    const source = { mode: 'CONNECTED' as const, liveQuantities: new Map() };
    expect(decideOrderLine(source, 'p', 1, noLedger)).toEqual({
      kind: 'LEDGER',
    });
  });
});

describe('la clave nunca se muestra entera', () => {
  it.each(['a', 'ab', 'abc', 'abcd'])(
    'no publica una pista que revele una clave corta (%s)',
    (secret) => {
      expect(maskSecretHint(lastFour(secret))).toBeNull();
    },
  );

  it('solo los últimos 4 caracteres', () => {
    const secret = 'clave-muy-secreta-1234';
    const hint = maskSecretHint(lastFour(secret));
    expect(hint).toBe('••••1234');
    expect(hint).not.toContain('secreta');
    expect(maskSecretHint(null)).toBeNull();
  });
});
