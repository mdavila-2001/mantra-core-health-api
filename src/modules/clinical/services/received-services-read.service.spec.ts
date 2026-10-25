import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common/constants/concepts';
import { CLIN } from '../clinical.concepts';
import { ReceivedServicesReadService } from './received-services-read.service';

/** Crea un mock tipado de forma laxa. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PATIENT = '11111111-1111-1111-1111-111111111111';
const em = { fork: mockFn(() => em) } as any;
const patient = { id: 'u-pac', roles: ['PATIENT'] } as any;
const clinician = { id: 'u-med', roles: ['CLINICIAN'] } as any;
const superadmin = { id: 'u-adm', roles: ['SUPERADMIN'] } as any;

function row(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'rs-1',
    patientProfileId: PATIENT,
    serviceTypeConceptId: CLIN.RECEIVED_SERVICE_INTERVENTION,
    serviceConceptId: 'code-1',
    statusConceptId: CLIN.PROCEDURE_COMPLETED,
    performedAt: new Date('2026-08-01T10:00:00.000Z'),
    performerProfileId: 'doc-1',
    practiceSiteId: 'site-1',
    resultText: 'Sin complicaciones',
    ...overrides,
  };
}

function build(rows: any[] = [row()]) {
  const repository = {
    findByPatient: mockFn().mockResolvedValue(rows),
    findInvoiceLineAmounts: mockFn().mockResolvedValue([]),
    findChargeLines: mockFn().mockResolvedValue([]),
    findPerformerNames: mockFn().mockResolvedValue(new Map()),
    findSiteNames: mockFn().mockResolvedValue(new Map()),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ReceivedServicesReadService(
    em,
    repository as any,
    logger as any,
  );
  return { service, repository };
}

describe('ReceivedServicesReadService', () => {
  it('pide uno más que el tope para saber si la lista quedó cortada', async () => {
    const d = build();
    await d.service.list(PATIENT, 50, patient);
    expect(d.repository.findByPatient).toHaveBeenCalledWith(em, PATIENT, 51);
  });

  it('dice que cortó la lista cuando hay más servicios que el tope', async () => {
    const d = build([row({ id: 'a' }), row({ id: 'b' }), row({ id: 'c' })]);
    const res = await d.service.list(PATIENT, 2, patient);
    expect(res.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(res.truncated).toBe(true);
    expect(res.limit).toBe(2);
  });

  it('no marca corte cuando la lista entra en el tope', async () => {
    const d = build([row({ id: 'a' }), row({ id: 'b' })]);
    const res = await d.service.list(PATIENT, 2, patient);
    expect(res.items).toHaveLength(2);
    expect(res.truncated).toBe(false);
  });

  it('distingue intervención, vacunación y un tipo que todavía no conoce', async () => {
    const d = build([
      row({
        id: 'a',
        serviceTypeConceptId: CLIN.RECEIVED_SERVICE_INTERVENTION,
      }),
      row({ id: 'b', serviceTypeConceptId: CLIN.RECEIVED_SERVICE_VACCINATION }),
      row({ id: 'c', serviceTypeConceptId: 'un-tipo-nuevo' }),
    ]);
    const res = await d.service.list(PATIENT, 50, patient);
    expect(res.items.map((item) => item.type)).toEqual([
      'INTERVENTION',
      'VACCINATION',
      'OTHER',
    ]);
    // El concepto viaja siempre, para que el cliente resuelva la etiqueta del tipo nuevo.
    expect(res.items[2].typeConceptId).toBe('un-tipo-nuevo');
  });

  describe('nombres ya resueltos', () => {
    it('devuelve el nombre del profesional y de la sede, porque el paciente no puede resolverlos', async () => {
      const d = build([row()]);
      d.repository.findPerformerNames.mockResolvedValue(
        new Map([['doc-1', 'Dra. Ana Rojas']]),
      );
      d.repository.findSiteNames.mockResolvedValue(
        new Map([['site-1', 'Clínica Central']]),
      );
      const res = await d.service.list(PATIENT, 50, patient);
      expect(res.items[0]).toMatchObject({
        performerName: 'Dra. Ana Rojas',
        practiceSiteName: 'Clínica Central',
      });
      expect(d.repository.findPerformerNames).toHaveBeenCalledWith(em, [
        'doc-1',
      ]);
      expect(d.repository.findSiteNames).toHaveBeenCalledWith(em, ['site-1']);
    });

    it('pide cada nombre una sola vez aunque se repita', async () => {
      const d = build([row({ id: 'a' }), row({ id: 'b' })]);
      await d.service.list(PATIENT, 50, patient);
      expect(d.repository.findPerformerNames).toHaveBeenCalledWith(em, [
        'doc-1',
      ]);
    });

    it('sin nombre registrado no inventa uno', async () => {
      const d = build([
        row({ performerProfileId: undefined, practiceSiteId: undefined }),
      ]);
      const res = await d.service.list(PATIENT, 50, patient);
      expect(res.items[0].performerName).toBeUndefined();
      expect(res.items[0].practiceSiteName).toBeUndefined();
    });
  });

  describe('quién ve el dinero', () => {
    it.each([
      ['el personal clínico', clinician],
      ['el superadministrador', superadmin],
    ])(
      '%s lee el servicio sin importes, y la respuesta lo dice',
      async (_name, actor) => {
        const d = build([row({ invoiceLineId: 'line-1' })]);
        d.repository.findInvoiceLineAmounts.mockResolvedValue([
          {
            invoiceLineId: 'line-1',
            lineTotal: '350.00',
            currencyConceptId: CONCEPTS.CURRENCY_BOB,
          },
        ]);
        const res = await d.service.list(PATIENT, 50, actor);
        expect(res.costsVisible).toBe(false);
        expect(res.items[0].cost).toBeNull();
        // Ni siquiera se consultan los importes.
        expect(d.repository.findInvoiceLineAmounts).not.toHaveBeenCalled();
        expect(d.repository.findChargeLines).not.toHaveBeenCalled();
      },
    );

    it('el titular ve el costo de la línea de factura enlazada', async () => {
      const d = build([row({ invoiceLineId: 'line-1' })]);
      d.repository.findInvoiceLineAmounts.mockResolvedValue([
        {
          invoiceLineId: 'line-1',
          lineTotal: '350.00',
          currencyConceptId: CONCEPTS.CURRENCY_BOB,
        },
      ]);
      const res = await d.service.list(PATIENT, 50, patient);
      expect(res.costsVisible).toBe(true);
      expect(res.items[0].cost).toEqual({
        amount: '350.00',
        currencyCode: 'BOB',
        source: 'INVOICE_LINE',
      });
    });
  });

  describe('costo desde los cargos del caso', () => {
    it('suma cantidad por precio de los cargos, sin pasar por coma flotante', async () => {
      const d = build([row({ procedureCaseId: 'case-1' })]);
      d.repository.findChargeLines.mockResolvedValue([
        {
          procedureCaseId: 'case-1',
          quantity: '2',
          unitPrice: '0.10',
          currencyCode: 'BOB',
        },
        {
          procedureCaseId: 'case-1',
          quantity: '1',
          unitPrice: '0.20',
          currencyCode: 'BOB',
        },
      ]);
      const res = await d.service.list(PATIENT, 50, patient);
      expect(res.items[0].cost).toEqual({
        amount: '0.40',
        currencyCode: 'BOB',
        source: 'CHARGE_ITEMS',
      });
    });

    it('enlaza los cargos por el procedimiento cuando la fila no tiene caso', async () => {
      const d = build([row({ sourceProcedureId: 'proc-1' })]);
      d.repository.findChargeLines.mockResolvedValue([
        {
          procedureCaseId: 'otro-caso',
          procedureId: 'proc-1',
          quantity: '1',
          unitPrice: '100',
          currencyCode: 'USD',
        },
      ]);
      const res = await d.service.list(PATIENT, 50, patient);
      expect(res.items[0].cost).toMatchObject({
        amount: '100.00',
        currencyCode: 'USD',
      });
    });

    it('no suma bolivianos con dólares: sin una moneda común no hay costo', async () => {
      const d = build([row({ procedureCaseId: 'case-1' })]);
      d.repository.findChargeLines.mockResolvedValue([
        {
          procedureCaseId: 'case-1',
          quantity: '1',
          unitPrice: '10',
          currencyCode: 'BOB',
        },
        {
          procedureCaseId: 'case-1',
          quantity: '1',
          unitPrice: '10',
          currencyCode: 'USD',
        },
      ]);
      const res = await d.service.list(PATIENT, 50, patient);
      expect(res.items[0].cost).toBeNull();
    });

    it('un cargo sin cantidad o sin precio no inventa un importe', async () => {
      const d = build([row({ procedureCaseId: 'case-1' })]);
      d.repository.findChargeLines.mockResolvedValue([
        { procedureCaseId: 'case-1', quantity: '1', currencyCode: 'BOB' },
      ]);
      const res = await d.service.list(PATIENT, 50, patient);
      expect(res.items[0].cost).toBeNull();
    });

    it('no toma los cargos de otro caso', async () => {
      const d = build([row({ procedureCaseId: 'case-1' })]);
      d.repository.findChargeLines.mockResolvedValue([
        {
          procedureCaseId: 'case-2',
          quantity: '1',
          unitPrice: '99',
          currencyCode: 'BOB',
        },
      ]);
      const res = await d.service.list(PATIENT, 50, patient);
      expect(res.items[0].cost).toBeNull();
    });

    it('una línea de factura sin total cae a los cargos del caso', async () => {
      const d = build([
        row({ invoiceLineId: 'line-1', procedureCaseId: 'case-1' }),
      ]);
      d.repository.findInvoiceLineAmounts.mockResolvedValue([
        {
          invoiceLineId: 'line-1',
          lineTotal: undefined,
          currencyConceptId: CONCEPTS.CURRENCY_BOB,
        },
      ]);
      d.repository.findChargeLines.mockResolvedValue([
        {
          procedureCaseId: 'case-1',
          quantity: '1',
          unitPrice: '50',
          currencyCode: 'BOB',
        },
      ]);
      const res = await d.service.list(PATIENT, 50, patient);
      expect(res.items[0].cost?.source).toBe('CHARGE_ITEMS');
    });

    it('sin ningún cobro registrado el costo es null, no cero', async () => {
      const d = build([row()]);
      const res = await d.service.list(PATIENT, 50, patient);
      expect(res.costsVisible).toBe(true);
      expect(res.items[0].cost).toBeNull();
    });
  });

  it('nunca expone cobertura del seguro: el reparto se publica por pedido y no por servicio', async () => {
    const d = build([row({ insuranceClaimLineId: 'claim-line-1' })]);
    const res = await d.service.list(PATIENT, 50, patient);
    expect(JSON.stringify(res)).not.toMatch(/coverage|insurance|claim/i);
  });
});
