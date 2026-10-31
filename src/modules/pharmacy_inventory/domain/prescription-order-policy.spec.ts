import {
  evaluatePrescriptionOrder,
  type PrescriptionOrderLine,
  type PrescriptionOrderPrescription,
} from './prescription-order-policy';

const X = 'concept-x';
const Y = 'concept-y';
const Z = 'concept-z';

/** Receta activa con X (saldo 2) e Y (sin control de cantidad). */
function rx(
  extra: Partial<PrescriptionOrderPrescription> = {},
): PrescriptionOrderPrescription {
  return {
    state: 'ACTIVE',
    drugs: [
      { medicationConceptId: X, remaining: 2 },
      { medicationConceptId: Y, remaining: null },
    ],
    ...extra,
  };
}

/** Una línea de producto con receta obligatoria. */
function line(
  productId: string,
  medicationConceptId: string | null,
  quantity = 1,
  requiresPrescription: boolean | null = true,
): PrescriptionOrderLine {
  return { productId, medicationConceptId, quantity, requiresPrescription };
}

describe('evaluatePrescriptionOrder', () => {
  it('pasa con productos de la receta dentro del saldo', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: rx(),
        lines: [line('prod-x', X, 2), line('prod-y', Y)],
      }),
    ).toBeNull();
  });

  it('receta no activa → PRESCRIPTION_NOT_ACTIVE', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: rx({ state: 'NOT_ACTIVE' }),
        lines: [line('prod-x', X)],
      }),
    ).toEqual({ reason: 'PRESCRIPTION_NOT_ACTIVE' });
  });

  it('receta vencida → PRESCRIPTION_EXPIRED', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: rx({ state: 'EXPIRED' }),
        lines: [line('prod-x', X)],
      }),
    ).toEqual({ reason: 'PRESCRIPTION_EXPIRED' });
  });

  it('producto con receta obligatoria de otro fármaco → PRODUCT_NOT_PRESCRIBED', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: rx(),
        lines: [line('prod-x', X), line('prod-z', Z)],
      }),
    ).toEqual({ reason: 'PRODUCT_NOT_PRESCRIBED', productIds: ['prod-z'] });
  });

  it('producto con receta obligatoria sin fármaco declarado → PRODUCT_NOT_PRESCRIBED', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: rx(),
        lines: [line('prod-sin-concepto', null)],
      }),
    ).toEqual({
      reason: 'PRODUCT_NOT_PRESCRIBED',
      productIds: ['prod-sin-concepto'],
    });
  });

  it('una línea de venta libre con receta pasa aunque no sea de la receta (D-4)', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: rx(),
        lines: [line('prod-y', Y), line('prod-otc', Z, 5, false)],
      }),
    ).toBeNull();
  });

  it('requires_prescription nulo cuenta como venta libre', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: rx(),
        lines: [line('prod-otc', Z, 9, null)],
      }),
    ).toBeNull();
    expect(
      evaluatePrescriptionOrder({
        prescription: null,
        lines: [line('prod-otc', Z, 9, null)],
      }),
    ).toBeNull();
  });

  it('lo pedido por encima del saldo → QUANTITY_EXCEEDS_PRESCRIPTION', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: rx(),
        lines: [line('prod-x', X, 3)],
      }),
    ).toEqual({
      reason: 'QUANTITY_EXCEEDS_PRESCRIPTION',
      productIds: ['prod-x'],
    });
  });

  it('dos líneas del mismo fármaco suman contra el saldo', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: rx(),
        lines: [line('prod-x1', X, 1), line('prod-x2', X, 2)],
      }),
    ).toEqual({
      reason: 'QUANTITY_EXCEEDS_PRESCRIPTION',
      productIds: ['prod-x1', 'prod-x2'],
    });
    expect(
      evaluatePrescriptionOrder({
        prescription: rx(),
        lines: [line('prod-x1', X, 1), line('prod-x2', X, 1)],
      }),
    ).toBeNull();
  });

  it('con decimales la comparación es exacta: dos líneas de 0.1 y 0.2 caben en 0.3', () => {
    const prescription = rx({
      drugs: [{ medicationConceptId: X, remaining: 0.3 }],
    });
    expect(
      evaluatePrescriptionOrder({
        prescription,
        lines: [line('prod-x1', X, 0.1), line('prod-x2', X, 0.2)],
      }),
    ).toBeNull();
    expect(
      evaluatePrescriptionOrder({
        prescription,
        lines: [line('prod-x1', X, 0.1), line('prod-x2', X, 0.21)],
      }),
    ).toEqual({
      reason: 'QUANTITY_EXCEEDS_PRESCRIPTION',
      productIds: ['prod-x1', 'prod-x2'],
    });
  });

  it('saldo en cero rechaza cualquier cantidad', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: rx({ drugs: [{ medicationConceptId: X, remaining: 0 }] }),
        lines: [line('prod-x', X, 1)],
      }),
    ).toEqual({
      reason: 'QUANTITY_EXCEEDS_PRESCRIPTION',
      productIds: ['prod-x'],
    });
  });

  it('saldo null no controla la cantidad (D-5)', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: rx(),
        lines: [line('prod-y', Y, 50)],
      }),
    ).toBeNull();
  });

  it('sin receta, un producto con receta obligatoria → PRESCRIPTION_REQUIRED', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: null,
        lines: [line('prod-otc', Z, 1, false), line('prod-x', X)],
      }),
    ).toEqual({ reason: 'PRESCRIPTION_REQUIRED', productIds: ['prod-x'] });
  });

  it('sin receta, solo venta libre → pasa', () => {
    expect(
      evaluatePrescriptionOrder({
        prescription: null,
        lines: [line('prod-otc', Z, 1, false)],
      }),
    ).toBeNull();
  });

  describe('el orden entre motivos', () => {
    const everything = [line('prod-z', Z), line('prod-x', X, 99)];

    it('NOT_ACTIVE antes que todo', () => {
      expect(
        evaluatePrescriptionOrder({
          prescription: rx({ state: 'NOT_ACTIVE' }),
          lines: everything,
        })?.reason,
      ).toBe('PRESCRIPTION_NOT_ACTIVE');
    });

    it('EXPIRED antes que producto y cantidad', () => {
      expect(
        evaluatePrescriptionOrder({
          prescription: rx({ state: 'EXPIRED' }),
          lines: everything,
        })?.reason,
      ).toBe('PRESCRIPTION_EXPIRED');
    });

    it('producto antes que cantidad', () => {
      expect(
        evaluatePrescriptionOrder({ prescription: rx(), lines: everything })
          ?.reason,
      ).toBe('PRODUCT_NOT_PRESCRIBED');
    });
  });

  describe('D-6: un fármaco ya pedido', () => {
    it('sin saldo y ya pedido → PRESCRIPTION_ITEM_ALREADY_ORDERED con sus líneas', () => {
      expect(
        evaluatePrescriptionOrder({
          prescription: rx({
            drugs: [
              { medicationConceptId: X, remaining: 2 },
              { medicationConceptId: Y, remaining: null, alreadyOrdered: true },
            ],
          }),
          lines: [line('prod-x', X), line('prod-y', Y), line('prod-y2', Y)],
        }),
      ).toEqual({
        reason: 'PRESCRIPTION_ITEM_ALREADY_ORDERED',
        productIds: ['prod-y', 'prod-y2'],
      });
    });

    it('con saldo manda el saldo aunque esté marcado como pedido', () => {
      expect(
        evaluatePrescriptionOrder({
          prescription: rx({
            drugs: [
              { medicationConceptId: X, remaining: 2, alreadyOrdered: true },
            ],
          }),
          lines: [line('prod-x', X, 2)],
        }),
      ).toBeNull();
    });

    it('otro fármaco de la receta ya pedido no bloquea este', () => {
      expect(
        evaluatePrescriptionOrder({
          prescription: rx({
            drugs: [
              { medicationConceptId: X, remaining: null, alreadyOrdered: true },
              { medicationConceptId: Y, remaining: null },
            ],
          }),
          lines: [line('prod-y', Y)],
        }),
      ).toBeNull();
    });

    it('un producto de venta libre no mira si la receta ya se pidió', () => {
      expect(
        evaluatePrescriptionOrder({
          prescription: rx({
            drugs: [
              { medicationConceptId: Y, remaining: null, alreadyOrdered: true },
            ],
          }),
          lines: [line('prod-y', Y, 1, false)],
        }),
      ).toBeNull();
    });
  });
});
