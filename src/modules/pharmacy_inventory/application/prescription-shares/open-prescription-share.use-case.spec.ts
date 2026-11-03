import { jest } from '@jest/globals';
import { GoneException, HttpStatus } from '@nestjs/common';
import { ResourceNotFoundException, runWithTenant } from '../../../../common';
import { CLIN } from '../../../clinical/clinical.concepts';
import type { PrescribedProductRow } from '../../infrastructure/repositories/prescription-share-read.repository';
import type { SharedPrescriptionSnapshot } from '../ports/pharmacy-prescription-shares.port';
import { OpenPrescriptionShareUseCase } from './open-prescription-share.use-case';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const BOTTLE = CLIN.MEDICATION_UNIT_BOTTLE;
const TABLET_UNIT = 'unit-tablet';

/** Datos sintéticos: nada de esto es de una persona real. */
const SHARE: SharedPrescriptionSnapshot = {
  shareId: 'share-1',
  patientProfileId: 'patient-1',
  issuedAt: new Date('2026-10-20T12:00:00.000Z'),
  validTo: new Date('2026-11-19T12:00:00.000Z'),
  prescriber: {
    name: 'Dra. Prueba',
    license: { number: 'MP-1', authority: 'Colegio', state: 'ACTIVE' },
  },
  items: [
    {
      id: 'mr-syrup',
      medicationConceptId: 'med-syrup',
      doseText: '5 mL',
      frequencyText: 'cada 8 horas',
      quantity: 2,
      unitConceptId: BOTTLE,
    },
    {
      id: 'mr-tablet',
      medicationConceptId: 'med-tablet',
      doseText: null,
      frequencyText: null,
      quantity: 30,
      unitConceptId: TABLET_UNIT,
    },
  ],
};

function product(
  overrides: Partial<PrescribedProductRow> = {},
): PrescribedProductRow {
  return {
    id: 'prod-1',
    pharmacyId: 'ph-1',
    medicationConceptId: 'med-syrup',
    productCode: 'P-1',
    brandName: 'Jarabe Prueba',
    genericName: null,
    strengthText: '120 mL',
    requiresPrescription: true,
    outOfStockDeclared: false,
    ...overrides,
  };
}

