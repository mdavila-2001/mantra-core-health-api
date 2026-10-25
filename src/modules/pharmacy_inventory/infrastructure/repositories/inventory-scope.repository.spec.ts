import { jest } from '@jest/globals';
import { MedicationRequests } from '../../../clinical/entities';
import {
  Pharmacies,
  PharmacyIntegrationConnections,
  PharmacyProducts,
  PharmacySites,
} from '../../../pharmacy/entities';
import { PatientProfiles } from '../../../profiles/entities';
import {
  InventoryLocations,
  InventoryLots,
  InventoryReservations,
  InventoryStockPositions,
} from '../../entities';
import { ORDER_STATUS_IDS } from '../../domain/order-status-ids';
import { InventoryScopeRepository } from './inventory-scope.repository';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('InventoryScopeRepository', () => {
  const repo = new InventoryScopeRepository();

  it('acota cada búsqueda a su padre en la consulta, no después', async () => {
    const em = { findOne: mockFn().mockResolvedValue(null) } as any;

    await repo.findPharmacyInTenant(em, 'ph', 't1');
    await repo.findSiteInPharmacy(em, 'site', 'ph');
    await repo.findLocationInSite(em, 'loc', 'site');
    await repo.findProductInPharmacy(em, 'prod', 'ph');

    expect(em.findOne).toHaveBeenNthCalledWith(1, Pharmacies, {
      id: 'ph',
      tenantId: 't1',
    });
    expect(em.findOne).toHaveBeenNthCalledWith(2, PharmacySites, {
      id: 'site',
      pharmacyId: 'ph',
    });
    expect(em.findOne).toHaveBeenNthCalledWith(3, InventoryLocations, {
      id: 'loc',
      pharmacySiteId: 'site',
    });
    expect(em.findOne).toHaveBeenNthCalledWith(4, PharmacyProducts, {
      id: 'prod',
      pharmacyId: 'ph',
    });
  });

  it('las búsquedas sin padre resuelven el agregado para que el llamador lo ubique', async () => {
    const em = { findOne: mockFn().mockResolvedValue(null) } as any;

    await repo.findSite(em, 'site');
    await repo.findLocation(em, 'loc');
    await repo.findProduct(em, 'prod');
    await repo.findLot(em, 'lot');
    await repo.findConnection(em, 'conn');

    expect(em.findOne).toHaveBeenNthCalledWith(1, PharmacySites, {
      id: 'site',
    });
    expect(em.findOne).toHaveBeenNthCalledWith(2, InventoryLocations, {
      id: 'loc',
    });
    expect(em.findOne).toHaveBeenNthCalledWith(3, PharmacyProducts, {
      id: 'prod',
    });
    expect(em.findOne).toHaveBeenNthCalledWith(4, InventoryLots, {
      id: 'lot',
    });
    expect(em.findOne).toHaveBeenNthCalledWith(
      5,
      PharmacyIntegrationConnections,
      {
        id: 'conn',
      },
    );
  });

  it('lista las posiciones del lote en cualquier ubicación', async () => {
    const em = { find: mockFn().mockResolvedValue([]) } as any;

    await repo.findPositionsOfLot(em, 'lot');

    expect(em.find).toHaveBeenCalledWith(InventoryStockPositions, {
      inventoryLotId: 'lot',
    });
  });

  it('el paciente se busca por su clave primaria y la receta por paciente', async () => {
    const em = {
      count: mockFn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
    } as any;

    await expect(repo.patientExists(em, 'pat')).resolves.toBe(true);
    await expect(
      repo.medicationRequestBelongsToPatient(em, 'rx', 'pat'),
    ).resolves.toBe(false);

    expect(em.count).toHaveBeenNthCalledWith(1, PatientProfiles, {
      profileId: 'pat',
    });
    expect(em.count).toHaveBeenNthCalledWith(2, MedicationRequests, {
      id: 'rx',
      patientProfileId: 'pat',
    });
  });

  it('el paciente llega a la farmacia por receta en custodia del tenant o por un pedido propio', async () => {
    const em = {
      count: mockFn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0),
    } as any;

    await expect(
      repo.patientServedByPharmacy(em, 'pat', 't1', 'ph-1'),
    ).resolves.toBe(true);
    await expect(
      repo.patientServedByPharmacy(em, 'pat', 't1', 'ph-1'),
    ).resolves.toBe(false);

    expect(em.count).toHaveBeenNthCalledWith(1, MedicationRequests, {
      patientProfileId: 'pat',
      custodianTenantId: 't1',
    });
    expect(em.count).toHaveBeenNthCalledWith(2, InventoryReservations, {
      pharmacyId: 'ph-1',
      patientProfileId: 'pat',
      reservationStatusConceptId: { $in: [...ORDER_STATUS_IDS] },
    });
  });

  it('la receta llega a la farmacia por custodia del tenant o por un pedido que la nombra', async () => {
    const em = {
      count: mockFn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0),
    } as any;

    await expect(
      repo.medicationRequestServedByPharmacy(em, 'rx', 't1', 'ph-1'),
    ).resolves.toBe(true);
    await expect(
      repo.medicationRequestServedByPharmacy(em, 'rx', 't1', 'ph-1'),
    ).resolves.toBe(false);

    expect(em.count).toHaveBeenNthCalledWith(1, MedicationRequests, {
      id: 'rx',
      custodianTenantId: 't1',
    });
    expect(em.count).toHaveBeenNthCalledWith(3, InventoryReservations, {
      pharmacyId: 'ph-1',
      medicationRequestId: 'rx',
      reservationStatusConceptId: { $in: [...ORDER_STATUS_IDS] },
    });
  });
});
