import { MODULE_CONCEPT_SEEDS } from '../../../../common/seed/module-concepts';
import { documentLast3, maskedName } from '../../domain/masked-patient';
import {
  isComparableUnit,
  remainingQuantity,
  sumQuantities,
} from '../../domain/prescription-balance';
import type { PrescribedProductRow } from '../../infrastructure/repositories/prescription-share-read.repository';
import type { PatientIdentitySnapshot } from '../ports/patient-identity.port';
import type { PharmacySiteSnapshot } from '../ports/pharmacy-directory.port';
import type {
  SharedPrescriptionItemSnapshot,
  SharedPrescriptionSnapshot,
} from '../ports/pharmacy-prescription-shares.port';
import type {
  PharmacyPrescriptionItemDto,
  PharmacyPrescriptionMatchDto,
  PharmacyPrescriptionPatientDto,
  PharmacyPrescriptionShareDto,
} from '../../presentation/dto/pharmacy-prescription-share.dto';

/**
 * El código declarado de cada concepto de módulo, por la clave con que lo
 * guarda el catálogo (`clinical:MEDICATION_UNIT_BOTTLE` → `UNIT_{bottle}`,
 * `catalog-concept-definitions.ts`). La respuesta no expone la clave interna.
 */
const DECLARED_CODE_BY_KEY: ReadonlyMap<string, string> = new Map(
  MODULE_CONCEPT_SEEDS.map((seed) => [seed.key, seed.code]),
);

/** El código público de un concepto: el declarado si es de módulo; si no, el guardado. */
function publicCodeOf(concept: ViewConcept | undefined): string | null {
  if (concept === undefined) return null;
  return DECLARED_CODE_BY_KEY.get(concept.code) ?? concept.code;
}

/** La unidad como la nombra UCUM (`{bottle}`), sin el prefijo del catálogo. */
function unitCodeOf(concept: ViewConcept | undefined): string | null {
  return publicCodeOf(concept)?.replace(/^UNIT_/, '') ?? null;
}

/** Un concepto del vademécum o de la terminología, ya leído. */
export interface ViewConcept {
  readonly code: string;
  readonly display: string;
}

/** El precio de un producto en la lista pública general de su farmacia. */
export interface ViewPrice {
  readonly amount: string;
  readonly currencyConceptId: string | null;
}

/** Todo lo leído para armar la respuesta, ya acotado al tenant. */
export interface PrescriptionShareViewInput {
  readonly share: SharedPrescriptionSnapshot;
  readonly patient: PatientIdentitySnapshot | null;
  readonly products: readonly PrescribedProductRow[];
  /** Sedes activas de las farmacias de los productos. */
  readonly sites: readonly PharmacySiteSnapshot[];
  /**
   * Por sede y producto, la cantidad disponible según la regla única: la
   * entrada existe solo si está disponible; `null` si no lleva conteo.
   */
  readonly availableBySite: ReadonlyMap<
    string,
    ReadonlyMap<string, number | null>
  >;
  /** Por `stockKey(sede, producto)`, la posición disponible más vieja. */
  readonly stockUpdatedAt: ReadonlyMap<string, Date>;
  /** Por producto, su precio en la lista general de la farmacia. */
  readonly priceByProduct: ReadonlyMap<string, ViewPrice>;
  readonly conceptById: ReadonlyMap<string, ViewConcept>;
  /** Por fármaco, lo entregado en mostrador de los ítems de la receta. */
  readonly dispensedByConcept: ReadonlyMap<string, number>;
  /** Por fármaco, lo reservado en pedidos vivos de los ítems de la receta. */
  readonly reservedByConcept: ReadonlyMap<string, number>;
}

/** Clave de una (sede, producto) en los mapas de la vista. */
export function stockKey(siteId: string, productId: string): string {
  return `${siteId}:${productId}`;
}

/** Lo recetado de un fármaco, sumando sus ítems (como el guard de FAR-03). */
export interface PrescribedDrugTotal {
  /** La unidad común de sus ítems, o `null` si difieren o no la fijan. */
  readonly unitConceptId: string | null;
  /** La suma, o `null` si algún ítem no fija cantidad. */
  readonly quantity: number | null;
}

/**
 * Lo recetado por fármaco. Un fármaco recetado dos veces en la receta (una
 * renovación del mismo encuentro) suma las dos cantidades y solo se controla
 * si ambas usan la misma unidad: la misma regla con la que el pedido valida
 * (`prescription-order-guard.ts`), para que la pantalla y el pedido digan lo
 * mismo.
 */
export function prescribedByDrug(
  items: readonly SharedPrescriptionItemSnapshot[],
): Map<string, PrescribedDrugTotal> {
  const groups = new Map<string, SharedPrescriptionItemSnapshot[]>();
  for (const item of items) {
    groups.set(item.medicationConceptId, [
      ...(groups.get(item.medicationConceptId) ?? []),
      item,
    ]);
  }
  const totals = new Map<string, PrescribedDrugTotal>();
  for (const [conceptId, group] of groups) {
    const units = new Set(group.map((item) => item.unitConceptId));
    totals.set(conceptId, {
      unitConceptId: units.size === 1 ? [...units][0] : null,
      quantity: group.some((item) => item.quantity === null)
        ? null
        : // Suma exacta, como el pedido: `0.1 + 0.2` da `0.3`.
          sumQuantities(group.map((item) => item.quantity ?? 0)),
    });
  }
  return totals;
}

