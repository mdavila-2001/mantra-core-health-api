import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  requireTenantId,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { assertResourceInTenant } from '../../../../common/tenant/resource-scope';
import { hasPrivilegedTenantRole } from '../../../../common/tenant/tenant-resolution';
import type { InventoryLocations, InventoryLots } from '../../entities';
import { InventoryScopeRepository } from '../../infrastructure/repositories';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';

/** Mensaje único con el que el módulo dice "no existe" para cualquier recurso fuera de ámbito. */
const NOT_AVAILABLE = {
  message: 'Recurso de farmacia no disponible',
  reason:
    PharmacyInventoryErrorReason.PHARMACY_INVENTORY_RESOURCE_NOT_AVAILABLE,
} as const;

/** Farmacia que el actor administra, ya resuelta dentro de su tenant. */
export interface PharmacyScope {
  readonly tenantId: string;
  readonly pharmacyId: string;
}

/** Sede resuelta dentro de una farmacia administrada. */
export interface SiteScope extends PharmacyScope {
  readonly siteId: string;
}

/**
 * Política de ámbito del inventario de farmacia.
 *
 * Los comandos reciben de la ruta y del cuerpo una combinación de UUID
 * (farmacia, sede, ubicación, producto, lote, proveedor, orden, reserva,
 * paciente, receta) que antes se aceptaba como prueba de que se relacionan.
 * Aquí cada eslabón se resuelve **dentro** de su padre y el tenant sale del
 * contexto verificado del request, nunca del cuerpo:
 *
 * ```
 * tenant (contexto) → farmacia → sede → ubicación
 *                              → producto → lote
 * ```
 *
 * Un UUID de otra cadena responde exactamente igual que uno inexistente
 * (`404`, mismo mensaje y `reason`, sin `details`): distinguirlos le
 * confirmaría a un tercero que ese UUID existe en otra organización. Cuando
 * son los datos ya guardados los que no cierran la cadena, la respuesta es
 * `PHARMACY_INVENTORY_SCOPE_INCONSISTENT` y no se escribe nada.
 */
@Injectable()
export class PharmacyInventoryScopePolicy {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param scope - Consultas de pertenencia dentro de cada padre.
   */
  constructor(private readonly scope: InventoryScopeRepository) {}

