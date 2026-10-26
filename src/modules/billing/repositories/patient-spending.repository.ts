import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

/** Zona de la plataforma: «hoy» y la fecha de emisión se leen en La Paz. */
export const SPENDING_TIME_ZONE = 'America/La_Paz';

/** Lo que el servicio necesita para clasificar y pesar una factura. */
export interface PatientSpendingRow {
  readonly id: string;
  /** Instante del cobro, ya resuelto (ver la consulta). */
  readonly occurredAt: Date | string;
  readonly invoiceNumber: string;
  readonly isCreditNote: boolean;
  readonly hasEncounter: boolean;
  readonly hasProcedure: boolean;
  readonly hasPharmacy: boolean;
  readonly hasImaging: boolean;
  readonly hasLaboratory: boolean;
  readonly firstDescription: string | null;
  readonly providerName: string | null;
  /** Importes en texto decimal exacto con dos decimales (`numeric` de PG). */
  readonly grossAmount: string;
  readonly coveredAmount: string;
  readonly discountAmount: string;
  readonly paidAmount: string;
}

/** Filtros de la lectura, ya validados por el servicio. */
export interface PatientSpendingFilter {
  readonly patientProfileId: string;
  /** `YYYY-MM-DD`, inclusive. */
  readonly from: string;
  /** `YYYY-MM-DD`, inclusive; la consulta lo recorta a hoy. */
  readonly to: string;
  /** Moneda de la respuesta (código ISO 4217). */
  readonly currencyCode: string;
  /** Estados de factura que no son un gasto (borrador). */
  readonly excludedStatusIds: readonly string[];
  /** Estado de la factura origen que pasó a plan de pagos. */
  readonly paymentPlanStatusId: string;
  /** Estado de una nota de crédito. */
  readonly creditNoteStatusId: string;
  /** Modalidad «laboratorio» de las ofertas de estudio. */
  readonly laboratoryModalityId: string;
  /** Filas a leer (el servicio pide una de más para saber si hay más). */
  readonly limit: number;
}

/**
 * Los gastos de salud de un paciente, derivados de **las facturas que se le
 * emitieron** (`billing.invoices`), que es el único lugar donde la plataforma
 * registra lo que se le cobró a una persona: la consulta facturada desde el
 * encuentro, la parte del paciente de un reclamo al seguro (farmacia,
 * laboratorio, imagen) y el cargo de un procedimiento terminan todos ahí.
 * No hay tabla paralela: se lee lo que ya existe.
 *
 * ## Una factura, un movimiento
 *
 * - **Lo que pagó el paciente** (`paidAmount`) es el `total` de la factura: lo
 *   que se le cobró, con impuestos y después de descuentos.
 * - **Lo cubierto** es, por cada línea que factura la parte del paciente de un
 *   reclamo, lo facturado al seguro menos esa parte (`billed_amount −
 *   line_total`, nunca negativo).
 * - **Lo descontado** es el `discount_total` de la factura.
 * - **Lo que costó** se arma como la suma de los tres, así que la identidad
 *   `paid = gross − covered − discount` vale por construcción.
 * - Una factura que pasó a **plan de pagos** sólo pesa lo que se le había
 *   pagado antes del plan (`total − balance`): el saldo lo cargan las cuotas,
 *   que son facturas propias. Sumar las dos contaría el saldo dos veces.
 * - Una **nota de crédito** pesa con su signo (negativo): devuelve parte de
 *   un gasto anterior.
 * - Un **borrador** no es un gasto y no se lee.
 *
 * ## Categoría
 *
 * Sale de con qué está vinculada la factura, en este orden: un cargo de
 * procedimiento, una dispensación o reserva de farmacia del reclamo, una oferta
 * de estudio de imagen, una de laboratorio, un encuentro (consulta). Lo que no
 * tiene ninguno de esos vínculos es «otro gasto de salud»: no se adivina.
 *
 * ## Aislamiento
 *
 * El único filtro de persona es `patient_profile_id`, que el servicio toma del
 * token. Las tablas leídas (`billing.invoices`, sus líneas, los reclamos y los
 * cargos de procedimiento) no tienen RLS por tenant, porque el gasto del
 * paciente cruza organizaciones; el nombre de la práctica sí (`practice.practices`),
 * y por eso se completa con el de la organización que administra su sede.
 */
