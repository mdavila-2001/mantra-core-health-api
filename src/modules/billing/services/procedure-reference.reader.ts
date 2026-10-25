import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BO_FEE_PROPERTY_CODES } from '../../../common/seed/bolivia-fee-schedule.catalog';

/** Unidades en que el arancel expresa el precio de referencia. */
export type ProcedureReferenceUnit = 'UMA' | 'USD';

/** Precio de referencia del nomenclador para un procedimiento. */
export interface ProcedureReference {
  /** Precio de referencia, o `null` si el arancel no lo publica. */
  referencePrice: number | null;
  /** Unidad del precio, o `null` si el arancel no la publica. */
  referenceUnit: ProcedureReferenceUnit | null;
}

/**
 * Lee el precio de referencia del nomenclador (`VS_BO_MEDICAL_PROCEDURE`) de un
 * lote de procedimientos.
 *
 * Lo comparten el catálogo del centro (CM-02) y la búsqueda de centros: los dos
 * muestran la referencia al lado del precio propio. No guarda estado —recibe el
 * `em` en cada llamada—, así que se registra por clase donde haga falta, sin
 * importar `BillingModule`.
 *
 * No convierte la UMA a moneda: el factor no está declarado en el producto y
 * inventarlo pondría un número en el precio que ve el paciente.
 */
@Injectable()
export class ProcedureReferenceReader {
  /**
   * Resuelve la referencia de cada procedimiento pedido, en una sola consulta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conceptIds - Procedimientos del nomenclador; los repetidos se leen una vez.
   * @returns Mapa de concepto a referencia. Un concepto sin propiedades queda con `null` en ambos campos.
   */
  async referencesFor(
    em: EntityManager,
    conceptIds: readonly string[],
  ): Promise<Map<string, ProcedureReference>> {
    const unique = [...new Set(conceptIds)];
    const references = new Map<string, ProcedureReference>(
      unique.map((id) => [id, { referencePrice: null, referenceUnit: null }]),
    );
    if (unique.length === 0) return references;

    const markers = unique.map(() => '?').join(', ');
    const rows = await em
      .getConnection()
      .execute<
        { concept_id: string; property_code: string; valor: string | null }[]
      >(
        `SELECT p.concept_id, p.property_code, p.value_json #>> '{}' AS valor
           FROM terminology.concept_properties p
          WHERE p.property_code IN (?, ?)
            AND p.concept_id IN (${markers})`,
        [BO_FEE_PROPERTY_CODES.precio, BO_FEE_PROPERTY_CODES.unidad, ...unique],
      );

    for (const row of rows) {
      const reference = references.get(row.concept_id);
      if (!reference || row.valor === null) continue;
      if (row.property_code === BO_FEE_PROPERTY_CODES.precio) {
        const price = Number(row.valor);
        reference.referencePrice = Number.isFinite(price) ? price : null;
      } else if (row.valor === 'UMA' || row.valor === 'USD') {
        reference.referenceUnit = row.valor;
      }
    }
    return references;
  }
}