  /**
   * Excepción uniforme de "no disponible". Los casos de uso la lanzan también
   * cuando el recurso de la ruta (reserva, dispensación, conteo…) no existe, para
   * que ausente y ajeno no se distingan.
   */
  notAvailable(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      NOT_AVAILABLE.message,
      undefined,
      NOT_AVAILABLE.reason,
    );
  }

  /**
   * Excepción de datos guardados que no cierran la cadena de ámbito.
   *
   * @param detail - Qué eslabón no cierra; sin identificadores de otros tenants.
   */
  inconsistent(detail: string): PreconditionFailedException {
    return new PreconditionFailedException(
      'Los datos de inventario no son consistentes con la farmacia',
      { detail },
      PharmacyInventoryErrorReason.PHARMACY_INVENTORY_SCOPE_INCONSISTENT,
    );
  }

  /**
   * Resuelve la farmacia que el actor administra: del tenant activo y con el
   * actor como miembro (o actor de plataforma, que elige el tenant).
   *
   * @throws ResourceNotFoundException si no existe o no es administrable por el actor.
   * @throws PreconditionFailedException si el request no fijó tenant.
   */
  async requireManagedPharmacy(
    tx: EntityManager,
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyScope> {
    const tenantId = requireTenantId();
    const operates =
      hasPrivilegedTenantRole(actor) ||
      (actor.tenantIds?.includes(tenantId) ?? false);
    const pharmacy = operates
      ? await this.scope.findPharmacyInTenant(tx, pharmacyId, tenantId)
      : null;
    assertResourceInTenant(
      pharmacy,
      pharmacy?.tenantId,
      tenantId,
      NOT_AVAILABLE,
    );
    return { tenantId, pharmacyId };
  }

  /**
   * Resuelve una sede que llega sola en la ruta: su farmacia debe ser una de
   * las que el actor administra.
   */
  async requireManagedSite(
    tx: EntityManager,
    siteId: string,
    actor: AuthenticatedUser,
  ): Promise<SiteScope> {
    const site = await this.scope.findSite(tx, siteId);
    if (!site) {
      // Se exige el tenant igual que en el camino feliz: ausente y ajena no se distinguen.
      requireTenantId();
      throw this.notAvailable();
    }
    const pharmacy = await this.requireManagedPharmacy(
      tx,
      site.pharmacyId,
      actor,
    );
    return { ...pharmacy, siteId: site.id };
  }

  /** Sede del cuerpo: debe pertenecer a la farmacia ya administrada. */
  async requireSite(
    tx: EntityManager,
    pharmacy: PharmacyScope,
    siteId: string,
  ): Promise<SiteScope> {
    const site = await this.scope.findSiteInPharmacy(
      tx,
      siteId,
      pharmacy.pharmacyId,
    );
    if (!site) throw this.notAvailable();
    return { ...pharmacy, siteId: site.id };
  }

  /** Ubicación del cuerpo: debe pertenecer a la sede ya resuelta. */
  async requireLocation(
    tx: EntityManager,
    site: SiteScope,
    locationId: string,
  ): Promise<InventoryLocations> {
    const location = await this.scope.findLocationInSite(
      tx,
      locationId,
      site.siteId,
    );
    if (!location) throw this.notAvailable();
    return location;
  }

  /**
   * Ubicación del cuerpo que puede estar en cualquier sede de la farmacia
   * (origen y destino de una transferencia). Devuelve la ubicación para que el
   * asiento use la sede verdadera de cada una.
   */
  async requireLocationInPharmacy(
    tx: EntityManager,
    pharmacy: PharmacyScope,
    locationId: string,
  ): Promise<InventoryLocations> {
    const location = await this.scope.findLocation(tx, locationId);
    if (!location) throw this.notAvailable();
    const site = await this.scope.findSiteInPharmacy(
      tx,
      location.pharmacySiteId,
      pharmacy.pharmacyId,
    );
    if (!site) throw this.notAvailable();
    return location;
  }

  /**
   * Clave de una posición de stock del cuerpo: ubicación de la sede, producto
   * de la farmacia y, si se indica, lote de ese producto.
   */
  async requireStockKey(
    tx: EntityManager,
    site: SiteScope,
    key: {
      readonly inventoryLocationId: string;
      readonly pharmacyProductId: string;
      readonly inventoryLotId?: string;
    },
  ): Promise<void> {
    await this.requireLocation(tx, site, key.inventoryLocationId);
    await this.requireProduct(tx, site, key.pharmacyProductId);
    await this.requireLot(tx, key.inventoryLotId, key.pharmacyProductId);
  }

  /** Producto del cuerpo: debe pertenecer a la farmacia ya administrada. */
  async requireProduct(
    tx: EntityManager,
    pharmacy: PharmacyScope,
    productId: string,
  ): Promise<void> {
    const product = await this.scope.findProductInPharmacy(
      tx,
      productId,
      pharmacy.pharmacyId,
    );
    if (!product) throw this.notAvailable();
  }

  /**
   * Lote del cuerpo: debe ser del producto indicado (que a su vez se resuelve
   * con `requireProduct` dentro de la farmacia). Sin `inventoryLotId` no hay
   * nada que resolver.
   */
  async requireLot(
    tx: EntityManager,
    lotId: string | undefined,
    productId: string,
  ): Promise<InventoryLots | undefined> {
    if (lotId === undefined) return undefined;
    const lot = await this.scope.findLot(tx, lotId);
    if (!lot || lot.pharmacyProductId !== productId) throw this.notAvailable();
    return lot;
  }

  /**
   * Paciente y receta del cuerpo: el perfil debe existir y la receta, si se
   * indica, debe ser de ese paciente. Un perfil o una receta inexistentes o
   * ajenos responden igual.
   */
  async requirePatientContext(
    tx: EntityManager,
    patientProfileId: string | undefined,
    medicationRequestId: string | undefined,
  ): Promise<void> {
    if (patientProfileId !== undefined) {
      if (!(await this.scope.patientExists(tx, patientProfileId))) {
        throw this.notAvailable();
      }
    }
    if (medicationRequestId !== undefined) {
      const owned =
        patientProfileId !== undefined &&
        (await this.scope.medicationRequestBelongsToPatient(
          tx,
          medicationRequestId,
          patientProfileId,
        ));
      if (!owned) throw this.notAvailable();
    }
  }

  /**
   * Clave de stock **ya guardada** (sesión de conteo, posición de un recall):
   * ubicación en la sede, y producto y lote de la farmacia de la sede. Si no
   * cierra, los datos están corruptos y no se escribe ningún asiento.
   *
   * @throws PreconditionFailedException `PHARMACY_INVENTORY_SCOPE_INCONSISTENT` si algún eslabón no cierra.
   */
  async assertStoredStockKey(
    tx: EntityManager,
    site: SiteScope,
    key: {
      readonly inventoryLocationId: string;
      readonly pharmacyProductId?: string;
      readonly inventoryLotId?: string;
    },
  ): Promise<void> {
    const location = await this.scope.findLocationInSite(
      tx,
      key.inventoryLocationId,
      site.siteId,
    );
    if (!location) throw this.inconsistent('location');
    if (key.pharmacyProductId === undefined) return;
    const product = await this.scope.findProductInPharmacy(
      tx,
      key.pharmacyProductId,
      site.pharmacyId,
    );
    if (!product) throw this.inconsistent('product');
    if (key.inventoryLotId === undefined) return;
    const lot = await this.scope.findLot(tx, key.inventoryLotId);
    if (!lot || lot.pharmacyProductId !== key.pharmacyProductId) {
      throw this.inconsistent('lot');
    }
  }

  /**
   * Cadena guardada de una ubicación: la ubicación debe estar en una sede, y
   * la sede en la farmacia ya administrada. Devuelve la sede verdadera para el
   * asiento del ledger.
   *
   * @throws PreconditionFailedException `PHARMACY_INVENTORY_SCOPE_INCONSISTENT` si la ubicación o la sede guardadas no cierran con la farmacia.
   */
  async resolveStoredLocation(
    tx: EntityManager,
    pharmacy: PharmacyScope,
    locationId: string,
  ): Promise<SiteScope & { readonly locationId: string }> {
    const location = await this.scope.findLocation(tx, locationId);
    if (!location) throw this.inconsistent('location');
    const site = await this.scope.findSiteInPharmacy(
      tx,
      location.pharmacySiteId,
      pharmacy.pharmacyId,
    );
    if (!site) throw this.inconsistent('site');
    return { ...pharmacy, siteId: site.id, locationId: location.id };
  }

  /**
   * Resuelve la farmacia de un producto que llega solo (el producto de un
   * recall): debe ser de una farmacia que el actor administra.
   */
  async requireManagedProduct(
    tx: EntityManager,
    productId: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyScope> {
    const product = await this.scope.findProduct(tx, productId);
    if (!product) {
      requireTenantId();
      throw this.notAvailable();
    }
    return this.requireManagedPharmacy(tx, product.pharmacyId, actor);
  }

  /**
   * Conexión de integración del cuerpo: su farmacia debe ser administrada por
   * el actor.
   */
  async requireManagedConnection(
    tx: EntityManager,
    connectionId: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyScope> {
    const connection = await this.scope.findConnection(tx, connectionId);
    if (!connection) {
      requireTenantId();
      throw this.notAvailable();
    }
    return this.requireManagedPharmacy(tx, connection.pharmacyId, actor);
  }
}
