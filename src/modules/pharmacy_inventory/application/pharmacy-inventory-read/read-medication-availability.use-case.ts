import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { marketplaceTenantScope } from '../../../../common';
import type { PharmacyDirectoryPort } from '../ports/pharmacy-directory.port';
import { PHARMACY_DIRECTORY_PORT } from '../ports/pharmacy-directory.port';
import type {
  AvailabilityProductDto,
  AvailabilitySiteDto,
  MedicationAvailabilityProductDto,
  MedicationAvailabilityResponseDto,
  MedicationAvailabilitySiteDto,
} from '../../presentation/dto';
import {
  compareAvailability,
  ReadPharmacyInventoryUseCase,
  totalOf,
  type GeoPoint,
} from './read-pharmacy-inventory.use-case';

/** Cuántas sedes sirve la disponibilidad por defecto. */
const DEFAULT_AVAILABILITY_LIMIT = 20;

/**
 * Qué sedes de **toda la red** pueden surtir unos medicamentos del vademécum.
 *
 * Una receta prescribe medicamentos, no productos. Preguntar por un producto
 * representante deja afuera a las demás farmacias: cada producto es de una
 * sola. Acá cada medicamento se resuelve a **todos** los productos vendibles
 * de las farmacias visibles del tenant, y cada sede se evalúa con la regla
 * única de existencias por sede (`siteProductAvailabilitySql`), la misma de la
 * lectura por producto: esa composición se reutiliza, no se repite.
 *
 * Un producto sin `medication_concept_id` no entra al cruce: no hay con qué
 * emparejarlo a la receta.
 *
 * El orden es el de la lectura por producto ({@link compareAvailability}),
 * con la completitud medida en medicamentos: primero las sedes que tienen
 * todos.
 */
@Injectable()
export class ReadMedicationAvailabilityUseCase {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param readInventory - La evaluación por sede de la lectura por producto.
   * @param pharmacyRepo - Cara de lectura del directorio de farmacias.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly readInventory: ReadPharmacyInventoryUseCase,
    @Inject(PHARMACY_DIRECTORY_PORT)
    private readonly pharmacyRepo: PharmacyDirectoryPort,
  ) {}

  /**
   * @param conceptIds - Medicamentos solicitados (deduplicados por el pipe).
   * @param origin - Punto desde el que medir distancia, si la consulta lo trae.
   * @param limit - Tope de sedes servidas.
   */
  async execute(
    conceptIds: readonly string[],
    origin: GeoPoint | undefined,
    limit: number = DEFAULT_AVAILABILITY_LIMIT,
  ): Promise<MedicationAvailabilityResponseDto> {
    const tenantId = marketplaceTenantScope();
    const em = this.em.fork();

    const [pharmacies, found] = await Promise.all([
      this.pharmacyRepo.findVisibleByTenant(em, tenantId),
      // Lo que la farmacia marcó «no tengo» no surte un pedido (P47).
      this.pharmacyRepo.findSellableProductsByMedicationConcepts(
        em,
        conceptIds,
      ),
    ]);
    const visiblePharmacyIds = new Set(
      pharmacies.map((pharmacy) => pharmacy.id),
    );
    const requested = new Set(conceptIds);
    const products = found.filter(
      (product) =>
        visiblePharmacyIds.has(product.pharmacyId) &&
        product.medicationConceptId !== undefined &&
        requested.has(product.medicationConceptId),
    );
    const published = new Set(
      products.map((product) => product.medicationConceptId),
    );
    const unpublished = conceptIds.filter((id) => !published.has(id));
    if (products.length === 0) {
      return {
        requestedMedicationConceptIds: [...conceptIds],
        unpublishedMedicationConceptIds: unpublished,
        items: [],
        count: 0,
      };
    }

    const conceptByProduct = new Map(
      products.map((product) => [product.id, product.medicationConceptId!]),
    );
    const sites = await this.readInventory.siteCandidates(
      em,
      pharmacies,
      products,
      products.map((product) => product.id),
      origin,
    );

    const items = sites
      .map((site) => medicationSiteOf(site, conceptIds, conceptByProduct))
      // Una sede sin ninguno de los medicamentos no es una candidata.
      .filter((item) => item.availableCount > 0)
      .sort(compareAvailability)
      .slice(0, limit);

    return {
      requestedMedicationConceptIds: [...conceptIds],
      unpublishedMedicationConceptIds: unpublished,
      items,
      count: items.length,
    };
  }
}

/**
 * Una sede evaluada por producto, vuelta a evaluar por medicamento: un
 * producto por medicamento (el más barato para el paciente), los
 * medicamentos que le faltan, y el total sobre los elegidos.
 *
 * Exportada porque es pura y el spec la ejercita directo.
 */
export function medicationSiteOf(
  site: AvailabilitySiteDto,
  conceptIds: readonly string[],
  conceptByProduct: ReadonlyMap<string, string>,
): MedicationAvailabilitySiteDto {
  const byConcept = new Map<string, AvailabilityProductDto>();
  for (const product of site.products) {
    const conceptId = conceptByProduct.get(product.productId);
    if (conceptId === undefined) continue;
    const current = byConcept.get(conceptId);
    if (current === undefined || compareOffers(product, current) < 0) {
      byConcept.set(conceptId, product);
    }
  }

  const products: MedicationAvailabilityProductDto[] = conceptIds.flatMap(
    (medicationConceptId) => {
      const product = byConcept.get(medicationConceptId);
      return product ? [{ ...product, medicationConceptId }] : [];
    },
  );
  const missing = conceptIds.filter((id) => !byConcept.has(id));
  const { totalAmount, currency } = totalOf(products);
  const {
    missingProductIds: _byProduct,
    products: _allProducts,
    ...rest
  } = site;

  return {
    ...rest,
    complete: missing.length === 0,
    availableCount: products.length,
    missingMedicationConceptIds: missing,
    totalAmount,
    currency,
    products,
  };
}

/**
 * Entre dos productos del mismo medicamento en la misma sede: primero el que
 * tiene precio, y entre ellos el más barato para el paciente; a igualdad, por
 * código y después por id, para que la elección no dependa del orden de la
 * base.
 */
function compareOffers(
  a: AvailabilityProductDto,
  b: AvailabilityProductDto,
): number {
  const amountA = amountOf(a);
  const amountB = amountOf(b);
  if (amountA !== amountB) {
    if (amountA === null) return 1;
    if (amountB === null) return -1;
    return amountA - amountB;
  }
  return (
    a.productCode.localeCompare(b.productCode) ||
    a.productId.localeCompare(b.productId)
  );
}

/** Lo que paga el paciente por el producto, o `null` sin precio legible. */
function amountOf(product: AvailabilityProductDto): number | null {
  const raw = product.price?.patientAmount ?? product.price?.unitAmount;
  if (raw === undefined || raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
