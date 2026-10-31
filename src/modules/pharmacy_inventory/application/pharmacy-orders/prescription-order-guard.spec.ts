import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../../common';
import { CLIN } from '../../../clinical/clinical.concepts';
import type {
  LockedPrescription,
  PrescriptionOrderItem,
} from '../../domain/prescription-order-policy';
import {
  PRESCRIPTION_ORDER_MESSAGES,
  PrescriptionOrderGuard,
} from './prescription-order-guard';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const NOW = new Date('2026-10-30T12:00:00Z');
const em = {} as any;

/**
 * Un ítem vigente de la receta, ya traducido por el repositorio: 2 frascos del
 * fármaco X, encuentro A. El cálculo del estado se prueba en el repositorio.
 */
function item(
  extra: Partial<PrescriptionOrderItem> = {},
): PrescriptionOrderItem {
  return {
    id: 'rx-1',
    patientProfileId: 'pat-1',
    encounterId: 'enc-a',
    medicationConceptId: 'concept-x',
    state: 'ACTIVE',
    quantity: 2,
    unitConceptId: CLIN.MEDICATION_UNIT_BOTTLE,
    ...extra,
  };
}

/** Un producto de receta obligatoria del fármaco dado. */
function product(id: string, medicationConceptId?: string) {
  return {
    id,
    pharmacyId: 'ph-1',
    productCode: id,
    medicationConceptId,
    requiresPrescription: true,
  };
}

/** La receta tal como la deja el lock: la referida y sus hermanos bloqueados. */
function locked(
  referred: PrescriptionOrderItem = item(),
  siblings: PrescriptionOrderItem[] = [],
): LockedPrescription {
  return { item: referred, siblings };
}

function build() {
  // El repositorio doblado: solo bloquea y lee el saldo. No hay otra lectura de
  // la receta: si el guard la intentara, el doble no la tiene.
  const balances = {
    lockRequest: mockFn(async () => null),
    balanceByConcept: mockFn(async () => ({
      dispensed: new Map(),
      reserved: new Map(),
    })),
    orderedCountByConcept: mockFn(async () => new Map()),
    dispensedByConcept: mockFn(async () => new Map()),
    reservedByConcept: mockFn(async () => new Map()),
  };
  return { balances, guard: new PrescriptionOrderGuard(balances as any) };
}

/** El error de la promesa, para mirar su cuerpo HTTP. */
async function failureOf(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('se esperaba un rechazo');
}

