import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacyIntegrationService } from './pharmacy-integration.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { PHARM } from '../pharmacy.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const pharmaciesRepo = { findById: mockFn() };
  const productsRepo = { findById: mockFn() };
  const connectionsRepo = {
    findByPharmacyAndConnection: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const mappingsRepo = {
    findByConnectionAndProduct: mockFn(),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PharmacyIntegrationService(
    em as any,
    pharmaciesRepo as any,
    productsRepo as any,
    connectionsRepo,
    mappingsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    pharmaciesRepo,
    productsRepo,
    connectionsRepo,
    mappingsRepo,
  };
}

describe('PharmacyIntegrationService', () => {
  describe('createConnection (UC-24-07)', () => {
    it('rejects when the pharmacy is not active', async () => {
      const d = build();
      d.pharmaciesRepo.findById.mockResolvedValue({
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_DRAFT,
      });
      await expect(
        d.service.createConnection(
          'ph1',
          { integrationMode: 'REALTIME' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates a self-referencing connection', async () => {
      const d = build();
      d.pharmaciesRepo.findById.mockResolvedValue({
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_ACTIVE,
      });
      d.connectionsRepo.create.mockReturnValue({
        id: 'conn1',
        pharmacyId: 'ph1',
        connectionId: 'conn1',
        statusConceptId: PHARM.CONNECTION_ACTIVE,
        createdAt: new Date(),
      });
      const res = await d.service.createConnection(
        'ph1',
        { integrationMode: 'REALTIME', supportsStockQuery: true } as any,
        actor,
      );
      expect(res).toMatchObject({
        id: 'conn1',
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
        d.service.mapProduct(
          'ph1',
          'conn1',
          { pharmacyProductId: 'pr1', externalProductCode: 'X' } as any,
          actor,
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
        d.service.mapProduct(
          'ph1',
          'conn1',
          { pharmacyProductId: 'pr1', externalProductCode: 'X' } as any,
          actor,
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
        d.service.mapProduct(
          'ph1',
          'conn1',
          { pharmacyProductId: 'pr1', externalProductCode: 'X' } as any,
          actor,
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
      const res = await d.service.mapProduct(
        'ph1',
        'conn1',
        { pharmacyProductId: 'pr1', externalProductCode: 'X' },
        actor,
      );
      expect(res).toMatchObject({
        id: 'map1',
        verificationStatus: PHARM.VERIFICATION_PENDING,
      });
    });
  });
});
