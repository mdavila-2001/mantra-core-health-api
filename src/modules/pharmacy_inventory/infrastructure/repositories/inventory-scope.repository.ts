import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
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
  InventoryStockPositions,
} from '../../entities';

/**
 * Consultas de pertenencia del módulo: cada una resuelve un agregado **dentro**
 * de su padre (farmacia → sede → ubicación; farmacia → producto → lote), de
 * modo que un UUID de otra cadena no se encuentra en vez de cargarse y compararse
 * después. Stateless: recibe el `EntityManager` activo en cada método.
 */
@Injectable()
export class InventoryScopeRepository {
  /** Farmacia del tenant; `null` si no existe o es de otro tenant. */
  findPharmacyInTenant(
    em: EntityManager,
    pharmacyId: string,
    tenantId: string,
  ): Promise<Pharmacies | null> {
    return em.findOne(Pharmacies, { id: pharmacyId, tenantId });
  }

  /** Sede por id, sin acotar: el llamador resuelve de qué farmacia es. */
  findSite(em: EntityManager, siteId: string): Promise<PharmacySites | null> {
    return em.findOne(PharmacySites, { id: siteId });
  }

  /** Sede de una farmacia; `null` si no existe o es de otra farmacia. */
  findSiteInPharmacy(
    em: EntityManager,
    siteId: string,
    pharmacyId: string,
  ): Promise<PharmacySites | null> {
    return em.findOne(PharmacySites, { id: siteId, pharmacyId });
  }

  /** Ubicación de una sede; `null` si no existe o es de otra sede. */
  findLocationInSite(
    em: EntityManager,
    locationId: string,
    pharmacySiteId: string,
  ): Promise<InventoryLocations | null> {
    return em.findOne(InventoryLocations, { id: locationId, pharmacySiteId });
  }

  /** Ubicación por id, sin acotar: el llamador resuelve de qué sede es. */
  findLocation(
    em: EntityManager,
    locationId: string,
  ): Promise<InventoryLocations | null> {
    return em.findOne(InventoryLocations, { id: locationId });
  }

  /** Producto de una farmacia; `null` si no existe o es de otra farmacia. */
  findProductInPharmacy(
    em: EntityManager,
    productId: string,
    pharmacyId: string,
  ): Promise<PharmacyProducts | null> {
    return em.findOne(PharmacyProducts, { id: productId, pharmacyId });
  }

  /** Producto por id, sin acotar: el llamador resuelve de qué farmacia es. */
  findProduct(
    em: EntityManager,
    productId: string,
  ): Promise<PharmacyProducts | null> {
    return em.findOne(PharmacyProducts, { id: productId });
  }

  /** Lote por id, sin acotar: el llamador comprueba de qué producto es. */
  findLot(em: EntityManager, lotId: string): Promise<InventoryLots | null> {
    return em.findOne(InventoryLots, { id: lotId });
  }

  /** Posiciones de stock de un lote, en cualquier ubicación. */
  findPositionsOfLot(
    em: EntityManager,
    lotId: string,
  ): Promise<InventoryStockPositions[]> {
    return em.find(InventoryStockPositions, { inventoryLotId: lotId });
  }

  /** Conexión de integración por id, sin acotar: el llamador resuelve su farmacia. */
  findConnection(
    em: EntityManager,
    connectionId: string,
  ): Promise<PharmacyIntegrationConnections | null> {
    return em.findOne(PharmacyIntegrationConnections, { id: connectionId });
  }

  /** Si existe el perfil de paciente. */
  async patientExists(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<boolean> {
    return (
      (await em.count(PatientProfiles, { profileId: patientProfileId })) > 0
    );
  }

  /** Si la receta existe y es del paciente. */
  async medicationRequestBelongsToPatient(
    em: EntityManager,
    medicationRequestId: string,
    patientProfileId: string,
  ): Promise<boolean> {
    return (
      (await em.count(MedicationRequests, {
        id: medicationRequestId,
        patientProfileId,
      })) > 0
    );
  }
}
