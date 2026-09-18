import { jest } from '@jest/globals';

/** Ejecuta la operación mock fn. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { QuotationsService } from './quotations.service';
import { assertPaymentPlanClosesOnPrice, toCents } from './payment-plan';
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
  downPaymentAmount: '100.00',
  paymentFrequency: 'MONTHLY' as const,
  // Flexible: montos distintos y fechas que no siguen la frecuencia.
  installments: [
    { installmentNumber: 1, dueDate: '2026-02-01', amount: '300.00' },
    { installmentNumber: 2, dueDate: '2026-03-15', amount: '300.00' },
    { installmentNumber: 3, dueDate: '2026-12-20', amount: '300.00' },
  ],
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
    // Devuelve lo que recibe, como `em.create`: el servicio responde con eso.
    createMany: mockFn((_em: unknown, rows: unknown) => rows),
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
    downPaymentAmount: '100.00',
    paymentFrequency: 'MONTHLY',
    validUntil: new Date('2026-02-01T00:00:00.000Z'),
    statusConceptId: 'state:active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('payment-plan (sin interés)', () => {
  const plan = {
    offeredPrice: baseDto.offeredPrice,
    downPaymentAmount: baseDto.downPaymentAmount,
    paymentPlanInstallmentCount: baseDto.paymentPlanInstallmentCount,
    installments: baseDto.installments,
  };

  it('cuenta en centavos enteros', () => {
    expect(toCents('233.34')).toBe(23334);
    expect(toCents('100')).toBe(10000);
    expect(toCents('0.5')).toBe(50);
  });

  it('acepta un plan cuyo anticipo + cuotas da el precio, aunque las cuotas sean desparejas', () => {
    expect(() =>
      assertPaymentPlanClosesOnPrice({
        ...plan,
        installments: [
          { installmentNumber: 1, dueDate: '2026-02-01', amount: '850.00' },
          { installmentNumber: 2, dueDate: '2026-03-01', amount: '25.33' },
          { installmentNumber: 3, dueDate: '2026-04-01', amount: '24.67' },
        ],
      }),
    ).not.toThrow();
  });

  it('suma exacto donde la coma flotante fallaría (0.1 + 0.2)', () => {
    expect(() =>
      assertPaymentPlanClosesOnPrice({
        offeredPrice: '0.30',
        downPaymentAmount: '0.10',
        paymentPlanInstallmentCount: 1,
        installments: [
          { installmentNumber: 1, dueDate: '2026-02-01', amount: '0.20' },
        ],
      }),
    ).not.toThrow();
  });

  it('pagado todo de anticipo, sin cuotas, es válido', () => {
    expect(() =>
      assertPaymentPlanClosesOnPrice({
        offeredPrice: '1000.00',
        downPaymentAmount: '1000.00',
        paymentPlanInstallmentCount: 0,
        installments: [],
      }),
    ).not.toThrow();
  });

  it.each([
    [
      'falta un centavo',
      {
        installments: [
          ...plan.installments.slice(0, 2),
          { installmentNumber: 3, dueDate: '2026-04-01', amount: '299.99' },
        ],
      },
    ],
    ['sobra plata', { downPaymentAmount: '100.01' }],
    [
      'el anticipo pasa el precio',
      {
        downPaymentAmount: '1000.01',
        installments: [],
        paymentPlanInstallmentCount: 0,
      },
    ],
    ['la cantidad no coincide', { paymentPlanInstallmentCount: 4 }],
    [
      'numeración fuera de orden',
      {
        installments: [
          plan.installments[1]!,
          plan.installments[0]!,
          plan.installments[2]!,
        ],
      },
    ],
    [
      'una cuota en cero',
      {
        downPaymentAmount: '400.00',
        installments: [
          ...plan.installments.slice(0, 2),
          { installmentNumber: 3, dueDate: '2026-04-01', amount: '0.00' },
        ],
      },
    ],
  ])('rechaza con 422 cuando %s', (_case, change) => {
    expect(() =>
      assertPaymentPlanClosesOnPrice({ ...plan, ...change }),
    ).toThrow(PreconditionFailedException);
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

  it('persiste el cronograma tal como llegó —fechas y montos a mano—, sin calcular interés', async () => {
    const d = build();
    d.serviceCatalogRepo.findById.mockResolvedValue(catalogItem);
    d.quotationsRepo.create.mockReturnValue(quotationRow({ id: 'q-42' }));

    const res = await d.service.createQuotation(baseDto, actor);

    expect(d.quotationsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        downPaymentAmount: '100.00',
        paymentFrequency: 'MONTHLY',
      }),
    );
    expect(d.installmentsRepo.createMany).toHaveBeenCalledTimes(1);
    const [, installments] = d.installmentsRepo.createMany.mock.calls[0] as [
      unknown,
      any[],
    ];
    expect(
      installments.map((i) => [i.quotationId, i.installmentNumber, i.amount]),
    ).toEqual([
      ['q-42', 1, '300.00'],
      ['q-42', 2, '300.00'],
      ['q-42', 3, '300.00'],
    ]);
    expect(installments[2].dueDate.toISOString().slice(0, 10)).toBe(
      '2026-12-20',
    );
    expect(res.installments[1]).toEqual({
      installmentNumber: 2,
      dueDate: '2026-03-15',
      amount: '300.00',
    });
  });

  it('rechaza con 422 un plan que no cierra con el precio, antes de tocar la base', async () => {
    const d = build();

    await expect(
      d.service.createQuotation(
        { ...baseDto, downPaymentAmount: '50.00' },
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.em.transactional).not.toHaveBeenCalled();
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
        amount: '450.00',
      },
    ]);

    const res = await d.service.getQuotation('q-1');

    expect(res.id).toBe('q-1');
    expect(res.installments).toHaveLength(1);
    expect(res.installments[0]).toEqual({
      installmentNumber: 1,
      dueDate: '2026-02-01',
      amount: '450.00',
    });
  });
});
