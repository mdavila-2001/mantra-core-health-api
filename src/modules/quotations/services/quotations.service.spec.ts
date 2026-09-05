import { jest } from '@jest/globals';

/** Ejecuta la operación mock fn. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { QuotationsService } from './quotations.service';
import { simulatePaymentPlan } from './payment-plan-simulator';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = {
  id: 'user-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;

const actorSinPerfil = { id: 'user-2', roles: ['PRACTITIONER'] } as any;

const catalogItem = {
  id: 'svc-1',
  practiceId: 'pr1',
  code: 'CONS-01',
  name: 'Consulta general',
  defaultPrice: '100.00',
  isActive: true,
};

const baseDto = {
  practiceId: 'pr1',
  patientProfileId: 'pat-1',
  attentionDate: '2026-01-01',
  serviceCatalogId: 'svc-1',
  offeredPrice: '1000.00',
  paymentPlanInstallmentCount: 3,
  interestRatePercent: '2',
  interestCalculationMethod: 'FLAT' as const,
  validUntil: '2026-02-01',
};

/** Construye el sistema bajo prueba con dependencias controladas. */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    fork: mockFn().mockReturnValue({}),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const quotationsRepo = {
    findById: mockFn(),
    findByPatient: mockFn(),
    create: mockFn(),
  };
  const installmentsRepo = {
    findByQuotationId: mockFn(),
    createMany: mockFn(),
  };
  const serviceCatalogRepo = {
    findById: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new QuotationsService(
    em as any,
    quotationsRepo as any,
    installmentsRepo as any,
    serviceCatalogRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    em,
    quotationsRepo,
    installmentsRepo,
    serviceCatalogRepo,
  };
}

/** Fila de cotización persistida, con los campos que lee `toResponseDto`. */
function quotationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'q-1',
    practiceId: 'pr1',
    patientProfileId: 'pat-1',
    createdByPractitionerProfileId: 'hp-1',
    attentionDate: new Date('2026-01-01T00:00:00.000Z'),
    appointmentId: undefined,
    serviceCatalogId: 'svc-1',
    serviceNameSnapshot: 'Consulta general',
    offeredPrice: '1000.00',
    currencyConceptId: undefined,
    paymentPlanInstallmentCount: 3,
    interestRatePercent: '2',
    interestCalculationMethod: 'FLAT',
    validUntil: new Date('2026-02-01T00:00:00.000Z'),
    statusConceptId: 'state:active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** Suma los `principalAmount` de una tabla de cuotas, como número. */
function sumPrincipal(rows: ReturnType<typeof simulatePaymentPlan>): number {
  return rows.reduce((acc, r) => acc + Number(r.principalAmount), 0);
}

/** Suma capital + interés de toda la tabla, como número. */
function sumTotal(rows: ReturnType<typeof simulatePaymentPlan>): number {
  return rows.reduce((acc, r) => acc + Number(r.totalAmount), 0);
}

describe('payment-plan-simulator', () => {
  const attentionDate = new Date('2026-01-01T00:00:00.000Z');

  it('FLAT: la suma del capital de las cuotas iguala el precio ofrecido', () => {
    const rows = simulatePaymentPlan(
      '1000.00',
      3,
      '2.5',
      'FLAT',
      attentionDate,
    );
    expect(rows).toHaveLength(3);
    expect(sumPrincipal(rows)).toBeCloseTo(1000, 2);
  });

  it('FRENCH: la suma del capital de las cuotas iguala el precio ofrecido', () => {
    const rows = simulatePaymentPlan(
      '1000.00',
      6,
      '2.5',
      'FRENCH',
      attentionDate,
    );
    expect(rows).toHaveLength(6);
    expect(sumPrincipal(rows)).toBeCloseTo(1000, 2);
  });

  it('FRENCH con precios/plazos no exactos igual cierra el capital exacto', () => {
    const rows = simulatePaymentPlan(
      '1234.57',
      11,
      '1.75',
      'FRENCH',
      attentionDate,
    );
    expect(sumPrincipal(rows)).toBeCloseTo(1234.57, 2);
  });

  it('las cuotas vencen una por mes a partir de attentionDate', () => {
    const rows = simulatePaymentPlan('300.00', 3, '0', 'FLAT', attentionDate);
    expect(rows[0].dueDate.toISOString().slice(0, 10)).toBe('2026-02-01');
    expect(rows[1].dueDate.toISOString().slice(0, 10)).toBe('2026-03-01');
    expect(rows[2].dueDate.toISOString().slice(0, 10)).toBe('2026-04-01');
  });

  it('el total pagado en FLAT es mayor o igual que en FRENCH, misma tasa/plazo/capital', () => {
    const flat = simulatePaymentPlan('5000.00', 12, '3', 'FLAT', attentionDate);
    const french = simulatePaymentPlan(
      '5000.00',
      12,
      '3',
      'FRENCH',
      attentionDate,
    );
    expect(sumTotal(flat)).toBeGreaterThanOrEqual(sumTotal(french));
  });
});