/** Los fármacos cuyo saldo se puede controlar (D-5): los demás no se consultan. */
export function controlledConceptIds(
  totals: ReadonlyMap<string, PrescribedDrugTotal>,
): string[] {
  return [...totals]
    .filter(
      ([, total]) =>
        total.quantity !== null && isComparableUnit(total.unitConceptId),
    )
    .map(([conceptId]) => conceptId);
}

/** Del paciente, solo lo enmascarado: ninguna otra clave (S-4). */
export function maskedPatient(
  identity: PatientIdentitySnapshot | null,
): PharmacyPrescriptionPatientDto {
  if (!identity) return { maskedName: null, documentLast3: null };
  return {
    maskedName: maskedName(identity),
    documentLast3: documentLast3(identity.nationalDocument),
  };
}

/** El nombre con que se muestra un producto: marca, genérico o código. */
function productName(product: PrescribedProductRow): string {
  const brand = product.brandName?.trim();
  const generic = product.genericName?.trim();
  const base = brand || generic || product.productCode;
  const strength = product.strengthText?.trim();
  return strength ? `${base} ${strength}` : base;
}

/** Dosis y frecuencia en una línea, o `null` si la receta no dice ninguna. */
function dosageTextOf(item: SharedPrescriptionItemSnapshot): string | null {
  const parts = [item.doseText, item.frequencyText]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** Un producto con sus sedes, en el orden en que llegan las sedes (por nombre). */
function toMatch(
  product: PrescribedProductRow,
  input: PrescriptionShareViewInput,
): PharmacyPrescriptionMatchDto {
  const price = input.priceByProduct.get(product.id);
  const currency = price?.currencyConceptId
    ? input.conceptById.get(price.currencyConceptId)
    : undefined;
  return {
    pharmacyId: product.pharmacyId,
    pharmacyProductId: product.id,
    name: productName(product),
    price: price?.amount ?? null,
    currencyCode: publicCodeOf(currency),
    requiresPrescription: product.requiresPrescription,
    outOfStockDeclared: product.outOfStockDeclared,
    sites: input.sites
      .filter((site) => site.pharmacyId === product.pharmacyId)
      .map((site) => {
        const perProduct = input.availableBySite.get(site.id);
        const available = perProduct?.has(product.id) === true;
        return {
          siteId: site.id,
          siteName: site.name,
          available,
          quantity: available ? (perProduct?.get(product.id) ?? null) : 0,
          stockUpdatedAt: available
            ? (input.stockUpdatedAt
                .get(stockKey(site.id, product.id))
                ?.toISOString() ?? null)
            : null,
        };
      }),
  };
}

/**
 * Un ítem de la receta, con su saldo y sus productos.
 *
 * El saldo es **del fármaco** en la receta, no del ítem: es lo que valida el
 * pedido (`prescription-order-guard.ts`). Para que la pantalla no diga
 * «quedan 4 de 2», un fármaco con control de cantidad expresa sus tres
 * cantidades a nivel fármaco: `prescribedQuantity` es el total recetado del
 * fármaco (la suma de sus ítems, si lo recetaron dos veces), y
 * `dispensedQuantity` y `remainingQuantity` son los del fármaco. Con un solo
 * ítem por fármaco, eso es lo mismo que el ítem. Sin control de cantidad
 * (D-5), `prescribedQuantity` es la del ítem y las otras dos son `null`: no se
 * consultaron.
 */
function toItem(
  item: SharedPrescriptionItemSnapshot,
  totals: ReadonlyMap<string, PrescribedDrugTotal>,
  input: PrescriptionShareViewInput,
): PharmacyPrescriptionItemDto {
  const total = totals.get(item.medicationConceptId);
  // La misma condición con la que se decide consultar el saldo
  // (`controlledConceptIds`): sin consulta no se afirma «nada entregado».
  const controlled =
    total !== undefined &&
    total.quantity !== null &&
    isComparableUnit(total.unitConceptId);
  const dispensed = input.dispensedByConcept.get(item.medicationConceptId) ?? 0;
  const reserved = input.reservedByConcept.get(item.medicationConceptId) ?? 0;
  return {
    medicationRequestId: item.id,
    medicationConceptId: item.medicationConceptId,
    display: input.conceptById.get(item.medicationConceptId)?.display ?? null,
    dosageText: dosageTextOf(item),
    prescribedQuantity: controlled ? total.quantity : item.quantity,
    unitCode: item.unitConceptId
      ? unitCodeOf(input.conceptById.get(item.unitConceptId))
      : null,
    dispensedQuantity: controlled ? dispensed : null,
    remainingQuantity: controlled
      ? remainingQuantity(
          { prescribed: total.quantity, dispensed, reserved },
          total.unitConceptId,
        )
      : null,
    matches: input.products
      .filter(
        (product) => product.medicationConceptId === item.medicationConceptId,
      )
      .map((product) => toMatch(product, input)),
  };
}

/**
 * La respuesta de `GET /pharmacy/prescription-shares/:token` (§2), a partir de
 * lo ya leído. Pura: no decide alcance, solo compone.
 */
export function composePrescriptionShareView(
  input: PrescriptionShareViewInput,
): PharmacyPrescriptionShareDto {
  const { share } = input;
  const totals = prescribedByDrug(share.items);
  return {
    shareId: share.shareId,
    issuedAt: share.issuedAt?.toISOString() ?? null,
    validTo: share.validTo?.toISOString() ?? null,
    prescriber: {
      name: share.prescriber.name,
      license: share.prescriber.license
        ? {
            number: share.prescriber.license.number,
            authority: share.prescriber.license.authority,
            state: share.prescriber.license.state,
          }
        : null,
    },
    patient: maskedPatient(input.patient),
    items: share.items.map((item) => toItem(item, totals, input)),
  };
}
