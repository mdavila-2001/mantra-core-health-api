import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException, requireTenantId } from '../../../../common';
import { InventoryReadRepository } from '../../infrastructure/repositories';
import { PrescriptionBalanceRepository } from '../../infrastructure/repositories/prescription-balance.repository';
import { PrescriptionShareReadRepository } from '../../infrastructure/repositories/prescription-share-read.repository';
import { isRetailList } from '../../domain/pricing/is-retail-list';
import {
  payableAmount,
  winningPriceFor,
} from '../../domain/pricing/pharmacy-pricing';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import {
  PATIENT_IDENTITY_PORT,
  type PatientIdentityPort,
} from '../ports/patient-identity.port';
import {
  PHARMACY_DIRECTORY_PORT,
  type PharmacyDirectoryPort,
} from '../ports/pharmacy-directory.port';
import {
  PHARMACY_PRESCRIPTION_SHARES_PORT,
  type PharmacyPrescriptionSharesPort,
  type PrescriptionShareOpenContext,
  type SharedPrescriptionSnapshot,
} from '../ports/pharmacy-prescription-shares.port';
import {
  PRESCRIPTION_SHARE_ACCESS_LOG_PORT,
  type PrescriptionShareAccessLogPort,
} from '../ports/prescription-share-access-log.port';
import type { UnitOfWork } from '../ports/unit-of-work';
import type { PharmacyPrescriptionShareDto } from '../../presentation/dto/pharmacy-prescription-share.dto';
import {
  composePrescriptionShareView,
  controlledConceptIds,
  prescribedByDrug,
  stockKey,
  type ViewConcept,
  type ViewPrice,
} from './prescription-share-view';

/**
 * FAR-02 · la farmacia abre la receta que el paciente le compartió.
 *
 * El alcance es el tenant de la farmacia (`requireTenantId()`) y, dentro de
 * él, solo sus farmacias **activas y verificadas** (S-4): las mismas que el
 * directorio publica (`PharmacyDirectoryPort.findVisibleByTenant`). Una
 * farmacia en borrador o esperando verificación no abre recetas. Solo se
 * cruzan productos y sedes de esas farmacias, nunca los de otra.
 *
 * Abrir el enlace lo registra el contexto dueño (`delegated_access`): `DENIED`
 * y un 410 si está vencido o revocado, 404 sin uso si el token no existe. El
 * `OPENED` se escribe **después** de armar la respuesta y de dejar el acceso
 * en `audit.data_access_log` (con el paciente y el enlace): si algo de eso
 * falla, no queda una apertura que no se sirvió. Un tenant sin farmacia
 * verificada no llega a abrir nada: 404 sin uso.
 *
 * Del paciente, la respuesta lleva solo iniciales y los últimos 3 dígitos del
 * documento (S-4).
 */
@Injectable()
export class OpenPrescriptionShareUseCase {
  /**
   * @param em - Contexto de persistencia (lecturas en un `fork`).
   * @param shareReadRepo - Productos del catálogo por fármaco.
   * @param inventoryRepo - Regla única de existencias y posiciones de stock.
   * @param balances - Lo entregado y reservado de la receta (FAR-03).
   * @param directory - Farmacias visibles, sedes, precios y conceptos.
   * @param shares - Apertura del enlace (FAR-01).
   * @param patients - Identidad del paciente, para enmascararla.
   * @param accessLog - Registro de acceso con el paciente y el enlace.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly shareReadRepo: PrescriptionShareReadRepository,
    private readonly inventoryRepo: InventoryReadRepository,
    private readonly balances: PrescriptionBalanceRepository,
    @Inject(PHARMACY_DIRECTORY_PORT)
    private readonly directory: PharmacyDirectoryPort,
    @Inject(PHARMACY_PRESCRIPTION_SHARES_PORT)
    private readonly shares: PharmacyPrescriptionSharesPort,
    @Inject(PATIENT_IDENTITY_PORT)
    private readonly patients: PatientIdentityPort,
    @Inject(PRESCRIPTION_SHARE_ACCESS_LOG_PORT)
    private readonly accessLog: PrescriptionShareAccessLogPort,
  ) {}

  /**
   * Abre la receta compartida para las farmacias verificadas del tenant.
   *
   * @param token - Token del enlace, tal como llegó en la ruta.
   * @param actorUserId - Usuario de la farmacia que la abre.
   * @param context - IP y agente de usuario, para el registro de usos.
   * @returns La receta con sus ítems cruzados con el catálogo (§2).
   * @throws ResourceNotFoundException 404 si el tenant no tiene una farmacia
   *   activa y verificada, o si el token no existe (este último lo lanza el
   *   contexto dueño).
   * @throws GoneException 410 si el enlace está vencido o revocado.
   */
  async execute(
    token: string,
    actorUserId: string,
    context: PrescriptionShareOpenContext = {},
  ): Promise<PharmacyPrescriptionShareDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();

