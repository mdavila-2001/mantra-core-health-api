import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { PreconditionFailedException } from '../../../common';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { BILL, BILLING_CONCEPT_SEEDS } from '../billing.concepts';
import type { PatientSpendingRow } from '../repositories/patient-spending.repository';
import {
  assertRange,
  categoryOf,
  PatientSpendingService,
  SPENDING_CATEGORY,
  toMovement,
} from './patient-spending.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PATIENT = {
  id: 'user-1',
  roles: ['PATIENT'],
  patientProfileId: 'pat-1',
} as any;

/** Una factura sintética, con los vínculos apagados salvo lo que se pida. */
function row(extra: Partial<PatientSpendingRow> = {}): PatientSpendingRow {
  return {
    id: 'inv-1',
    occurredAt: new Date('2026-10-20T14:05:00.000Z'),
    invoiceNumber: 'INV-1',
    isCreditNote: false,
    hasEncounter: false,
    hasProcedure: false,
    hasPharmacy: false,
    hasImaging: false,
    hasLaboratory: false,
    firstDescription: null,
    providerName: 'Consultorio sintético',
    grossAmount: '300.00',
    coveredAmount: '150.00',
    discountAmount: '0.00',
    paidAmount: '150.00',
    ...extra,
  };
}

function build(rows: PatientSpendingRow[] = []) {
  const em = {};
  const repo = { findForPatient: mockFn().mockResolvedValue(rows) };
  const service = new PatientSpendingService(em as any, repo as any);
  return { service, repo, em };
}

const RANGE = { from: '2025-01-01', to: '2026-10-26' };