describe('QuotationsService.createQuotation', () => {
  it('copia el nombre del catálogo como snapshot al crear la cotización', async () => {
    const d = build();
    d.serviceCatalogRepo.findById.mockResolvedValue(catalogItem);
    d.quotationsRepo.create.mockReturnValue(quotationRow());

    await d.service.createQuotation(baseDto, actor);

    expect(d.quotationsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        serviceNameSnapshot: 'Consulta general',
        createdByPractitionerProfileId: 'hp-1',
        actorUserId: 'user-1',
      }),
    );
  });

  it('el snapshot persistido no cambia si el catálogo cambia después (no es una referencia dinámica)', async () => {
    const d = build();
    // El catálogo se pisa luego de resolver el nombre: si el servicio guardara
    // una referencia al objeto en vez de copiar el string, este cambio se
    // filtraría al snapshot.
    const mutableCatalogItem = { ...catalogItem };
    d.serviceCatalogRepo.findById.mockResolvedValue(mutableCatalogItem);
    d.quotationsRepo.create.mockImplementation((..._args: any[]) => {
      mutableCatalogItem.name = 'Nombre cambiado después';
      return quotationRow();
    });

    await d.service.createQuotation(baseDto, actor);

    const callArgs = d.quotationsRepo.create.mock.calls[0][1];
    expect(callArgs.serviceNameSnapshot).toBe('Consulta general');
  });

  it('lanza PreconditionFailedException si validUntil no es posterior a attentionDate', async () => {
    const d = build();
    d.serviceCatalogRepo.findById.mockResolvedValue(catalogItem);

    await expect(
      d.service.createQuotation(
        { ...baseDto, validUntil: '2026-01-01' },
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.quotationsRepo.create).not.toHaveBeenCalled();
  });

  it('lanza PreconditionFailedException si el actor no tiene perfil profesional', async () => {
    const d = build();

    await expect(
      d.service.createQuotation(baseDto, actorSinPerfil),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.serviceCatalogRepo.findById).not.toHaveBeenCalled();
  });

  it('lanza ResourceNotFoundException si el servicio no existe en el catálogo', async () => {
    const d = build();
    d.serviceCatalogRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.createQuotation(baseDto, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.quotationsRepo.create).not.toHaveBeenCalled();
  });

  it('persiste las cuotas calculadas por el simulador, referenciando la cotización creada', async () => {
    const d = build();
    d.serviceCatalogRepo.findById.mockResolvedValue(catalogItem);
    d.quotationsRepo.create.mockReturnValue(quotationRow({ id: 'q-42' }));

    await d.service.createQuotation(baseDto, actor);

    expect(d.installmentsRepo.createMany).toHaveBeenCalledTimes(1);
    const [, installments] = d.installmentsRepo.createMany.mock.calls[0];
    expect(installments).toHaveLength(baseDto.paymentPlanInstallmentCount);
    expect(installments.every((i: any) => i.quotationId === 'q-42')).toBe(true);
  });
});

describe('QuotationsService.getQuotation', () => {
  it('lanza ResourceNotFoundException si no existe', async () => {
    const d = build();
    d.quotationsRepo.findById.mockResolvedValue(null);

    await expect(d.service.getQuotation('nope')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('devuelve la cotización con sus cuotas', async () => {
    const d = build();
    d.quotationsRepo.findById.mockResolvedValue(quotationRow());
    d.installmentsRepo.findByQuotationId.mockResolvedValue([
      {
        installmentNumber: 1,
        dueDate: new Date('2026-02-01T00:00:00.000Z'),
        principalAmount: '500.00',
        interestAmount: '10.00',
        totalAmount: '510.00',
      },
    ]);

    const res = await d.service.getQuotation('q-1');

    expect(res.id).toBe('q-1');
    expect(res.installments).toHaveLength(1);
    expect(res.installments[0]).toEqual({
      installmentNumber: 1,
      dueDate: '2026-02-01',
      principalAmount: '500.00',
      interestAmount: '10.00',
      totalAmount: '510.00',
    });
  });
});