describe('PrescriptionOrderGuard', () => {
  it('lockOwnRequest delega en el repositorio con el paciente y el instante', async () => {
    const { balances, guard } = build();
    balances.lockRequest.mockResolvedValue(locked());

    await expect(
      guard.lockOwnRequest(em, 'rx-1', 'pat-1', NOW),
    ).resolves.toEqual(locked());
    expect(balances.lockRequest).toHaveBeenCalledWith(em, 'rx-1', 'pat-1', NOW);
  });

  it('el 422 lleva el motivo en reason y en details.reason, con el mensaje', async () => {
    const { guard } = build();

    const error = await failureOf(
      guard.assertOrderRespectsPrescription(
        em,
        locked(item({ state: 'NOT_ACTIVE' })),
        [product('prod-x', 'concept-x')],
        [{ productId: 'prod-x', quantity: 1 }],
      ),
    );

    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(error.reason).toBe('PRESCRIPTION_NOT_ACTIVE');
    expect(error.details).toEqual({
      reason: 'PRESCRIPTION_NOT_ACTIVE',
      medicationRequestId: 'rx-1',
    });
    expect(error.message).toBe(
      PRESCRIPTION_ORDER_MESSAGES.PRESCRIPTION_NOT_ACTIVE,
    );
  });

  it('una receta que no está ACTIVE (vencida) no consulta el saldo', async () => {
    const { balances, guard } = build();

    await failureOf(
      guard.assertOrderRespectsPrescription(
        em,
        locked(item({ state: 'EXPIRED' })),
        [],
        [],
      ),
    );

    expect(balances.balanceByConcept).not.toHaveBeenCalled();
  });

  it('los hermanos son los que quedaron bloqueados: sin otra lectura de la receta', async () => {
    const { balances, guard } = build();

    await expect(
      guard.assertOrderRespectsPrescription(
        em,
        locked(item(), [
          item({
            id: 'rx-2',
            medicationConceptId: 'concept-y',
            quantity: null,
          }),
        ]),
        [product('prod-y', 'concept-y')],
        [{ productId: 'prod-y', quantity: 1 }],
      ),
    ).resolves.toBeUndefined();

    // Solo el saldo, una vez y sobre la referida y el hermano bloqueado.
    expect(balances.lockRequest).not.toHaveBeenCalled();
    expect(balances.balanceByConcept).toHaveBeenCalledTimes(1);
    expect(balances.balanceByConcept).toHaveBeenCalledWith(
      em,
      ['rx-1', 'rx-2'],
      ['concept-x'],
    );
  });

  it('un hermano que no está ACTIVE no es parte de la receta', async () => {
    const { guard } = build();

    const error = await failureOf(
      guard.assertOrderRespectsPrescription(
        em,
        locked(item(), [
          item({
            id: 'rx-2',
            medicationConceptId: 'concept-y',
            state: 'EXPIRED',
          }),
        ]),
        [product('prod-y', 'concept-y')],
        [{ productId: 'prod-y', quantity: 1 }],
      ),
    );

    expect(error.reason).toBe('PRODUCT_NOT_PRESCRIBED');
    expect(error.details.productIds).toEqual(['prod-y']);
  });

  it('entregado y reservado salen de una sola lectura (la misma foto)', async () => {
    const { balances, guard } = build();
    balances.balanceByConcept.mockResolvedValue({
      dispensed: new Map([['concept-x', 1]]),
      reserved: new Map([['concept-x', 1]]),
    });

    const error = await failureOf(
      guard.assertOrderRespectsPrescription(
        em,
        locked(),
        [product('prod-x', 'concept-x')],
        [{ productId: 'prod-x', quantity: 1 }],
      ),
    );

    // 2 recetados − 1 entregado − 1 reservado = 0.
    expect(error.reason).toBe('QUANTITY_EXCEEDS_PRESCRIPTION');
    expect(balances.balanceByConcept).toHaveBeenCalledTimes(1);
    expect(balances.dispensedByConcept).not.toHaveBeenCalled();
    expect(balances.reservedByConcept).not.toHaveBeenCalled();
  });

  it('una renovación del mismo fármaco suma lo recetado y descuenta entregado y reservado', async () => {
    const { balances, guard } = build();
    // 2 + 3 frascos recetados, 1 entregado y 2 reservados: quedan 2.
    balances.balanceByConcept.mockResolvedValue({
      dispensed: new Map([['concept-x', 1]]),
      reserved: new Map([['concept-x', 2]]),
    });
    const prescription = locked(item(), [item({ id: 'rx-2', quantity: 3 })]);
    const products = [product('prod-x', 'concept-x')];

    await expect(
      guard.assertOrderRespectsPrescription(em, prescription, products, [
        { productId: 'prod-x', quantity: 2 },
      ]),
    ).resolves.toBeUndefined();
    const error = await failureOf(
      guard.assertOrderRespectsPrescription(em, prescription, products, [
        { productId: 'prod-x', quantity: 3 },
      ]),
    );

    expect(error.reason).toBe('QUANTITY_EXCEEDS_PRESCRIPTION');
    expect(balances.balanceByConcept).toHaveBeenCalledWith(
      em,
      ['rx-1', 'rx-2'],
      ['concept-x'],
    );
  });

  it('con decimales el saldo es exacto: recetado 0.3, entregado 0.1, pedido 0.2 → pasa', async () => {
    const { balances, guard } = build();
    balances.balanceByConcept.mockResolvedValue({
      dispensed: new Map([['concept-x', 0.1]]),
      reserved: new Map(),
    });
    const prescription = locked(item({ quantity: 0.3 }));
    const products = [product('prod-x', 'concept-x')];

    await expect(
      guard.assertOrderRespectsPrescription(em, prescription, products, [
        { productId: 'prod-x', quantity: 0.2 },
      ]),
    ).resolves.toBeUndefined();
    const error = await failureOf(
      guard.assertOrderRespectsPrescription(em, prescription, products, [
        { productId: 'prod-x', quantity: 0.21 },
      ]),
    );
    expect(error.reason).toBe('QUANTITY_EXCEEDS_PRESCRIPTION');
  });

  it('con decimales lo recetado de dos ítems se suma exacto: 0.1 + 0.2 alcanza para 0.3', async () => {
    const { guard } = build();

    await expect(
      guard.assertOrderRespectsPrescription(
        em,
        locked(item({ quantity: 0.1 }), [item({ id: 'rx-2', quantity: 0.2 })]),
        [product('prod-x', 'concept-x')],
        [{ productId: 'prod-x', quantity: 0.3 }],
      ),
    ).resolves.toBeUndefined();
  });

  it('unidades distintas del mismo fármaco no se comparan', async () => {
    const { balances, guard } = build();

    await expect(
      guard.assertOrderRespectsPrescription(
        em,
        locked(item(), [
          item({ id: 'rx-2', unitConceptId: CLIN.MEDICATION_UNIT_TUBE }),
        ]),
        [product('prod-x', 'concept-x')],
        [{ productId: 'prod-x', quantity: 40 }],
      ),
    ).resolves.toBeUndefined();
    expect(balances.balanceByConcept).toHaveBeenCalledWith(
      em,
      ['rx-1', 'rx-2'],
      [],
    );
  });

  it('una receta sin cantidad no controla la cantidad', async () => {
    const { guard } = build();

    await expect(
      guard.assertOrderRespectsPrescription(
        em,
        locked(item({ quantity: null })),
        [product('prod-x', 'concept-x')],
        [{ productId: 'prod-x', quantity: 40 }],
      ),
    ).resolves.toBeUndefined();
  });

  it('sin receta, un producto de receta obligatoria: medicationRequestId nulo y los productos', async () => {
    const { balances, guard } = build();

    const error = await failureOf(
      guard.assertOrderRespectsPrescription(
        em,
        null,
        [product('prod-x', 'concept-x')],
        [{ productId: 'prod-x', quantity: 1 }],
      ),
    );

    expect(error.reason).toBe('PRESCRIPTION_REQUIRED');
    expect(error.details).toEqual({
      reason: 'PRESCRIPTION_REQUIRED',
      medicationRequestId: null,
      productIds: ['prod-x'],
    });
    expect(balances.balanceByConcept).not.toHaveBeenCalled();
  });

  it('los seis mensajes son los textos acordados para el paciente', () => {
    expect(PRESCRIPTION_ORDER_MESSAGES).toEqual({
      PRESCRIPTION_NOT_ACTIVE:
        'Esta receta ya no se puede usar: fue anulada, reemplazada o ya se entregó.',
      PRESCRIPTION_EXPIRED: 'Esta receta venció. Pida a su médico una nueva.',
      PRODUCT_NOT_PRESCRIBED:
        'Uno de los productos no es el medicamento de su receta. Quítelo del pedido para continuar.',
      QUANTITY_EXCEEDS_PRESCRIPTION:
        'Está pidiendo más de lo que le queda en su receta.',
      PRESCRIPTION_ITEM_ALREADY_ORDERED:
        'Este medicamento de su receta ya tiene un pedido en curso o ya se entregó. Si necesita más, pida a su médico una receta nueva.',
      PRESCRIPTION_REQUIRED:
        'Uno de los productos se vende solo con receta. Elíjalo desde «Mis recetas».',
    });
  });

  describe('D-6: la receta no se vuelve a pedir sin saldo', () => {
    /** Un ítem en comprimidos: no hay saldo comparable. */
    const tablets = (extra: Partial<PrescriptionOrderItem> = {}) =>
      item({ quantity: 21, unitConceptId: 'unit-tablet', ...extra });

    it('un ítem ya pedido o entregado → 422 PRESCRIPTION_ITEM_ALREADY_ORDERED, sin tocar la receta', async () => {
      const { balances, guard } = build();
      balances.orderedCountByConcept.mockResolvedValue(
        new Map([['concept-x', 1]]),
      );

      const error = await failureOf(
        guard.assertOrderRespectsPrescription(
          em,
          locked(tablets()),
          [product('prod-x', 'concept-x')],
          [{ productId: 'prod-x', quantity: 1 }],
        ),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.reason).toBe('PRESCRIPTION_ITEM_ALREADY_ORDERED');
      expect(error.details).toEqual({
        reason: 'PRESCRIPTION_ITEM_ALREADY_ORDERED',
        medicationRequestId: 'rx-1',
        productIds: ['prod-x'],
      });
      expect(error.message).toBe(
        PRESCRIPTION_ORDER_MESSAGES.PRESCRIPTION_ITEM_ALREADY_ORDERED,
      );
      expect(balances.orderedCountByConcept).toHaveBeenCalledWith(
        em,
        ['rx-1'],
        ['concept-x'],
      );
    });

    it('sin pedidos vivos ni entregas (cancelado o rechazado no cuenta) → pasa', async () => {
      const { guard } = build();

      await expect(
        guard.assertOrderRespectsPrescription(
          em,
          locked(tablets()),
          [product('prod-x', 'concept-x')],
          [{ productId: 'prod-x', quantity: 1 }],
        ),
      ).resolves.toBeUndefined();
    });

    it('una receta de dos ítems: pedir uno deja disponible el otro', async () => {
      const { balances, guard } = build();
      // Ya se pidió X; Y nunca.
      balances.orderedCountByConcept.mockResolvedValue(
        new Map([['concept-x', 1]]),
      );
      const prescription = locked(tablets(), [
        tablets({ id: 'rx-2', medicationConceptId: 'concept-y' }),
      ]);
      const products = [
        product('prod-x', 'concept-x'),
        product('prod-y', 'concept-y'),
      ];

      await expect(
        guard.assertOrderRespectsPrescription(em, prescription, products, [
          { productId: 'prod-y', quantity: 1 },
        ]),
      ).resolves.toBeUndefined();
      const error = await failureOf(
        guard.assertOrderRespectsPrescription(em, prescription, products, [
          { productId: 'prod-x', quantity: 1 },
        ]),
      );
      expect(error.reason).toBe('PRESCRIPTION_ITEM_ALREADY_ORDERED');
      expect(error.details.productIds).toEqual(['prod-x']);
    });

    it('una renovación del mismo fármaco deja pedir una vez más, no dos', async () => {
      const { balances, guard } = build();
      const prescription = locked(tablets(), [tablets({ id: 'rx-2' })]);
      const products = [product('prod-x', 'concept-x')];
      const lines = [{ productId: 'prod-x', quantity: 1 }];

      balances.orderedCountByConcept.mockResolvedValue(
        new Map([['concept-x', 1]]),
      );
      await expect(
        guard.assertOrderRespectsPrescription(
          em,
          prescription,
          products,
          lines,
        ),
      ).resolves.toBeUndefined();

      balances.orderedCountByConcept.mockResolvedValue(
        new Map([['concept-x', 2]]),
      );
      const error = await failureOf(
        guard.assertOrderRespectsPrescription(
          em,
          prescription,
          products,
          lines,
        ),
      );
      expect(error.reason).toBe('PRESCRIPTION_ITEM_ALREADY_ORDERED');
    });

    it('con saldo por envase manda el saldo: un pedido previo no bloquea lo que queda', async () => {
      const { balances, guard } = build();
      // 2 frascos recetados, 1 entregado: queda 1.
      balances.balanceByConcept.mockResolvedValue({
        dispensed: new Map([['concept-x', 1]]),
        reserved: new Map(),
      });
      balances.orderedCountByConcept.mockResolvedValue(
        new Map([['concept-x', 1]]),
      );

      await expect(
        guard.assertOrderRespectsPrescription(
          em,
          locked(),
          [product('prod-x', 'concept-x')],
          [{ productId: 'prod-x', quantity: 1 }],
        ),
      ).resolves.toBeUndefined();
      expect(balances.orderedCountByConcept).not.toHaveBeenCalled();
    });
  });

  describe('un reemplazo no reinicia el saldo', () => {
    it('lo entregado y lo pedido sobre el original reemplazado cuentan contra el reemplazo', async () => {
      const { balances, guard } = build();
      // El original rx-0 ya entregó 2 frascos: el reemplazo rx-1 (2 frascos)
      // no tiene saldo.
      balances.balanceByConcept.mockResolvedValue({
        dispensed: new Map([['concept-x', 2]]),
        reserved: new Map(),
      });

      const error = await failureOf(
        guard.assertOrderRespectsPrescription(
          em,
          { item: item(), siblings: [], replacedIds: ['rx-0'] },
          [product('prod-x', 'concept-x')],
          [{ productId: 'prod-x', quantity: 1 }],
        ),
      );

      expect(error.reason).toBe('QUANTITY_EXCEEDS_PRESCRIPTION');
      expect(balances.balanceByConcept).toHaveBeenCalledWith(
        em,
        ['rx-1', 'rx-0'],
        ['concept-x'],
      );
    });

    it('sin saldo, un pedido sobre el original reemplazado consume el reemplazo', async () => {
      const { balances, guard } = build();
      balances.orderedCountByConcept.mockResolvedValue(
        new Map([['concept-x', 1]]),
      );

      const error = await failureOf(
        guard.assertOrderRespectsPrescription(
          em,
          {
            item: item({ quantity: null }),
            siblings: [],
            replacedIds: ['rx-0'],
          },
          [product('prod-x', 'concept-x')],
          [{ productId: 'prod-x', quantity: 1 }],
        ),
      );

      expect(error.reason).toBe('PRESCRIPTION_ITEM_ALREADY_ORDERED');
      expect(balances.orderedCountByConcept).toHaveBeenCalledWith(
        em,
        ['rx-1', 'rx-0'],
        ['concept-x'],
      );
    });
  });
});
