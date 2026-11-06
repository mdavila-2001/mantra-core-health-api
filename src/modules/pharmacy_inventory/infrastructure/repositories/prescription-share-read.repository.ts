import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacyProducts } from '../../../pharmacy/entities';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';

/** Un producto del catálogo de la farmacia que surte un fármaco recetado. */
export interface PrescribedProductRow {
  readonly id: string;
  readonly pharmacyId: string;
  readonly medicationConceptId: string;
  readonly productCode: string;
  readonly brandName: string | null;
  readonly genericName: string | null;
  readonly strengthText: string | null;
  readonly requiresPrescription: boolean;
  /**
   * La farmacia lo marcó «no tengo» para todas sus sedes (P47): ninguna sede
   * lo ofrece, diga lo que diga el libro.
   */
  readonly outOfStockDeclared: boolean;
}

/**
 * Lecturas propias de la pantalla «Abrir receta» de la farmacia (FAR-02).
 *
 * `PharmacyDirectoryPort` busca productos por id, no por fármaco (R-02-3):
 * este repositorio cruza la receta con el catálogo por
 * `medication_concept_id`, siempre acotado a las farmacias del tenant que la
 * abre.
 */
@Injectable()
export class PrescriptionShareReadRepository {
  /**
   * Productos publicados de esas farmacias cuyo fármaco está en la receta.
   *
   * Incluye los marcados «no tengo» (`out_of_stock_declared`): la pantalla
   * tiene que poder decir que el producto está en el catálogo pero marcado sin
   * stock, en vez de callarlo como si no existiera. Un borrador o un producto
   * retirado no se ofrece y no sale.
   *
   * @param em - Contexto de persistencia de la lectura.
   * @param pharmacyIds - Farmacias del tenant que abre la receta.
   * @param conceptIds - Fármacos (`medication_concept_id`) de la receta.
   * @returns Los productos, ordenados por farmacia y nombre.
   */
  async findActiveProductsByMedicationConcepts(
    em: EntityManager,
    pharmacyIds: readonly string[],
    conceptIds: readonly string[],
  ): Promise<PrescribedProductRow[]> {
    if (pharmacyIds.length === 0 || conceptIds.length === 0) return [];
    const rows = await em.find(
      PharmacyProducts,
      {
        pharmacyId: { $in: [...pharmacyIds] },
        medicationConceptId: { $in: [...conceptIds] },
        statusConceptId: PHARM.PRODUCT_ACTIVE,
      },
      {
        orderBy: {
          pharmacyId: 'ASC',
          brandName: 'ASC',
          genericName: 'ASC',
          productCode: 'ASC',
        },
      },
    );
    return rows
      .filter(
        (row): row is PharmacyProducts & { medicationConceptId: string } =>
          typeof row.medicationConceptId === 'string',
      )
      .map((row) => ({
        id: row.id,
        pharmacyId: row.pharmacyId,
        medicationConceptId: row.medicationConceptId,
        productCode: row.productCode,
        brandName: row.brandName ?? null,
        genericName: row.genericName ?? null,
        strengthText: row.strengthText ?? null,
        requiresPrescription: row.requiresPrescription === true,
        outOfStockDeclared: row.outOfStockDeclared === true,
      }));
  }
}