    // Antes de abrir: sin farmacia verificada no queda un uso registrado.
    const pharmacies = await this.directory.findVisibleByTenant(em, tenantId);
    if (pharmacies.length === 0) {
      const reason =
        PharmacyInventoryErrorReason.PHARMACY_INVENTORY_RESOURCE_NOT_AVAILABLE;
      throw new ResourceNotFoundException(
        'Esta organización no tiene una farmacia verificada.',
        { reason },
        reason,
      );
    }
    const pharmacyIds = pharmacies.map((pharmacy) => pharmacy.id);

    return this.shares.openForPharmacy(token, context, async (share) => {
      const view = await this.compose(em, pharmacyIds, share);
      await this.accessLog.recordPharmacyRead(em, {
        userId: actorUserId,
        tenantId,
        patientProfileId: share.patientProfileId,
        shareId: share.shareId,
      });
      return view;
    });
  }

  /** Todo lo que la farmacia ve de la receta, acotado a sus farmacias. */
  private async compose(
    em: UnitOfWork,
    pharmacyIds: readonly string[],
    share: SharedPrescriptionSnapshot,
  ): Promise<PharmacyPrescriptionShareDto> {
    const conceptIds = unique(
      share.items.map((item) => item.medicationConceptId),
    );
    const now = new Date();

    const products =
      await this.shareReadRepo.findActiveProductsByMedicationConcepts(
        em,
        pharmacyIds,
        conceptIds,
      );
    const ownerIds = unique(products.map((product) => product.pharmacyId));
    const productIds = products.map((product) => product.id);
    const sites = await this.directory.findActiveSites(em, ownerIds);
    const siteIds = sites.map((site) => site.id);

    const availableBySite = await this.availability(em, siteIds, productIds);
    const stockUpdatedAt = await this.stockUpdates(em, siteIds, productIds);
    const prices = await this.generalPrices(em, ownerIds, productIds, now);
    const { dispensed, reserved } = await this.balanceOf(em, share.items);
    const patient = await this.patients.findByPatientProfile(
      em,
      share.patientProfileId,
    );
    const conceptById = await this.concepts(em, [
      ...conceptIds,
      ...share.items
        .map((item) => item.unitConceptId)
        .filter((id): id is string => Boolean(id)),
      ...[...prices.values()]
        .map((price) => price.currencyConceptId)
        .filter((id): id is string => Boolean(id)),
    ]);

    return composePrescriptionShareView({
      share,
      patient,
      products,
      sites,
      availableBySite,
      stockUpdatedAt,
      priceByProduct: prices,
      conceptById,
      dispensedByConcept: dispensed,
      reservedByConcept: reserved,
    });
  }

  /** Por sede y producto, lo disponible según la regla única (S-8). */
  private async availability(
    em: UnitOfWork,
    siteIds: readonly string[],
    productIds: readonly string[],
  ): Promise<Map<string, Map<string, number | null>>> {
    const rows = await this.inventoryRepo.findSiteProductAvailability(
      em,
      siteIds,
      productIds,
    );
    const bySite = new Map<string, Map<string, number | null>>();
    for (const row of rows) {
      const perProduct =
        bySite.get(row.siteId) ?? new Map<string, number | null>();
      perProduct.set(
        row.productId,
        row.availableQuantity === null ? null : toNumber(row.availableQuantity),
      );
      bySite.set(row.siteId, perProduct);
    }
    return bySite;
  }

  /**
   * Por sede y producto, el `updated_at` más viejo de las posiciones con
   * cantidad disponible: la misma fecha que fecha el stock en «Dónde comprar»,
   * acotada a cada producto. Una sede sin lotes no tiene posiciones y su fecha
   * queda vacía: no se inventa una antigüedad.
   */
  private async stockUpdates(
    em: UnitOfWork,
    siteIds: readonly string[],
    productIds: readonly string[],
  ): Promise<Map<string, Date>> {
    const oldest = new Map<string, Date>();
    if (siteIds.length === 0 || productIds.length === 0) return oldest;
    const locations = await this.inventoryRepo.findActiveLocationsBySites(
      em,
      siteIds,
    );
    const siteByLocation = new Map(
      locations.map((location) => [location.id, location.pharmacySiteId]),
    );
    const positions = await this.inventoryRepo.findStockPositions(
      em,
      locations.map((location) => location.id),
      productIds,
    );
    for (const position of positions) {
      const siteId = siteByLocation.get(position.inventoryLocationId);
      const updatedAt: Date | undefined = position.updatedAt;
      if (
        !siteId ||
        toNumber(position.availableQuantity) <= 0 ||
        !(updatedAt instanceof Date) ||
        Number.isNaN(updatedAt.getTime())
      ) {
        continue;
      }
      const key = stockKey(siteId, position.pharmacyProductId);
      const current = oldest.get(key);
      if (!current || updatedAt < current) oldest.set(key, updatedAt);
    }
    return oldest;
  }

  /**
   * Por producto, lo que paga el paciente en la lista **pública y general**
   * de su farmacia (sin sede), con la misma regla de elección que el
   * comparador y el pedido (`winningPriceFor`). Un producto con precio solo
   * por sede queda sin precio acá: la respuesta tiene un precio por producto,
   * no por sede.
   */
  private async generalPrices(
    em: UnitOfWork,
    pharmacyIds: readonly string[],
    productIds: readonly string[],
    now: Date,
  ): Promise<Map<string, ViewPrice>> {
    const result = new Map<string, ViewPrice>();
    if (pharmacyIds.length === 0 || productIds.length === 0) return result;
    const lists = (
      await this.directory.findCurrentPublicPriceLists(em, pharmacyIds, now)
    ).filter((list) => isRetailList(list) && !list.pharmacySiteId);
    if (lists.length === 0) return result;
    const prices = await this.directory.findCurrentPrices(
      em,
      lists.map((list) => list.id),
      productIds,
      now,
    );
    const listById = new Map(lists.map((list) => [list.id, list]));
    for (const productId of productIds) {
      // Sin sede: solo compiten las listas generales.
      const winner = winningPriceFor(productId, '', prices, listById);
      if (!winner) continue;
      result.set(productId, {
        amount: payableAmount(winner.price),
        currencyConceptId: winner.list.currencyConceptId ?? null,
      });
    }
    return result;
  }

  /**
   * Lo entregado y lo reservado por fármaco de los ítems de la receta, solo de
   * los fármacos con control de cantidad (D-5): el resto ni se consulta.
   */
  private async balanceOf(
    em: UnitOfWork,
    items: Parameters<typeof prescribedByDrug>[0],
  ): Promise<{
    dispensed: Map<string, number>;
    reserved: Map<string, number>;
  }> {
    const controlled = controlledConceptIds(prescribedByDrug(items));
    if (controlled.length === 0) {
      return { dispensed: new Map(), reserved: new Map() };
    }
    // Una sola sentencia: lo entregado y lo reservado salen de la misma foto,
    // y una dispensa que se confirma en medio no descuadra el saldo.
    return this.balances.balanceByConcept(
      em,
      items.map((item) => item.id),
      controlled,
    );
  }

  /** Conceptos por id: fármacos, unidades y monedas. */
  private async concepts(
    em: UnitOfWork,
    ids: readonly string[],
  ): Promise<Map<string, ViewConcept>> {
    const distinct = unique(ids);
    if (distinct.length === 0) return new Map();
    const rows = await this.directory.findConcepts(em, distinct);
    return new Map(
      rows.map((row) => [row.id, { code: row.code, display: row.display }]),
    );
  }
}

/** Un `numeric` de la base (texto) como número; lo ilegible cuenta 0. */
function toNumber(value: string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