@Injectable()
export class PatientSpendingRepository {
  /**
   * Las facturas del paciente en el rango, del cobro más reciente al más
   * antiguo, con orden total (`occurred_at`, `id`).
   *
   * @param em - Contexto de persistencia; se usa el de la petición para quedar
   *   dentro de su transacción.
   * @param filter - Paciente, rango y conceptos ya resueltos.
   * @returns Hasta `limit` filas.
   */
  async findForPatient(
    em: EntityManager,
    filter: PatientSpendingFilter,
  ): Promise<PatientSpendingRow[]> {
    const excluded = filter.excludedStatusIds.length
      ? filter.excludedStatusIds
      : ['00000000-0000-0000-0000-000000000000'];
    const sql = `
      WITH inv AS (
        SELECT i.id,
               i.invoice_number,
               i.practice_id,
               i.status_concept_id,
               i.encounter_id,
               COALESCE(i.total, 0)          AS total,
               COALESCE(i.balance, 0)        AS balance,
               COALESCE(i.discount_total, 0) AS discount_total,
               CASE
                 WHEN (i.created_at AT TIME ZONE '${SPENDING_TIME_ZONE}')::date = i.issue_date
                   THEN i.created_at
                 ELSE (i.issue_date + TIME '12:00') AT TIME ZONE '${SPENDING_TIME_ZONE}'
               END AS occurred_at
          FROM billing.invoices i
          LEFT JOIN terminology.catalog_concepts cur ON cur.id = i.currency_concept_id
         WHERE i.patient_profile_id = ?
           AND i.status_concept_id NOT IN (${excluded.map(() => '?').join(', ')})
           AND i.issue_date >= CAST(? AS date)
           AND i.issue_date <= LEAST(
                 CAST(? AS date),
                 (now() AT TIME ZONE '${SPENDING_TIME_ZONE}')::date)
           AND COALESCE(cur.code, ?) = ?
      ),
      facts AS (
        SELECT l.invoice_id,
               SUM(GREATEST(cl.billed_amount - COALESCE(l.line_total, 0), 0))
                 FILTER (WHERE cl.billed_amount IS NOT NULL) AS covered,
               bool_or(EXISTS (
                 SELECT 1 FROM procedures_perioperative.procedure_charge_items pci
                  WHERE pci.invoice_line_id = l.id)) AS has_procedure,
               bool_or(cl.medication_dispensation_line_id IS NOT NULL
                    OR cl.inventory_reservation_line_id IS NOT NULL
                    OR c.inventory_reservation_id IS NOT NULL) AS has_pharmacy,
               bool_or(o.id IS NOT NULL AND o.modality_concept_id IS NOT NULL
                    AND o.modality_concept_id <> ?) AS has_imaging,
               bool_or(o.id IS NOT NULL AND (o.modality_concept_id IS NULL
                    OR o.modality_concept_id = ?)) AS has_laboratory,
               (array_agg(btrim(l.description) ORDER BY l.created_at, l.id)
                 FILTER (WHERE NULLIF(btrim(l.description), '') IS NOT NULL))[1]
                 AS first_description
          FROM billing.invoice_lines l
          JOIN inv ON inv.id = l.invoice_id
          LEFT JOIN insurance.insurance_claim_lines cl ON cl.id = l.insurance_claim_line_id
          LEFT JOIN insurance.insurance_claims c ON c.id = cl.insurance_claim_id
          LEFT JOIN diagnostic_units.diagnostic_study_offerings o
                 ON o.id = cl.diagnostic_study_offering_id
         GROUP BY l.invoice_id
      ),
      amounts AS (
        SELECT inv.*,
               COALESCE(f.covered, 0) AS covered,
               CASE WHEN inv.status_concept_id = ? THEN inv.total - inv.balance
                    ELSE inv.total END AS paid,
               f.has_procedure, f.has_pharmacy, f.has_imaging, f.has_laboratory,
               f.first_description
          FROM inv
          LEFT JOIN facts f ON f.invoice_id = inv.id
      )
      SELECT a.id,
             a.occurred_at                              AS "occurredAt",
             a.invoice_number                           AS "invoiceNumber",
             (a.status_concept_id = ?)                  AS "isCreditNote",
             (a.encounter_id IS NOT NULL)               AS "hasEncounter",
             COALESCE(a.has_procedure, false)           AS "hasProcedure",
             COALESCE(a.has_pharmacy, false)            AS "hasPharmacy",
             COALESCE(a.has_imaging, false)             AS "hasImaging",
             COALESCE(a.has_laboratory, false)          AS "hasLaboratory",
             a.first_description                        AS "firstDescription",
             COALESCE(
               NULLIF(btrim(p.name), ''),
               (SELECT COALESCE(NULLIF(btrim(t.trade_name), ''), t.legal_name)
                  FROM practice.practice_sites s
                  JOIN directory.tenants t ON t.id = s.managing_tenant_id
                 WHERE s.practice_id = a.practice_id
                 ORDER BY s.created_at, s.id
                 LIMIT 1)
             )                                          AS "providerName",
             round(a.paid + a.covered + a.discount_total, 2)::text AS "grossAmount",
             round(a.covered, 2)::text                  AS "coveredAmount",
             round(a.discount_total, 2)::text           AS "discountAmount",
             round(a.paid, 2)::text                     AS "paidAmount"
        FROM amounts a
        LEFT JOIN practice.practices p ON p.id = a.practice_id
       ORDER BY a.occurred_at DESC, a.id DESC
       LIMIT ?`;
    const params: unknown[] = [
      filter.patientProfileId,
      ...excluded,
      filter.from,
      filter.to,
      filter.currencyCode,
      filter.currencyCode,
      filter.laboratoryModalityId,
      filter.laboratoryModalityId,
      filter.paymentPlanStatusId,
      filter.creditNoteStatusId,
      filter.limit,
    ];
    return em.execute<PatientSpendingRow[]>(sql, params, 'all');
  }
}
