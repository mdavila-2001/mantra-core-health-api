import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  requireTenantId,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import type { CatalogConcepts } from '../../terminology/entities';
import { TenantAdministrationService } from '../../directory/services/tenant-administration.service';
import { DirectoryReadService } from '../../directory/services/directory-read.service';
import { PharmacyProducts } from '../entities';
import type { Pharmacies, PharmacyLicenses, PharmacySites } from '../entities';
import {
  catalogStatusOf,
  fromCents,
  isInStock,
  isLowStock,
  toCents,
} from './pharmacy-catalog-rules';
import { displayName, PharmacyReadService } from './pharmacy-read.service';
import type {
  PharmacyConceptDto,
  PharmacyContactPersonDto,
  PharmacyContactsResponseDto,
  PharmacyLicenseDto,
  PharmacyLicenseListResponseDto,
  PharmacyProductSearchResponseDto,
  PharmacyRecentActivityDto,
  PharmacySummaryDto,
} from '../dto';
import {
  PharmacyCatalogRepository,
  PharmacyReadRepository,
  type CatalogAuditRow,
  type ProductSearchFilter,
} from '../repositories';

/** Cuántas actividades recientes muestra el resumen. */
const RECENT_ACTIVITY_LIMIT = 8;

/** Un día en milisegundos, para contar días de calendario. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Lo que de una farmacia sólo ve **su propio personal**: la carpeta de
 * licencias (`pharmacy.pharmacy_licenses`) y quién representa y gestiona la
 * organización dueña (`directory.tenant_legal_representatives`).
 *
 * ## Alcance
 *
 * La farmacia se busca en el tenant activo **publicada o no** —el personal de
 * una farmacia que espera verificación necesita justamente su carpeta—, y el
 * actor tiene que pertenecer a la organización dueña (membresía activa) o ser
 * de la plataforma: el mismo `assertCanRead` que protege la ficha de la
 * organización. Todo lo demás —otro tenant, un id inexistente, alguien que no
 * es de la organización— recibe el mismo 404: distinguirlos ya confirmaría que
 * ese uuid es una farmacia.
 */