function build(
  options: {
    pharmacies?: { id: string }[];
    products?: PrescribedProductRow[];
    share?: SharedPrescriptionSnapshot;
    openError?: Error;
  } = {},
) {
  const em = { fork: mockFn(() => em) };
  /** Lo que el contexto dueño confirmó, en orden: `OPENED` va al final. */
  const recorded: string[] = [];
  const shareReadRepo = {
    findActiveProductsByMedicationConcepts: mockFn(
      async () => options.products ?? [product()],
    ),
  };
  const inventoryRepo = {
    // Sede 1 lleva lotes y lo tiene (3); sede 2 no lleva lotes ni conteo.
    findSiteProductAvailability: mockFn(async () => [
      { siteId: 'site-1', productId: 'prod-1', availableQuantity: '3.000' },
      { siteId: 'site-2', productId: 'prod-1', availableQuantity: null },
    ]),
    findActiveLocationsBySites: mockFn(async () => [
      { id: 'loc-1', pharmacySiteId: 'site-1' },
    ]),
    findStockPositions: mockFn(async () => [
      {
        inventoryLocationId: 'loc-1',
        pharmacyProductId: 'prod-1',
        availableQuantity: '3',
        updatedAt: new Date('2026-10-28T10:00:00.000Z'),
      },
      {
        inventoryLocationId: 'loc-1',
        pharmacyProductId: 'prod-1',
        availableQuantity: '0',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]),
  };
  // Solo la lectura conjunta: si el caso de uso volviera a leer entregado y
  // reservado por separado, no habría con qué responderle.
  const balances = {
    balanceByConcept: mockFn(async () => ({
      dispensed: new Map([['med-syrup', 1]]),
      reserved: new Map([['med-syrup', 0]]),
    })),
  };
  const directory = {
    // Solo farmacias activas y verificadas del tenant (filtro del directorio).
    findVisibleByTenant: mockFn(
      async () => options.pharmacies ?? [{ id: 'ph-1' }],
    ),
    findActiveSites: mockFn(async () => [
      {
        id: 'site-1',
        pharmacyId: 'ph-1',
        practiceSiteId: 'ps-1',
        name: 'Centro',
      },
      {
        id: 'site-2',
        pharmacyId: 'ph-1',
        practiceSiteId: 'ps-2',
        name: 'Norte',
      },
      { id: 'site-3', pharmacyId: 'ph-1', practiceSiteId: 'ps-3', name: 'Sur' },
    ]),
    findCurrentPublicPriceLists: mockFn(async () => [
      { id: 'list-general', code: 'GENERAL', currencyConceptId: 'cur-bob' },
      {
        id: 'list-site',
        code: 'SEDE',
        pharmacySiteId: 'site-1',
        currencyConceptId: 'cur-bob',
      },
    ]),
    findCurrentPrices: mockFn(async () => [
      {
        pharmacyProductId: 'prod-1',
        pharmacyPriceListId: 'list-general',
        unitAmount: '25.50',
      },
      {
        pharmacyProductId: 'prod-1',
        pharmacyPriceListId: 'list-site',
        unitAmount: '20.00',
      },
    ]),
    findConcepts: mockFn(async () => [
      { id: 'med-syrup', code: 'MED_SYRUP', display: 'Jarabe' },
      { id: 'med-tablet', code: 'MED_TABLET', display: 'Comprimido' },
      // El código como lo guarda el catálogo: la clave del concepto de módulo.
      {
        id: BOTTLE,
        code: 'clinical:MEDICATION_UNIT_BOTTLE',
        display: 'Bottle',
      },
      { id: TABLET_UNIT, code: 'UNIT_{tbl}', display: 'Tablet' },
      { id: 'cur-bob', code: 'BOB', display: 'Boliviano' },
    ]),
  };
  const shares = {
    // Como `PrescriptionSharesService`: `prepare` corre antes del `OPENED`.
    openForPharmacy: mockFn(
      async (
        _token: string,
        _context: unknown,
        prepare: (share: SharedPrescriptionSnapshot) => Promise<unknown>,
      ) => {
        if (options.openError) throw options.openError;
        const result = await prepare(options.share ?? SHARE);
        recorded.push('OPENED');
        return result;
      },
    ),
  };
  const patients = {
    findByPatientProfile: mockFn(async () => ({
      name: 'Lucía',
      middleName: null,
      lastName: 'Prueba',
      motherLastName: 'Quispe',
      displayName: 'Lucía Prueba Quispe',
      nationalDocument: '4567890 LP',
    })),
  };
  const accessLog = {
    recordPharmacyRead: mockFn(async () => {
      recorded.push('ACCESS_LOG');
    }),
  };
  const useCase = new OpenPrescriptionShareUseCase(
    em as any,
    shareReadRepo as any,
    inventoryRepo as any,
    balances as any,
    directory as any,
    shares as any,
    patients as any,
    accessLog as any,
  );
  return {
    useCase,
    recorded,
    accessLog,
    shareReadRepo,
    inventoryRepo,
    balances,
    directory,
    shares,
    patients,
  };
}

const open = (d: ReturnType<typeof build>, tenant = 'tenant-ph') =>
  runWithTenant(tenant, () =>
    d.useCase.execute('token-1', 'user-ph', {
      sourceIp: '10.0.0.1',
      userAgent: 'UA',
    }),
  );

/** Todas las claves de un valor JSON, a cualquier profundidad. */
function keysOf(value: unknown, into = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((entry) => keysOf(entry, into));
  else if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      into.add(key);
      keysOf(entry, into);
    }
  }
  return into;
}

