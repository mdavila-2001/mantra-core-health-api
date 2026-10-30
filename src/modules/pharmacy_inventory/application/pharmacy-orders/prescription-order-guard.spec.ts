import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../../common';
import { CLIN } from '../../../clinical/clinical.concepts';
import type { PrescriptionOrderItem } from '../../domain/prescription-order-policy';
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

function build() {
  const balances = {
    lockRequest: mockFn(async () => null),
    findActiveSiblings: mockFn(async () => []),
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
    balances.lockRequest.mockResolvedValue(item());

    await expect(
      guard.lockOwnRequest(em, 'rx-1', 'pat-1', NOW),
    ).resolves.toEqual(item());
    expect(balances.lockRequest).toHaveBeenCalledWith(em, 'rx-1', 'pat-1', NOW);
  });

  it('el 422 lleva el motivo en reason y en details.reason, con el mensaje', async () => {
    const { guard } = build();

    const error = await failureOf(
      guard.assertOrderRespectsPrescription(
        em,
        item({ state: 'NOT_ACTIVE' }),
        [product('prod-x', 'concept-x')],
        [{ productId: 'prod-x', quantity: 1 }],
        NOW,
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

  it('una receta que no está ACTIVE (vencida) no consulta hermanos ni saldo', async () => {
    const { balances, guard } = build();

    await failureOf(
      guard.assertOrderRespectsPrescription(
        em,
        item({ state: 'EXPIRED' }),
        [],
        [],
        NOW,
      ),
    );

    expect(balances.findActiveSiblings).not.toHaveBeenCalled();
    expect(balances.reservedByConcept).not.toHaveBeenCalled();
  });

  it('un hermano que no está ACTIVE no es parte de la receta', async () => {
    const { balances, guard } = build();
    balances.findActiveSiblings.mockResolvedValue([
      item({ id: 'rx-2', medicationConceptId: 'concept-y', state: 'EXPIRED' }),
    ]);

    const error = await failureOf(
      guard.assertOrderRespectsPrescription(
        em,
        item(),
        [product('prod-y', 'concept-y')],
        [{ productId: 'prod-y', quantity: 1 }],
        NOW,
      ),
    );

    expect(error.reason).toBe('PRODUCT_NOT_PRESCRIBED');
    expect(error.details.productIds).toEqual(['prod-y']);
  });

  it('una renovación del mismo fármaco suma lo recetado y descuenta entregado y reservado', async () => {
    const { balances, guard } = build();
    // 2 + 3 frascos recetados, 1 entregado y 2 reservados: quedan 2.
    balances.findActiveSiblings.mockResolvedValue([
      item({ id: 'rx-2', quantity: 3 }),
    ]);
    balances.dispensedByConcept.mockResolvedValue(new Map([['concept-x', 1]]));
    balances.reservedByConcept.mockResolvedValue(new Map([['concept-x', 2]]));
    const products = [product('prod-x', 'concept-x')];

    await expect(
      guard.assertOrderRespectsPrescription(
        em,
        item(),
        products,
        [{ productId: 'prod-x', quantity: 2 }],
        NOW,
      ),
    ).resolves.toBeUndefined();
    const error = await failureOf(
      guard.assertOrderRespectsPrescription(
        em,
        item(),
        products,
        [{ productId: 'prod-x', quantity: 3 }],
        NOW,
      ),
    );

    expect(error.reason).toBe('QUANTITY_EXCEEDS_PRESCRIPTION');
    expect(balances.findActiveSiblings).toHaveBeenCalledWith(em, item(), NOW);
    expect(balances.reservedByConcept).toHaveBeenCalledWith(
      em,
      ['rx-1', 'rx-2'],
      ['concept-x'],
    );
  });

  it('unidades distintas del mismo fármaco no se comparan', async () => {
    const { balances, guard } = build();
    balances.findActiveSiblings.mockResolvedValue([
      item({ id: 'rx-2', unitConceptId: CLIN.MEDICATION_UNIT_TUBE }),
    ]);

    await expect(
      guard.assertOrderRespectsPrescription(
        em,
        item(),
        [product('prod-x', 'concept-x')],
        [{ productId: 'prod-x', quantity: 40 }],
        NOW,
      ),
    ).resolves.toBeUndefined();
    expect(balances.reservedByConcept).toHaveBeenCalledWith(
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
        item({ quantity: null }),
        [product('prod-x', 'concept-x')],
        [{ productId: 'prod-x', quantity: 40 }],
        NOW,
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
        NOW,
      ),
    );

    expect(error.reason).toBe('PRESCRIPTION_REQUIRED');
    expect(error.details).toEqual({
      reason: 'PRESCRIPTION_REQUIRED',
      medicationRequestId: null,
      productIds: ['prod-x'],
    });
    expect(balances.findActiveSiblings).not.toHaveBeenCalled();
  });

  it('los cinco mensajes son los textos acordados para el paciente', () => {
    expect(PRESCRIPTION_ORDER_MESSAGES).toEqual({
      PRESCRIPTION_NOT_ACTIVE:
        'Esta receta ya no se puede usar: fue anulada, reemplazada o ya se entregó.',
      PRESCRIPTION_EXPIRED: 'Esta receta venció. Pida a su médico una nueva.',
      PRODUCT_NOT_PRESCRIBED:
        'Uno de los productos no es el medicamento de su receta. Quítelo del pedido para continuar.',
      QUANTITY_EXCEEDS_PRESCRIPTION:
        'Está pidiendo más de lo que le queda en su receta.',
      PRESCRIPTION_REQUIRED:
        'Uno de los productos se vende solo con receta. Elíjalo desde «Mis recetas».',
    });
  });
});