@Injectable()
export class PharmacyStaffReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param readRepo - Consultas de la cara de lectura.
   * @param tenantAdmin - Comprobación de pertenencia a la organización.
   * @param directoryRead - Lectura del representante y las gerencias.
   * @param catalogRepo - Precio, categorías y bitácora del catálogo (P47).
   * @param readService - Proyección del producto como lo lista la búsqueda.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly readRepo: PharmacyReadRepository,
    private readonly tenantAdmin: TenantAdministrationService,
    private readonly directoryRead: DirectoryReadService,
    private readonly catalogRepo: PharmacyCatalogRepository,
    private readonly readService: PharmacyReadService,
  ) {}

  /**
   * P47 `managed=true`: todo el catálogo de la farmacia —borradores y
   * retirados incluidos— con estado, existencias, umbral e imágenes. Sólo para
   * su personal (o la plataforma); cualquier otro recibe el 404 de siempre.
   *
   * @param pharmacyId - La farmacia.
   * @param filter - Texto y medicamento del vademécum.
   * @param limit - Tope del listado.
   * @param actor - Quien pide la lectura.
   */
  async listManagedProducts(
    pharmacyId: string,
    filter: ProductSearchFilter,
    limit: number,
    actor: AuthenticatedUser,
  ): Promise<PharmacyProductSearchResponseDto> {
    const em = this.em.fork();
    const pharmacy = await this.requireStaffPharmacy(em, pharmacyId, actor);
    const rows = await this.readRepo.findCatalogProducts(
      em,
      pharmacy.id,
      filter,
      limit + 1,
    );
    const page = rows.slice(0, limit);
    return {
      items: await this.readService.toCatalogDtos(
        em,
        page,
        new Map([[pharmacy.id, displayName(pharmacy)]]),
        true,
      ),
      limit,
      truncated: rows.length > limit,
    };
  }

  /**
   * La carpeta de licencias de la farmacia, de la farmacia entera y de cada
   * sede, con los días hasta el vencimiento ya contados.
   *
   * @param pharmacyId - La farmacia.
   * @param actor - Quien pide la lectura.
   */
  async listLicenses(
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyLicenseListResponseDto> {
    const em = this.em.fork();
    const pharmacy = await this.requireStaffPharmacy(em, pharmacyId, actor);

    const licenses = await this.readRepo.findLicenses(em, pharmacy.id);
    if (licenses.length === 0) return { items: [], count: 0 };

    const [sites, concepts] = await Promise.all([
      this.readRepo.findSitesByIds(
        em,
        unique(
          licenses
            .map((license) => license.pharmacySiteId)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
      this.readRepo.findConcepts(
        em,
        unique(
          licenses
            .flatMap((license) => [
              license.licenseTypeConceptId,
              license.jurisdictionConceptId,
              license.verificationStatusConceptId,
            ])
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    ]);
    const siteById = new Map(sites.map((site) => [site.id, site]));
    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );
    const now = new Date();

    const items = licenses.map((license) =>
      toLicenseDto(license, siteById, conceptById, now),
    );
    return { items, count: items.length };
  }

  /**
   * El representante legal y las gerencias de la organización dueña de la
   * farmacia. Sale de la misma lectura que `GET /tenants/me`, sin el
   * documento de identidad.
   *
   * @param pharmacyId - La farmacia.
   * @param actor - Quien pide la lectura.
   */
  async getContacts(
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyContactsResponseDto> {
    const em = this.em.fork();
    const pharmacy = await this.requireStaffPharmacy(em, pharmacyId, actor);

    const representation = await this.directoryRead.readRepresentation(
      pharmacy.tenantId,
    );
    return {
      legalRepresentative: representation.legalRepresentative
        ? toContactPerson(representation.legalRepresentative)
        : null,
      executives: (representation.executives ?? []).map(toContactPerson),
    };
  }

  /**
   * Los números del resumen del portal (P47), contados sobre el catálogo:
   *
   * - publicados, borradores y retirados por estado;
   * - sin stock y bajo umbral entre lo publicado, con la declaración de
   *   existencias (umbral por defecto 5 mientras la farmacia no fija el suyo);
   * - valor del inventario = Σ existencias × precio vigente de lo publicado que
   *   lleva conteo y tiene precio, en centavos enteros (nunca coma flotante);
   * - por categoría, los vivos (publicados y borradores);
   * - actividad reciente: lo último que `@Audited` selló con éxito en el
   *   catálogo de este tenant.
   *
   * @param pharmacyId - La farmacia.
   * @param actor - Quien pide la lectura.
   */
  async getSummary(
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacySummaryDto> {
    const em = this.em.fork();
    const pharmacy = await this.requireStaffPharmacy(em, pharmacyId, actor);
    const products = await em.find(PharmacyProducts, {
      pharmacyId: pharmacy.id,
    });
    const status = (product: PharmacyProducts) =>
      catalogStatusOf(product.statusConceptId);
    const published = products.filter((p) => status(p) === 'PUBLISHED');
    const live = products.filter((p) => status(p) !== 'WITHDRAWN');
    const stockOf = (p: PharmacyProducts) => ({
      stockQuantity: p.stockQuantity,
      minStockQuantity: p.minStockQuantity,
      outOfStockDeclared: p.outOfStockDeclared ?? false,
    });

    const [prices, categories, activity] = await Promise.all([
      this.catalogRepo.findCurrentPrices(
        em,
        published.map((p) => p.id),
      ),
      this.catalogRepo.listCategories(em, pharmacy.id),
      this.catalogRepo.findRecentActivity(
        em,
        pharmacy.tenantId,
        RECENT_ACTIVITY_LIMIT,
      ),
    ]);

    let valueCents = 0n;
    for (const product of published) {
      const price = prices.get(product.id);
      if (!price || !isInStock(stockOf(product))) continue;
      if (product.stockQuantity == null) continue;
      valueCents += toCents(price.amount) * BigInt(product.stockQuantity);
    }

    const categoryName = new Map(categories.map((c) => [c.id, c.name]));
    const byCategory = new Map<string, number>();
    for (const product of live) {
      const name =
        (product.pharmacyProductCategoryId &&
          categoryName.get(product.pharmacyProductCategoryId)) ||
        'Sin categoría';
      byCategory.set(name, (byCategory.get(name) ?? 0) + 1);
    }

    return {
      published: published.length,
      drafts: live.length - published.length,
      withdrawn: products.length - live.length,
      outOfStock: published.filter((p) => !isInStock(stockOf(p))).length,
      lowStock: published.filter((p) => isLowStock(stockOf(p))).length,
      inventoryValue: fromCents(valueCents),
      byCategory: [...byCategory.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
        .map(([category, count]) => ({ category, count })),
      recentActivity: describeActivity(activity, products, categoryName),
    };
  }

  /**
   * La farmacia del tenant activo, sólo si el actor es de su organización (o
   * de la plataforma). Cualquier otro caso es el mismo 404.
   */
  private async requireStaffPharmacy(
    em: EntityManager,
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<Pharmacies> {
    const tenantId = requireTenantId();
    const pharmacy = await this.readRepo.findByIdInTenant(
      em,
      tenantId,
      pharmacyId,
    );
    if (!pharmacy) throw pharmacyNotFound(pharmacyId);
    try {
      await this.tenantAdmin.assertCanRead(em, pharmacy.tenantId, actor);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw pharmacyNotFound(pharmacyId);
      }
      throw error;
    }
    return pharmacy;
  }
}

/** El 404 único de esta cara de lectura. */
function pharmacyNotFound(pharmacyId: string): ResourceNotFoundException {
  return new ResourceNotFoundException('Farmacia no encontrada', {
    pharmacyId,
  });
}

/**
 * Proyecta una licencia.
 *
 * @param license - Fila leída.
 * @param siteById - Sedes de la farmacia ya resueltas.
 * @param conceptById - Conceptos ya resueltos.
 * @param now - Instante de referencia para contar los días.
 */
export function toLicenseDto(
  license: PharmacyLicenses,
  siteById: ReadonlyMap<string, PharmacySites>,
  conceptById: ReadonlyMap<string, CatalogConcepts>,
  now: Date,
): PharmacyLicenseDto {
  const site = license.pharmacySiteId
    ? siteById.get(license.pharmacySiteId)
    : undefined;
  return {
    id: license.id,
    type: optionalConcept(conceptById, license.licenseTypeConceptId),
    number: license.licenseNumber,
    siteId: license.pharmacySiteId ?? null,
    siteName: site?.name ?? null,
    jurisdiction: optionalConcept(conceptById, license.jurisdictionConceptId),
    validFrom: dateOnly(license.validFrom),
    validTo: dateOnly(license.validTo),
    daysToExpiry: daysUntil(license.validTo, now),
    verificationStatus: optionalConcept(
      conceptById,
      license.verificationStatusConceptId,
    ),
    evidenceFileId: license.evidenceFileId ?? null,
  };
}

/**
 * Días de calendario entre hoy y la fecha, comparados a medianoche UTC: algo
 * que vence hoy da `0`, no `-1` por unas horas. Mismo criterio que el legajo
 * de las unidades diagnósticas (`diagnostic-units-admin-read.service.ts`).
 */
export function daysUntil(
  value: Date | null | undefined,
  now: Date,
): number | null {
  if (!value) return null;
  const target = Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
  );
  const reference = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.round((target - reference) / ONE_DAY_MS);
}

/** Una columna `date` como `AAAA-MM-DD`, o `null`. */
function dateOnly(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

/** Una persona de contacto, sin su documento de identidad. */
function toContactPerson(person: {
  readonly role: string;
  readonly fullName: string;
  readonly email?: string;
  readonly phone?: string;
}): PharmacyContactPersonDto {
  return {
    role: person.role,
    fullName: person.fullName,
    email: person.email ?? null,
    phone: person.phone ?? null,
  };
}

function optionalConcept(
  concepts: ReadonlyMap<string, CatalogConcepts>,
  id: string | null | undefined,
): PharmacyConceptDto | null {
  const value = id ? concepts.get(id) : undefined;
  return value ? { code: value.code, display: value.display } : null;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/** Cómo se cuenta cada acción de la bitácora en el resumen. */
const ACTIVITY_KIND: Readonly<Record<string, string>> = {
  PHARMACY_PRODUCT_PUBLISHED: 'ALTA',
  PHARMACY_PRODUCT_UPDATED: 'EDICION',
  PHARMACY_PRODUCT_RETIRED: 'RETIRO',
  PHARMACY_INVENTORY_UPDATED: 'INVENTARIO',
  PHARMACY_CATEGORY_CREATED: 'CATEGORIA',
  PHARMACY_CATEGORY_RENAMED: 'CATEGORIA',
  PHARMACY_CATEGORY_DELETED: 'CATEGORIA',
};

/**
 * La actividad reciente en palabras, con el nombre actual del producto o de la
 * categoría. Lo que ya no existe (una categoría eliminada) se nombra en
 * genérico: la bitácora guarda el id, no el nombre.
 */
export function describeActivity(
  rows: readonly CatalogAuditRow[],
  products: readonly PharmacyProducts[],
  categoryName: ReadonlyMap<string, string>,
): PharmacyRecentActivityDto[] {
  const productName = new Map(
    products.map((p) => [p.id, p.brandName ?? p.genericName ?? p.productCode]),
  );
  return rows.map((row) => {
    const product = row.entityId ? productName.get(row.entityId) : undefined;
    const category = row.entityId ? categoryName.get(row.entityId) : undefined;
    const quoted = (name: string | undefined, fallback: string) =>
      name ? `«${name}»` : fallback;
    const text: Record<string, string> = {
      PHARMACY_PRODUCT_PUBLISHED: `Cargó ${quoted(product, 'un producto')}.`,
      PHARMACY_PRODUCT_UPDATED: `Editó ${quoted(product, 'un producto')}.`,
      PHARMACY_PRODUCT_RETIRED: `Retiró ${quoted(product, 'un producto')}.`,
      PHARMACY_INVENTORY_UPDATED: 'Actualizó el inventario.',
      PHARMACY_CATEGORY_CREATED: `Creó la categoría ${quoted(category, 'una categoría')}.`,
      PHARMACY_CATEGORY_RENAMED: `Renombró la categoría ${quoted(category, 'una categoría')}.`,
      PHARMACY_CATEGORY_DELETED: 'Eliminó una categoría.',
    };
    return {
      id: row.id,
      at: row.recordedAt.toISOString(),
      kind: ACTIVITY_KIND[row.action] ?? 'EDICION',
      text: text[row.action] ?? 'Cambió el catálogo.',
    };
  });
}
