import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacyIntegrationService } from './pharmacy-integration.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import { PHARM } from '../pharmacy.concepts';

const T1 = 't1';
const T2 = 't2';
const NOT_AVAILABLE = PharmacyErrorReason.PHARMACY_NOT_AVAILABLE;
const REFERENCE_NOT_AVAILABLE =
  PharmacyErrorReason.PHARMACY_REFERENCE_NOT_AVAILABLE;

/** Administrador con membresía en T1, el tenant activo de los tests. */
const actor = {
  id: 'admin-1',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [T1],
} as any;

/** Ejecuta `fn` con T1 como tenant activo del request. */
const inTenant = <T>(fn: () => Promise<T>, tenantId = T1): Promise<T> =>
  runWithTenant(tenantId, fn);

/** Captura el rechazo de una promesa para comparar su respuesta HTTP. */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('no rechazó');
}

/** Farmacia activa de un tenant, como la devuelve el repositorio. */
const pharmacyOf = (tenantId: string, extra: object = {}) => ({
  id: 'ph1',
  tenantId,
  statusConceptId: PHARM.PHARMACY_ACTIVE,
  ...extra,
});

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const pharmaciesRepo = {
    findByIdInTenant: mockFn().mockResolvedValue(pharmacyOf(T1)),
  };
  const productsRepo = { findById: mockFn() };
  const connectionsRepo = {
    findByPharmacyAndConnection: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const mappingsRepo = {
    findByConnectionAndProduct: mockFn(),
    findInConnection: mockFn(),
    remove: mockFn(),
    create: mockFn(),
  };
  const referencesRepo = {
    practiceSiteBelongsToTenant: mockFn().mockResolvedValue(true),
    findPharmacySiteInPharmacy: mockFn().mockResolvedValue({
      id: 'site1',
      pharmacyId: 'ph1',
    }),
    isRegisteredInsurer: mockFn().mockResolvedValue(true),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PharmacyIntegrationService(
    em as any,
    pharmaciesRepo as any,
    productsRepo as any,
    connectionsRepo,
    mappingsRepo as any,
    referencesRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    pharmaciesRepo,
    productsRepo,
    connectionsRepo,
    mappingsRepo,
    referencesRepo,
  };
}

describe('PharmacyIntegrationService', () => {
  describe('createConnection (UC-24-07)', () => {
    it('rejects when the pharmacy is not active', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
        tenantId: T1,
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_DRAFT,
      });
      await expect(
        inTenant(() =>
          d.service.createConnection(
            'ph1',
            { integrationMode: 'REALTIME' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates the connection without an integrations connection (connectionId null)', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
        tenantId: T1,
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_ACTIVE,
      });
      d.connectionsRepo.create.mockReturnValue({
        id: 'conn1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.CONNECTION_ACTIVE,
        createdAt: new Date(),
      });
      const res = await inTenant(() =>
        d.service.createConnection(
          'ph1',
          { integrationMode: 'REALTIME', supportsStockQuery: true } as any,
          actor,
        ),
      );
      expect(res).toMatchObject({
        id: 'conn1',
        connectionId: null,
        status: PHARM.CONNECTION_ACTIVE,
      });
    });
  });

  describe('mapProduct (UC-24-08)', () => {
    it('rejects when the connection does not support stock nor price query', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({
        id: 'conn1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.CONNECTION_ACTIVE,
        supportsStockQuery: false,
        supportsPriceQuery: false,
      });
      await expect(
        inTenant(() =>
          d.service.mapProduct(
            'ph1',
            'conn1',
            { pharmacyProductId: 'pr1', externalProductCode: 'X' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicated mapping', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({
        id: 'conn1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.CONNECTION_ACTIVE,
        supportsStockQuery: true,
      });
      d.productsRepo.findById.mockResolvedValue({
        id: 'pr1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
      });
      d.mappingsRepo.findByConnectionAndProduct.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        inTenant(() =>
          d.service.mapProduct(
            'ph1',
            'conn1',
            { pharmacyProductId: 'pr1', externalProductCode: 'X' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws when the product is missing', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({
        id: 'conn1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.CONNECTION_ACTIVE,
        supportsPriceQuery: true,
      });
      d.productsRepo.findById.mockResolvedValue(null);
      await expect(
        inTenant(() =>
          d.service.mapProduct(
            'ph1',
            'conn1',
            { pharmacyProductId: 'pr1', externalProductCode: 'X' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('creates the mapping (verification PENDING)', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({
        id: 'conn1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.CONNECTION_ACTIVE,
        supportsStockQuery: true,
      });
      d.productsRepo.findById.mockResolvedValue({
        id: 'pr1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
      });
      d.mappingsRepo.findByConnectionAndProduct.mockResolvedValue(null);
      d.mappingsRepo.create.mockReturnValue({
        id: 'map1',
        pharmacyIntegrationConnectionId: 'conn1',
        pharmacyProductId: 'pr1',
        externalProductCode: 'X',
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        createdAt: new Date(),
      });
      const res = await inTenant(() =>
        d.service.mapProduct(
          'ph1',
          'conn1',
          { pharmacyProductId: 'pr1', externalProductCode: 'X' },
          actor,
        ),
      );
      expect(res).toMatchObject({
        id: 'map1',
        verificationStatus: PHARM.VERIFICATION_PENDING,
      });
    });
  });

  describe('deshacer y corregir un vínculo', () => {
    const ACTIVE_CONNECTION = {
      id: 'conn1',
      pharmacyId: 'ph1',
      statusConceptId: PHARM.CONNECTION_ACTIVE,
      supportsStockQuery: true,
    };
    const mapping = (extra: object = {}) => ({
      id: 'map1',
      pharmacyIntegrationConnectionId: 'conn1',
      pharmacyProductId: 'pr1',
      externalProductCode: 'ERP-0001',
      externalUnitCode: 'BOX',
      verificationStatusConceptId: PHARM.VERIFICATION_VERIFIED,
      createdAt: new Date('2026-10-01T00:00:00Z'),
      updatedAt: new Date('2026-10-01T00:00:00Z'),
      ...extra,
    });

    it('deshace un vínculo, también con la conexión inactiva, y devuelve cómo estaba', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({
        ...ACTIVE_CONNECTION,
        statusConceptId: 'inactive',
      });
      const row = mapping();
      d.mappingsRepo.findInConnection.mockResolvedValue(row);

      const res = await inTenant(() =>
        d.service.unmapProduct('ph1', 'conn1', 'map1', actor),
      );

      expect(d.mappingsRepo.findInConnection).toHaveBeenCalledWith(
        d.tx,
        'conn1',
        'map1',
      );
      expect(d.mappingsRepo.remove).toHaveBeenCalledWith(d.tx, row);
      expect(d.tx.flush).toHaveBeenCalled();
      expect(res).toMatchObject({
        id: 'map1',
        pharmacyProductId: 'pr1',
        externalProductCode: 'ERP-0001',
        externalUnitCode: 'BOX',
      });
    });

    it('un vínculo de otra conexión responde 404 y no borra nada', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue(ACTIVE_CONNECTION);
      d.mappingsRepo.findInConnection.mockResolvedValue(null);

      const error = await rejection(
        inTenant(() => d.service.unmapProduct('ph1', 'conn1', 'map9', actor)),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(
        PharmacyErrorReason.EXTERNAL_MAPPING_NOT_AVAILABLE,
      );
      expect(d.mappingsRepo.remove).not.toHaveBeenCalled();
    });

    it('una conexión de otra farmacia responde 404 antes de buscar el vínculo', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({
        ...ACTIVE_CONNECTION,
        pharmacyId: 'ph2',
      });
      const error = await rejection(
        inTenant(() => d.service.unmapProduct('ph1', 'conn1', 'map1', actor)),
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(d.mappingsRepo.findInConnection).not.toHaveBeenCalled();
    });

    it('corrige el código y la unidad, y el vínculo vuelve a quedar sin verificar', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue(ACTIVE_CONNECTION);
      const row = mapping();
      d.mappingsRepo.findInConnection.mockResolvedValue(row);

      const res = await inTenant(() =>
        d.service.updateMapping(
          'ph1',
          'conn1',
          'map1',
          { externalProductCode: 'ERP-0002', externalUnitCode: null },
          actor,
        ),
      );

      expect(row.externalProductCode).toBe('ERP-0002');
      expect(row.externalUnitCode).toBeUndefined();
      expect(row.verificationStatusConceptId).toBe(PHARM.VERIFICATION_PENDING);
      expect((row as any).updatedByUserId).toBe('admin-1');
      expect(d.tx.flush).toHaveBeenCalled();
      expect(res).toMatchObject({
        externalProductCode: 'ERP-0002',
        externalUnitCode: null,
        verificationStatus: PHARM.VERIFICATION_PENDING,
      });
      expect(d.productsRepo.findById).not.toHaveBeenCalled();
    });

    it('pasa el vínculo a otro producto activo y libre', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue(ACTIVE_CONNECTION);
      const row = mapping();
      d.mappingsRepo.findInConnection.mockResolvedValue(row);
      d.productsRepo.findById.mockResolvedValue({
        id: 'pr2',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
      });
      d.mappingsRepo.findByConnectionAndProduct.mockResolvedValue(null);

      await inTenant(() =>
        d.service.updateMapping(
          'ph1',
          'conn1',
          'map1',
          { pharmacyProductId: 'pr2' },
          actor,
        ),
      );

      expect(row.pharmacyProductId).toBe('pr2');
      expect(row.externalUnitCode).toBe('BOX');
    });

    it('no pasa el vínculo a un producto que ya tiene otro: 409 con motivo', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue(ACTIVE_CONNECTION);
      const row = mapping();
      d.mappingsRepo.findInConnection.mockResolvedValue(row);
      d.productsRepo.findById.mockResolvedValue({
        id: 'pr2',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
      });
      d.mappingsRepo.findByConnectionAndProduct.mockResolvedValue({
        id: 'map2',
      });

      const error = await rejection(
        inTenant(() =>
          d.service.updateMapping(
            'ph1',
            'conn1',
            'map1',
            { pharmacyProductId: 'pr2' },
            actor,
          ),
        ),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.reason).toBe(
        PharmacyErrorReason.EXTERNAL_MAPPING_PRODUCT_TAKEN,
      );
      expect(row.pharmacyProductId).toBe('pr1');
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('no corrige sobre una conexión inactiva (las condiciones del alta)', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({
        ...ACTIVE_CONNECTION,
        statusConceptId: 'inactive',
      });
      d.mappingsRepo.findInConnection.mockResolvedValue(mapping());
      await expect(
        inTenant(() =>
          d.service.updateMapping(
            'ph1',
            'conn1',
            'map1',
            { externalProductCode: 'X' },
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('una corrección sin campos responde 400 sin abrir transacción', async () => {
      const d = build();
      const error = await rejection(
        inTenant(() =>
          d.service.updateMapping('ph1', 'conn1', 'map1', {}, actor),
        ),
      );
      expect(error.getStatus()).toBe(400);
      expect(error.reason).toBe(
        PharmacyErrorReason.EXTERNAL_MAPPING_EMPTY_UPDATE,
      );
      expect(d.connectionsRepo.findById).not.toHaveBeenCalled();
    });

    it('el alta duplicada dice el motivo y el vínculo que ya existe', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue(ACTIVE_CONNECTION);
      d.productsRepo.findById.mockResolvedValue({
        id: 'pr1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
      });
      d.mappingsRepo.findByConnectionAndProduct.mockResolvedValue({
        id: 'map1',
      });
      const error = await rejection(
        inTenant(() =>
          d.service.mapProduct(
            'ph1',
            'conn1',
            { pharmacyProductId: 'pr1', externalProductCode: 'X' },
            actor,
          ),
        ),
      );
      expect(error.reason).toBe(
        PharmacyErrorReason.EXTERNAL_MAPPING_PRODUCT_TAKEN,
      );
      expect(error.details).toMatchObject({ mappingId: 'map1' });
    });
  });

  describe('alcance de tenant y referencias (PHARM-01 / PHARM-02)', () => {
    it('createConnection sobre una farmacia de T2 responde igual que una inexistente y no escribe', async () => {
      const d = build();
      const dto = { integrationMode: 'REALTIME' } as any;
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacyOf(T2));
      const foreignError = await rejection(
        inTenant(() => d.service.createConnection('ph2', dto, actor)),
      );
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
      const missingError = await rejection(
        inTenant(() => d.service.createConnection('ph2', dto, actor)),
      );

      expect(foreignError).toBeInstanceOf(ResourceNotFoundException);
      expect(foreignError.reason).toBe(NOT_AVAILABLE);
      expect(foreignError.details).toBeUndefined();
      expect(foreignError.getResponse()).toEqual(missingError.getResponse());
      expect(d.connectionsRepo.create).not.toHaveBeenCalled();
    });

    it('mapProduct exige la farmacia del tenant antes de cargar la conexión', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);

      const error = await rejection(
        inTenant(() =>
          d.service.mapProduct(
            'ph2',
            'conn1',
            { pharmacyProductId: 'pr1', externalProductCode: 'X' } as any,
            actor,
          ),
        ),
      );

      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(d.connectionsRepo.findById).not.toHaveBeenCalled();
      expect(d.mappingsRepo.create).not.toHaveBeenCalled();
    });

    it('valida la sede de la conexión contra la farmacia', async () => {
      const d = build();
      d.connectionsRepo.create.mockReturnValue({
        id: 'conn1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.CONNECTION_ACTIVE,
        createdAt: new Date(),
      });

      await inTenant(() =>
        d.service.createConnection(
          'ph1',
          { integrationMode: 'REALTIME', pharmacySiteId: 'site1' } as any,
          actor,
        ),
      );

      expect(d.referencesRepo.findPharmacySiteInPharmacy).toHaveBeenCalledWith(
        d.tx,
        'site1',
        'ph1',
      );
    });

    it('rechaza una sede de otra farmacia con 404 y sin escribir', async () => {
      const d = build();
      d.referencesRepo.findPharmacySiteInPharmacy.mockResolvedValue(null);

      const error = await rejection(
        inTenant(() =>
          d.service.createConnection(
            'ph1',
            { integrationMode: 'REALTIME', pharmacySiteId: 'site-t2' } as any,
            actor,
          ),
        ),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(REFERENCE_NOT_AVAILABLE);
      expect(error.details).toBeUndefined();
      expect(d.connectionsRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });
  });
});