describe('OpenPrescriptionShareUseCase (FAR-02)', () => {
  it('a tenant without a pharmacy gets 404 and the link is never opened (no use recorded)', async () => {
    const d = build({ pharmacies: [] });
    await expect(open(d, 'tenant-clinic')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.directory.findVisibleByTenant).toHaveBeenCalledWith(
      expect.anything(),
      'tenant-clinic',
    );
    expect(d.shares.openForPharmacy).not.toHaveBeenCalled();
    expect(d.recorded).toEqual([]);
  });

  it('a draft or unverified pharmacy does not count: only active and verified pharmacies of the tenant open (HIGH-1)', async () => {
    // El directorio no devuelve la farmacia en borrador / sin verificar.
    const d = build({ pharmacies: [] });
    await expect(open(d, 'tenant-draft')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.directory.findVisibleByTenant).toHaveBeenCalledTimes(1);
    expect(d.shares.openForPharmacy).not.toHaveBeenCalled();
    expect(
      d.shareReadRepo.findActiveProductsByMedicationConcepts,
    ).not.toHaveBeenCalled();
    expect(d.patients.findByPatientProfile).not.toHaveBeenCalled();
  });

  it('a revoked or expired link is a 410 from the owning context, and nothing else is read', async () => {
    const d = build({
      openError: new GoneException({
        reason: 'PRESCRIPTION_SHARE_REVOKED',
        details: { reason: 'PRESCRIPTION_SHARE_REVOKED' },
      }),
    });
    const error = await open(d).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(GoneException);
    expect((error as GoneException).getStatus()).toBe(HttpStatus.GONE);
    expect(
      d.shareReadRepo.findActiveProductsByMedicationConcepts,
    ).not.toHaveBeenCalled();
    expect(d.patients.findByPatientProfile).not.toHaveBeenCalled();
  });

  it('an unknown token is the 404 of the owning context', async () => {
    const d = build({
      openError: new ResourceNotFoundException('Enlace no encontrado'),
    });
    await expect(open(d)).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('opens with the token and the request origin, for the use record', async () => {
    const d = build();
    await open(d);
    expect(d.shares.openForPharmacy).toHaveBeenCalledWith(
      'token-1',
      { sourceIp: '10.0.0.1', userAgent: 'UA' },
      expect.any(Function),
    );
  });

  it('logs the served read with the patient and the share, before OPENED (MEDIUM-2)', async () => {
    const d = build();
    await open(d);
    expect(d.accessLog.recordPharmacyRead).toHaveBeenCalledWith(
      expect.anything(),
      {
        userId: 'user-ph',
        tenantId: 'tenant-ph',
        patientProfileId: 'patient-1',
        shareId: 'share-1',
      },
    );
    expect(d.recorded).toEqual(['ACCESS_LOG', 'OPENED']);
  });

  it('if building the view fails after resolving the link, no OPENED and no access row are left (MEDIUM-1)', async () => {
    const d = build();
    const failure = new Error('lectura caída');
    d.inventoryRepo.findSiteProductAvailability.mockRejectedValue(failure);
    await expect(open(d)).rejects.toBe(failure);
    expect(d.recorded).toEqual([]);
    expect(d.accessLog.recordPharmacyRead).not.toHaveBeenCalled();
  });

  it('if the patient identity read fails, no OPENED is left either (MEDIUM-1)', async () => {
    const d = build();
    d.patients.findByPatientProfile.mockRejectedValue(new Error('caída'));
    await expect(open(d)).rejects.toThrow('caída');
    expect(d.recorded).toEqual([]);
  });

  it('if the access row cannot be written, the prescription is not served and no OPENED is left', async () => {
    const d = build();
    d.accessLog.recordPharmacyRead.mockRejectedValue(new Error('sin bitácora'));
    await expect(open(d)).rejects.toThrow('sin bitácora');
    expect(d.recorded).toEqual([]);
  });

  it('crosses only with products of the tenant pharmacies, by medication concept', async () => {
    const d = build({ pharmacies: [{ id: 'ph-1' }, { id: 'ph-1b' }] });
    await open(d);
    expect(
      d.shareReadRepo.findActiveProductsByMedicationConcepts,
    ).toHaveBeenCalledWith(
      expect.anything(),
      ['ph-1', 'ph-1b'],
      ['med-syrup', 'med-tablet'],
    );
    // Las sedes son solo las de las farmacias que tienen el producto.
    expect(d.directory.findActiveSites).toHaveBeenCalledWith(
      expect.anything(),
      ['ph-1'],
    );
  });

  it('an item without a product in the catalog has no matches', async () => {
    const res = await open(build());
    const tablet = res.items.find(
      (item) => item.medicationRequestId === 'mr-tablet',
    );
    expect(tablet?.matches).toEqual([]);
    expect(tablet?.display).toBe('Comprimido');
  });

  it('every match carries its pharmacyId and one row per active site of that pharmacy', async () => {
    const res = await open(build());
    const syrup = res.items.find(
      (item) => item.medicationRequestId === 'mr-syrup',
    )!;
    expect(syrup.matches).toEqual([
      {
        pharmacyId: 'ph-1',
        pharmacyProductId: 'prod-1',
        name: 'Jarabe Prueba 120 mL',
        price: '25.50',
        currencyCode: 'BOB',
        requiresPrescription: true,
        outOfStockDeclared: false,
        sites: [
          {
            siteId: 'site-1',
            siteName: 'Centro',
            available: true,
            quantity: 3,
            // La posición en 0 no fecha nada: queda la de la disponible.
            stockUpdatedAt: '2026-10-28T10:00:00.000Z',
          },
          {
            siteId: 'site-2',
            siteName: 'Norte',
            available: true,
            // Sin lotes y sin conteo declarado.
            quantity: null,
            stockUpdatedAt: null,
          },
          {
            siteId: 'site-3',
            siteName: 'Sur',
            available: false,
            quantity: 0,
            stockUpdatedAt: null,
          },
        ],
      },
    ]);
  });

  it('a product marked out of stock in the catalog says so, and no site has it', async () => {
    const d = build({ products: [product({ outOfStockDeclared: true })] });
    // La regla única no devuelve filas para un producto «no tengo».
    d.inventoryRepo.findSiteProductAvailability.mockResolvedValue([]);
    const res = await open(d);
    const match = res.items[0].matches[0];
    expect(match.outOfStockDeclared).toBe(true);
    expect(match.sites.every((site) => !site.available)).toBe(true);
  });

  it('remaining = prescribed − dispensed − reserved for a countable package unit', async () => {
    const d = build();
    const res = await open(d);
    const syrup = res.items.find(
      (item) => item.medicationRequestId === 'mr-syrup',
    )!;
    expect(syrup).toMatchObject({
      prescribedQuantity: 2,
      unitCode: '{bottle}',
      dispensedQuantity: 1,
      remainingQuantity: 1,
      dosageText: '5 mL · cada 8 horas',
    });
    // Solo se consulta el saldo de lo controlable, sobre los ítems de la receta,
    // y en una sola lectura: entregado y reservado salen de la misma foto.
    expect(d.balances.balanceByConcept).toHaveBeenCalledTimes(1);
    expect(d.balances.balanceByConcept).toHaveBeenCalledWith(
      expect.anything(),
      ['mr-syrup', 'mr-tablet'],
      ['med-syrup'],
    );
  });

  it('reserved stock lowers the remaining from the same balance read', async () => {
    const d = build();
    d.balances.balanceByConcept.mockResolvedValue({
      dispensed: new Map([['med-syrup', 0.5]]),
      reserved: new Map([['med-syrup', 1]]),
    });
    const res = await open(d);
    expect(
      res.items.find((item) => item.medicationRequestId === 'mr-syrup'),
    ).toMatchObject({ dispensedQuantity: 0.5, remainingQuantity: 0.5 });
  });

  it('decimal quantities of the same drug add up exactly: 0.1 + 0.2 is 0.3', async () => {
    const first = { ...SHARE.items[0], quantity: 0.1 };
    const second = { ...SHARE.items[0], id: 'mr-syrup-2', quantity: 0.2 };
    const d = build({ share: { ...SHARE, items: [first, second] } });
    d.balances.balanceByConcept.mockResolvedValue({
      dispensed: new Map([['med-syrup', 0.1]]),
      reserved: new Map(),
    });
    const res = await open(d);
    // Lo que daría la suma en `number`, para que el caso no sea trivial.
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(
      res.items.map((item) => [
        item.prescribedQuantity,
        item.dispensedQuantity,
        item.remainingQuantity,
      ]),
    ).toEqual([
      [0.3, 0.1, 0.2],
      [0.3, 0.1, 0.2],
    ]);
  });

  it('without comparable units, dispensed and remaining are null', async () => {
    const res = await open(build());
    const tablet = res.items.find(
      (item) => item.medicationRequestId === 'mr-tablet',
    )!;
    expect(tablet).toMatchObject({
      prescribedQuantity: 30,
      unitCode: '{tbl}',
      dispensedQuantity: null,
      remainingQuantity: null,
      dosageText: null,
    });
  });

  it('the same drug in two items reads one drug-level balance, never "4 left of 2" (MEDIUM-3)', async () => {
    const renewal = { ...SHARE.items[0], id: 'mr-syrup-2' };
    const d = build({ share: { ...SHARE, items: [SHARE.items[0], renewal] } });
    d.balances.balanceByConcept.mockResolvedValue({
      dispensed: new Map([['med-syrup', 1]]),
      reserved: new Map(),
    });
    const res = await open(d);
    expect(
      res.items.map((item) => [
        item.medicationRequestId,
        item.prescribedQuantity,
        item.dispensedQuantity,
        item.remainingQuantity,
      ]),
    ).toEqual([
      ['mr-syrup', 4, 1, 3],
      ['mr-syrup-2', 4, 1, 3],
    ]);
    for (const item of res.items) {
      expect(item.remainingQuantity!).toBeLessThanOrEqual(
        item.prescribedQuantity!,
      );
    }
  });

  it('a countable unit without a prescribed quantity: nothing is queried and nothing is claimed (LOW-1)', async () => {
    const noQuantity = { ...SHARE.items[0], quantity: null };
    const d = build({ share: { ...SHARE, items: [noQuantity] } });
    const res = await open(d);
    expect(res.items[0]).toMatchObject({
      prescribedQuantity: null,
      dispensedQuantity: null,
      remainingQuantity: null,
    });
    expect(d.balances.balanceByConcept).not.toHaveBeenCalled();
  });

  it('does not read balances when nothing is quantity-controlled', async () => {
    const d = build({ share: { ...SHARE, items: [SHARE.items[1]] } });
    await open(d);
    expect(d.balances.balanceByConcept).not.toHaveBeenCalled();
  });

  it('the price is the one of the general public list, not a site list', async () => {
    const d = build();
    d.directory.findCurrentPrices.mockResolvedValue([
      {
        pharmacyProductId: 'prod-1',
        pharmacyPriceListId: 'list-site',
        unitAmount: '20.00',
      },
    ]);
    const res = await open(d);
    expect(d.directory.findCurrentPrices).toHaveBeenCalledWith(
      expect.anything(),
      ['list-general'],
      ['prod-1'],
      expect.any(Date),
    );
    expect(res.items[0].matches[0]).toMatchObject({
      price: null,
      currencyCode: null,
    });
  });

  it('of the patient, only the masked name and the last 3 document digits leave', async () => {
    const res = await open(build());
    expect(res.patient).toEqual({
      maskedName: 'L. P. Q.',
      documentLast3: '890',
    });
    expect(Object.keys(res.patient).sort()).toEqual([
      'documentLast3',
      'maskedName',
    ]);

    // Se recorren todas las claves: ninguna fuera del contrato (§2 + los dos
    // agregados), y ningún valor lleva el nombre ni el documento completos.
    const allowed = new Set([
      'shareId',
      'issuedAt',
      'validTo',
      'prescriber',
      'name',
      'license',
      'number',
      'authority',
      'state',
      'patient',
      'maskedName',
      'documentLast3',
      'items',
      'medicationRequestId',
      'medicationConceptId',
      'display',
      'dosageText',
      'prescribedQuantity',
      'unitCode',
      'dispensedQuantity',
      'remainingQuantity',
      'matches',
      'pharmacyId',
      'pharmacyProductId',
      'price',
      'currencyCode',
      'requiresPrescription',
      'outOfStockDeclared',
      'sites',
      'siteId',
      'siteName',
      'available',
      'quantity',
      'stockUpdatedAt',
    ]);
    expect([...keysOf(res)].filter((key) => !allowed.has(key))).toEqual([]);
    const body = JSON.stringify(res);
    expect(body).not.toContain('Lucía');
    expect(body).not.toContain('Quispe');
    expect(body).not.toContain('4567890');
    expect(body).not.toContain('patient-1');
  });

  it('a patient without identity data yields nulls, not a failure', async () => {
    const d = build();
    d.patients.findByPatientProfile.mockResolvedValue(null);
    const res = await open(d);
    expect(res.patient).toEqual({ maskedName: null, documentLast3: null });
  });

  it('serves the share header: dates as ISO and the prescriber license', async () => {
    const res = await open(build());
    expect(res).toMatchObject({
      shareId: 'share-1',
      issuedAt: '2026-10-20T12:00:00.000Z',
      validTo: '2026-11-19T12:00:00.000Z',
      prescriber: {
        name: 'Dra. Prueba',
        license: { number: 'MP-1', authority: 'Colegio', state: 'ACTIVE' },
      },
    });
  });
});