describe('PatientSpendingService.listMine (GET /patient-spending/me)', () => {
  it('sin perfil de paciente responde la precondición, sin leer nada', async () => {
    const d = build();
    await expect(
      d.service.listMine({ id: 'u', roles: ['PATIENT'] } as any, RANGE),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.repo.findForPatient).not.toHaveBeenCalled();
  });

  it('filtra por el perfil del token y nunca por otro (BOLA)', async () => {
    const d = build();
    await d.service.listMine(PATIENT, RANGE);
    const [em, filter] = d.repo.findForPatient.mock.calls[0];
    expect(em).toBe(d.em);
    expect(filter).toEqual({
      patientProfileId: 'pat-1',
      from: '2025-01-01',
      to: '2026-10-26',
      currencyCode: 'BOB',
      excludedStatusIds: [BILL.INVOICE_DRAFT],
      paymentPlanStatusId: BILL.INVOICE_PAYMENT_PLAN,
      creditNoteStatusId: BILL.INVOICE_CREDIT_NOTE,
      laboratoryModalityId: DUNIT.MODALITY_LABORATORY,
      limit: 1001,
    });
  });

  it('responde la forma del contrato, en BOB y con el rango pedido', async () => {
    const d = build([row()]);
    const response = await d.service.listMine(PATIENT, RANGE);
    expect(response).toEqual({
      currency: 'BOB',
      from: '2025-01-01',
      to: '2026-10-26',
      truncated: false,
      items: [
        {
          id: 'inv-1',
          occurredAt: '2026-10-20T14:05:00.000Z',
          description: 'Gasto de salud',
          category: { code: 'SPEND_OTHER', display: 'Other health expenses' },
          providerName: 'Consultorio sintético',
          grossAmount: '300.00',
          coveredAmount: '150.00',
          discountAmount: '0.00',
          paidAmount: '150.00',
        },
      ],
    });
  });

  it('límite: pide una fila de más y marca `truncated` si llegó', async () => {
    const d = build([row({ id: 'a' }), row({ id: 'b' }), row({ id: 'c' })]);
    const response = await d.service.listMine(PATIENT, { ...RANGE, limit: 2 });
    expect(d.repo.findForPatient.mock.calls[0][1].limit).toBe(3);
    expect(response.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(response.truncated).toBe(true);
  });

  it('límite: exactamente `limit` filas no es recorte', async () => {
    const d = build([row({ id: 'a' }), row({ id: 'b' })]);
    const response = await d.service.listMine(PATIENT, { ...RANGE, limit: 2 });
    expect(response.truncated).toBe(false);
  });

  it('un rango inválido es 400 antes de leer', async () => {
    const d = build();
    await expect(
      d.service.listMine(PATIENT, { from: '2026-10-26', to: '2026-01-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(d.repo.findForPatient).not.toHaveBeenCalled();
  });
});

describe('assertRange', () => {
  const reasonOf = (fn: () => void): unknown => {
    try {
      fn();
    } catch (error) {
      return ((error as BadRequestException).getResponse() as any).reason;
    }
    return undefined;
  };

  it('correcto: un día y tres años enteros se aceptan', () => {
    expect(() => assertRange('2026-10-26', '2026-10-26')).not.toThrow();
    expect(() => assertRange('2023-10-26', '2026-10-26')).not.toThrow();
  });

  it('límite: 3·366 días se aceptan, uno más no', () => {
    // 2023-01-01 + 1098 días = 2026-01-03.
    expect(() => assertRange('2023-01-01', '2026-01-03')).not.toThrow();
    expect(reasonOf(() => assertRange('2023-01-01', '2026-01-04'))).toBe(
      'PATIENT_SPENDING_RANGE_TOO_LONG',
    );
  });

  it('inválido: invertido, o un día que no existe', () => {
    expect(reasonOf(() => assertRange('2026-10-27', '2026-10-26'))).toBe(
      'PATIENT_SPENDING_RANGE_INVERTED',
    );
    expect(() => assertRange('2026-02-30', '2026-03-01')).toThrow(
      BadRequestException,
    );
    expect(() => assertRange('2026-01-01', '2026-13-01')).toThrow(
      BadRequestException,
    );
  });
});

describe('categoryOf', () => {
  it('va del vínculo más específico al más general', () => {
    const all = {
      hasProcedure: true,
      hasPharmacy: true,
      hasImaging: true,
      hasLaboratory: true,
      hasEncounter: true,
    };
    expect(categoryOf(row(all)).code).toBe('SPEND_PROCEDURE');
    expect(categoryOf(row({ ...all, hasProcedure: false })).code).toBe(
      'SPEND_PHARMACY',
    );
    expect(
      categoryOf(row({ ...all, hasProcedure: false, hasPharmacy: false })).code,
    ).toBe('SPEND_IMAGING');
    expect(
      categoryOf(row({ hasLaboratory: true, hasEncounter: true })).code,
    ).toBe('SPEND_LABORATORY');
    expect(categoryOf(row({ hasEncounter: true })).code).toBe(
      'SPEND_CONSULTATION',
    );
    expect(categoryOf(row()).code).toBe('SPEND_OTHER');
  });

  it('cada categoría es un concepto sembrado del módulo', () => {
    const seeded = new Map(
      BILLING_CONCEPT_SEEDS.map((seed) => [seed.code, seed.display]),
    );
    for (const concept of Object.values(SPENDING_CATEGORY)) {
      expect(seeded.get(concept.code)).toBe(concept.display);
    }
    expect(seeded.has('SPEND_INSURANCE_PREMIUM')).toBe(true);
  });
});

describe('toMovement', () => {
  it('usa la descripción de la línea si la hay', () => {
    expect(
      toMovement(row({ firstDescription: ' Consulta de control ' }))
        .description,
    ).toBe('Consulta de control');
  });

  it('una nota de crédito se nombra como tal y conserva su signo', () => {
    const movement = toMovement(
      row({
        isCreditNote: true,
        hasEncounter: true,
        grossAmount: '-50.00',
        coveredAmount: '0.00',
        paidAmount: '-50.00',
      }),
    );
    expect(movement.description).toBe('Nota de crédito: Consulta');
    expect(movement.paidAmount).toBe('-50.00');
  });

  it('acepta el instante como texto (driver) y lo devuelve ISO', () => {
    expect(
      toMovement(row({ occurredAt: '2026-10-20 10:05:00-04' })).occurredAt,
    ).toBe('2026-10-20T14:05:00.000Z');
  });
});
