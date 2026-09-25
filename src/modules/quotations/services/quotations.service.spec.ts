import { jest } from '@jest/globals';

/** Ejecuta la operación mock fn. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { QuotationsService } from './quotations.service';
import { assertPaymentPlanClosesOnPrice, toCents } from './payment-plan';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';

const actor = {
  id: 'user-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;

const actorSinPerfil = { id: 'user-2', roles: ['PRACTITIONER'] } as any;

/** Cuenta administradora de la organización, sin perfil profesional. */
const admin = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/** Un paciente autenticado: ni perfil profesional ni rol administrativo. */
const paciente = {
  id: 'user-3',
  roles: ['PATIENT'],
  patientProfileId: 'pat-1',
} as any;

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
  // Por defecto el profesional de prueba está vinculado a `pr1`, la práctica
  // de `baseDto` y de `catalogItem`: el camino feliz no tiene que declararlo.
  // Las pruebas de alcance lo pisan.
  const practiceTenantLookup = {
    findActivePracticeIdsForPractitioner: mockFn().mockResolvedValue(['pr1']),
    findActivePracticeIdsForTenant: mockFn().mockResolvedValue([]),
    findTenantOfPractice: mockFn().mockResolvedValue(null),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new QuotationsService(
    em as any,
    quotationsRepo as any,
    installmentsRepo as any,
    serviceCatalogRepo as any,
    practiceTenantLookup as any,
    logger as any,
  );
  return {
    service,
    tx,
    em,
    quotationsRepo,
    installmentsRepo,
    serviceCatalogRepo,
    practiceTenantLookup,
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

  /* ---- alcance: actor ↔ práctica ↔ servicio ----------------------------------
     El rol no alcanza (AC-24-11): la práctica viene declarada en el cuerpo y
     hay que estar vinculado a ella; y el servicio cotizado tiene que ser de esa
     misma práctica. Mismos criterios que el asiento contable (422 con práctica
     declarada) y que el PATCH del catálogo (404 indistinguible). */

  it('422 si el profesional no está vinculado a la práctica declarada, sin tocar el catálogo', async () => {
    const d = build();
    d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
      ['otra-practica'],
    );

    await expect(
      d.service.createQuotation(baseDto, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.serviceCatalogRepo.findById).not.toHaveBeenCalled();
    expect(d.quotationsRepo.create).not.toHaveBeenCalled();
  });

  it('un servicio de otra práctica es el MISMO 404 que uno inexistente, y no persiste nada', async () => {
    const d = build();
    d.serviceCatalogRepo.findById.mockResolvedValue({
      ...catalogItem,
      practiceId: 'otra-practica',
    });

    await expect(
      d.service.createQuotation(baseDto, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.quotationsRepo.create).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('la cuenta administradora con perfil profesional cotiza en una práctica de su organización', async () => {
    const d = build();
    const adminConPerfil = {
      ...admin,
      practitionerProfileId: 'hp-admin',
    } as any;
    d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
      [],
    );
    d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue('mi-tenant');
    d.serviceCatalogRepo.findById.mockResolvedValue(catalogItem);
    d.quotationsRepo.create.mockReturnValue(quotationRow());

    const res = await runWithTenant('mi-tenant', () =>
      d.service.createQuotation(baseDto, adminConPerfil),
    );

    expect(res.id).toBe('q-1');
  });

  it('la cuenta administradora de otra organización no cotiza en esa práctica: 422', async () => {
    const d = build();
    const adminConPerfil = {
      ...admin,
      practitionerProfileId: 'hp-admin',
    } as any;
    d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
      [],
    );
    d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue(
      'otro-tenant',
    );

    await expect(
      runWithTenant('mi-tenant', () =>
        d.service.createQuotation(baseDto, adminConPerfil),
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.serviceCatalogRepo.findById).not.toHaveBeenCalled();
  });
});

describe('QuotationsService.getQuotation', () => {
  it('lanza ResourceNotFoundException si no existe', async () => {
    const d = build();
    d.quotationsRepo.findById.mockResolvedValue(null);

    await expect(d.service.getQuotation('nope', actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('una cotización de una práctica ajena es el MISMO 404, no un 403, y no lee sus cuotas', async () => {
    const d = build();
    d.quotationsRepo.findById.mockResolvedValue(quotationRow());
    d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
      ['otra-practica'],
    );

    await expect(d.service.getQuotation('q-1', actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.installmentsRepo.findByQuotationId).not.toHaveBeenCalled();
  });

  it('un paciente autenticado, sin perfil profesional ni rol administrativo, recibe 404', async () => {
    const d = build();
    d.quotationsRepo.findById.mockResolvedValue(quotationRow());

    await expect(
      d.service.getQuotation('q-1', paciente),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner,
    ).not.toHaveBeenCalled();
  });

  it('la cuenta administradora lee lo que cotizó su organización', async () => {
    const d = build();
    d.quotationsRepo.findById.mockResolvedValue(quotationRow());
    d.installmentsRepo.findByQuotationId.mockResolvedValue([]);
    d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue('mi-tenant');

    const res = await runWithTenant('mi-tenant', () =>
      d.service.getQuotation('q-1', admin),
    );

    expect(res.id).toBe('q-1');
  });

  it('la cuenta administradora de otra organización recibe 404', async () => {
    const d = build();
    d.quotationsRepo.findById.mockResolvedValue(quotationRow());
    d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue(
      'otro-tenant',
    );

    await expect(
      runWithTenant('mi-tenant', () => d.service.getQuotation('q-1', admin)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
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

    const res = await d.service.getQuotation('q-1', actor);

    expect(res.id).toBe('q-1');
    expect(res.installments).toHaveLength(1);
    expect(res.installments[0]).toEqual({
      installmentNumber: 1,
      dueDate: '2026-02-01',
      amount: '450.00',
    });
  });
});

describe('QuotationsService.listQuotationsByPatient', () => {
  it('acota la consulta a las prácticas del profesional, no filtra después de leer', async () => {
    const d = build();
    d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
      ['pr1', 'pr2'],
    );
    d.quotationsRepo.findByPatient.mockResolvedValue([quotationRow()]);
    d.installmentsRepo.findByQuotationId.mockResolvedValue([]);

    const res = await d.service.listQuotationsByPatient('pat-1', actor);

    expect(d.quotationsRepo.findByPatient).toHaveBeenCalledWith(
      expect.anything(),
      'pat-1',
      ['pr1', 'pr2'],
    );
    expect(res).toHaveLength(1);
  });

  it('sin ninguna práctica alcanzable devuelve vacío sin ir a la base', async () => {
    const d = build();
    d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
      [],
    );

    const res = await d.service.listQuotationsByPatient('pat-1', actor);

    expect(res).toEqual([]);
    expect(d.quotationsRepo.findByPatient).not.toHaveBeenCalled();
  });

  it('un paciente autenticado no lista cotizaciones: ni vinculación ni organización', async () => {
    const d = build();

    const res = await d.service.listQuotationsByPatient('pat-1', paciente);

    expect(res).toEqual([]);
    expect(d.quotationsRepo.findByPatient).not.toHaveBeenCalled();
  });

  it('la cuenta administradora acota a las prácticas activas de su organización en contexto', async () => {
    const d = build();
    d.practiceTenantLookup.findActivePracticeIdsForTenant.mockResolvedValue([
      'pr-a',
      'pr-b',
    ]);
    d.quotationsRepo.findByPatient.mockResolvedValue([]);

    await runWithTenant('mi-tenant', () =>
      d.service.listQuotationsByPatient('pat-1', admin),
    );

    expect(
      d.practiceTenantLookup.findActivePracticeIdsForTenant,
    ).toHaveBeenCalledWith('mi-tenant');
    expect(d.quotationsRepo.findByPatient).toHaveBeenCalledWith(
      expect.anything(),
      'pat-1',
      ['pr-a', 'pr-b'],
    );
  });

  it('la cuenta administradora sin organización en contexto no tiene contra qué acotar: vacío', async () => {
    const d = build();

    const res = await d.service.listQuotationsByPatient('pat-1', admin);

    expect(res).toEqual([]);
    expect(
      d.practiceTenantLookup.findActivePracticeIdsForTenant,
    ).not.toHaveBeenCalled();
    expect(d.quotationsRepo.findByPatient).not.toHaveBeenCalled();
  });
});
