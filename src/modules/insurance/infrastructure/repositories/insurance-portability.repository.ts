import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

/** Una atención (encuentro clínico) del titular, cruda de la base. */
export interface PortabilityEncounterRow {
  readonly encounter_id: string;
  readonly start_at: string | null;
  readonly end_at: string | null;
  readonly class_concept_id: string | null;
  readonly type_concept_id: string | null;
  readonly status_concept_id: string;
  readonly tenant_name: string | null;
  readonly branch_name: string | null;
}

/** Una póliza o cobertura declarada por el titular, cruda de la base. */
export interface PortabilityPolicyRow {
  readonly coverage_id: string;
  readonly carrier_name: string;
  readonly plan_name: string | null;
  readonly product_name: string | null;
  readonly policy_identifier: string | null;
  readonly member_identifier: string | null;
  readonly relationship_concept_id: string | null;
  readonly effective_from: string | null;
  readonly effective_to: string | null;
  readonly status_concept_id: string | null;
  readonly verification_status_concept_id: string | null;
  readonly currency_concept_id: string | null;
  readonly currency_code: string | null;
  readonly monthly_premium_amount: string | null;
}

/**
 * Un ítem facturado, con su reclamo y su dictamen (si lo tiene), cruda de la
 * base. Una fila por línea; un reclamo sin líneas facturadas —no debería
 * ocurrir, pero el `LEFT JOIN` lo tolera— sale como una sola fila con los
 * campos de línea en `null`.
 */
export interface PortabilityClaimLineRow {
  readonly claim_id: string;
  readonly claim_identifier: string;
  readonly submitted_at: string | null;
  readonly status_concept_id: string;
  readonly currency_concept_id: string | null;
  readonly currency_code: string | null;
  readonly total_amount: string | null;
  readonly billing_provider_type_concept_id: string;
  readonly policy_identifier: string | null;
  readonly carrier_name: string;
  readonly practice_name: string | null;
  readonly pharmacy_legal_name: string | null;
  readonly pharmacy_trade_name: string | null;
  readonly diagnostic_unit_practice_name: string | null;
  readonly adjudication_outcome_concept_id: string | null;
  readonly adjudicated_at: string | null;
  readonly total_approved_amount: string | null;
  readonly total_patient_amount: string | null;
  readonly total_denied_amount: string | null;
  readonly line_id: string | null;
  readonly line_sequence: number | null;
  readonly service_concept_id: string | null;
  readonly billed_amount: string | null;
  readonly patient_responsibility_amount: string | null;
  readonly diagnostic_study_offering_id: string | null;
  readonly medication_dispensation_line_id: string | null;
  readonly supporting_clinical_reference: string | null;
  readonly line_decision_concept_id: string | null;
  readonly line_approved_amount: string | null;
  readonly line_denied_amount: string | null;
  readonly line_patient_amount: string | null;
  readonly line_reason_concept_id: string | null;
  readonly policy_clause_reference: string | null;
  readonly denial_rationale: string | null;
}

/** Un diagnóstico (condición clínica) del titular, cruda de la base. */
export interface PortabilityConditionRow {
  readonly code_concept_id: string;
  readonly code: string | null;
  readonly display: string;
  readonly code_system: string | null;
  readonly clinical_status_concept_id: string | null;
  readonly onset_at: string | null;
  readonly resolved_at: string | null;
}

/**
 * Lecturas de agregación para el certificado de portabilidad de seguros
 * (subtarea 3.3): pólizas, reclamos con sus líneas y dictamen, y diagnósticos
 * del titular. Sin estado, `EntityManager` por parámetro — mismo patrón que
 * `InsuranceAnalyticsRepository`.
 *
 * Ninguna de estas consultas pagina: el historial de UN paciente es acotado
 * (decenas de filas, no millones), a diferencia del tablero agregado de la
 * aseguradora completa de la subtarea 3.1. Por eso el resumen actuarial se
 * calcula en el servicio a partir de estas mismas filas, con
 * `sumarDecimales` — no repite la consulta con `SUM()` en Postgres.
 */
@Injectable()
export class InsurancePortabilityRepository {
  /** Las pólizas/coberturas que el paciente declaró, vigentes o no. */
  async policiesOfPatient(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<PortabilityPolicyRow[]> {
    return em.getConnection().execute<PortabilityPolicyRow[]>(
      `SELECT c.id AS coverage_id, ca.legal_name AS carrier_name,
              pl.name AS plan_name, pr.name AS product_name,
              c.policy_identifier, c.member_identifier,
              c.relationship_to_subscriber_concept_id AS relationship_concept_id,
              to_char(c.effective_from, 'YYYY-MM-DD') AS effective_from,
              to_char(c.effective_to, 'YYYY-MM-DD') AS effective_to,
              c.status_concept_id, c.verification_status_concept_id,
              pl.currency_concept_id, currency.code AS currency_code,
              pl.monthly_premium_amount
         FROM insurance.patient_coverages c
         JOIN insurance.insurance_plans pl ON pl.id = c.insurance_plan_id
         JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
         JOIN insurance.insurance_carriers ca ON ca.id = pr.insurance_carrier_id
         LEFT JOIN terminology.catalog_concepts currency ON currency.id = pl.currency_concept_id
        WHERE c.patient_profile_id = ?
        ORDER BY c.coverage_order NULLS LAST, c.effective_from DESC NULLS LAST, c.id`,
      [patientProfileId],
    );
  }

  /**
   * Reclamos del paciente con sus líneas y el dictamen de la versión vigente
   * (por `DISTINCT ON`, mismo patrón que `InsuranceAnalyticsRepository`).
   * Incluye reclamos reversados: el historial es completo, y el estado de
   * cada uno se informa tal cual.
   *
   * El prestador se resuelve por los tres tipos que el modelo declara
   * (`practice.practices`, `pharmacy.pharmacies`, `diagnostic_units` → su
   * práctica dueña); ninguna tabla de farmacia u organización diagnóstica
   * tiene FK explícita desde `insurance_claims.billing_provider_entity_id`
   * —es una columna polimórfica—, así que los tres `LEFT JOIN` coexisten y
   * el servicio elige por `billing_provider_type_concept_id`.
   */
  async claimsOfPatient(
    em: EntityManager,
    patientProfileId: string,
    practiceProviderTypeConceptId: string,
    pharmacyProviderTypeConceptId: string,
    diagnosticUnitProviderTypeConceptId: string,
  ): Promise<PortabilityClaimLineRow[]> {
    return em.getConnection().execute<PortabilityClaimLineRow[]>(
      `WITH claims AS (
         SELECT c.*
           FROM insurance.insurance_claims c
           JOIN insurance.patient_coverages pc ON pc.id = c.patient_coverage_id
          WHERE pc.patient_profile_id = ?
       ),
       current_version AS (
         SELECT DISTINCT ON (v.insurance_claim_id)
           v.insurance_claim_id, v.id AS version_id, v.outcome_concept_id,
           v.total_approved_amount, v.total_patient_amount, v.total_denied_amount,
           v.adjudicated_at
           FROM insurance.claim_adjudication_versions v
           JOIN claims c ON c.id = v.insurance_claim_id
          ORDER BY v.insurance_claim_id, v.adjudication_version DESC
       )
       SELECT c.id AS claim_id, c.claim_identifier,
              to_char(c.submitted_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS submitted_at,
              c.status_concept_id, c.currency_concept_id, currency.code AS currency_code,
              c.total_amount, c.billing_provider_type_concept_id,
              pc.policy_identifier, ca.legal_name AS carrier_name,
              prac_direct.name AS practice_name,
              ph.legal_name AS pharmacy_legal_name, ph.trade_name AS pharmacy_trade_name,
              du_prac.name AS diagnostic_unit_practice_name,
              cv.outcome_concept_id AS adjudication_outcome_concept_id,
              to_char(cv.adjudicated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS adjudicated_at,
              cv.total_approved_amount, cv.total_patient_amount, cv.total_denied_amount,
              l.id AS line_id, l.line_sequence, l.service_concept_id,
              l.billed_amount, l.patient_responsibility_amount,
              l.diagnostic_study_offering_id, l.medication_dispensation_line_id,
              l.supporting_clinical_reference,
              la.decision_concept_id AS line_decision_concept_id,
              la.approved_amount AS line_approved_amount,
              la.denied_amount AS line_denied_amount,
              la.patient_amount AS line_patient_amount,
              la.reason_concept_id AS line_reason_concept_id,
              la.policy_clause_reference, la.denial_rationale
         FROM claims c
         JOIN insurance.patient_coverages pc ON pc.id = c.patient_coverage_id
         JOIN insurance.insurance_carriers ca ON ca.id = c.insurance_carrier_id
         LEFT JOIN terminology.catalog_concepts currency ON currency.id = c.currency_concept_id
         LEFT JOIN current_version cv ON cv.insurance_claim_id = c.id
         LEFT JOIN insurance.insurance_claim_lines l ON l.insurance_claim_id = c.id
         LEFT JOIN insurance.claim_line_adjudications la
                ON la.claim_adjudication_version_id = cv.version_id
               AND la.insurance_claim_line_id = l.id
         LEFT JOIN practice.practices prac_direct
                ON prac_direct.id = c.billing_provider_entity_id
               AND c.billing_provider_type_concept_id = ?
         LEFT JOIN pharmacy.pharmacies ph
                ON ph.id = c.billing_provider_entity_id
               AND c.billing_provider_type_concept_id = ?
         LEFT JOIN diagnostic_units.diagnostic_units du
                ON du.id = c.billing_provider_entity_id
               AND c.billing_provider_type_concept_id = ?
         LEFT JOIN practice.practices du_prac ON du_prac.id = du.practice_id
        ORDER BY c.submitted_at ASC NULLS LAST, c.id, l.line_sequence ASC NULLS LAST`,
      [
        patientProfileId,
        practiceProviderTypeConceptId,
        pharmacyProviderTypeConceptId,
        diagnosticUnitProviderTypeConceptId,
      ],
    );
  }

  /**
   * Los diagnósticos del paciente, con el código de su sistema de
   * codificación si tiene uno registrado (`icd10cm`, u otro). Mismo `LEFT
   * JOIN` que `InsuranceAnalyticsRepository.prevalentPathologies`, sin acotar
   * a `icd10cm`: se informa el sistema junto al código para no atribuirle un
   * código CIE-10 a un concepto que no lo es.
   */
  async conditionsOfPatient(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<PortabilityConditionRow[]> {
    return em.getConnection().execute<PortabilityConditionRow[]>(
      `SELECT cd.code_concept_id, cc.code, cc.display,
              cs.internal_code AS code_system,
              cd.clinical_status_concept_id,
              to_char(cd.onset_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS onset_at,
              to_char(cd.resolved_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS resolved_at
         FROM clinical.conditions cd
         JOIN terminology.catalog_concepts cc ON cc.id = cd.code_concept_id
         LEFT JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
         LEFT JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
        WHERE cd.patient_profile_id = ?
        ORDER BY cd.onset_at ASC NULLS LAST, cd.id`,
      [patientProfileId],
    );
  }

  /**
   * Las atenciones (encuentros clínicos) del titular, sin `reason_text`: es
   * texto clínico libre y el certificado se entrega a un tercero (otra
   * aseguradora) — minimización de PHI (CA-01 pide «histórico de
   * atenciones», no el motivo de consulta de cada una).
   */
  async encountersOfPatient(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<PortabilityEncounterRow[]> {
    return em.getConnection().execute<PortabilityEncounterRow[]>(
      `SELECT e.id AS encounter_id,
              to_char(e.start_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS start_at,
              to_char(e.end_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS end_at,
              e.class_concept_id, e.type_concept_id, e.status_concept_id,
              t.legal_name AS tenant_name, b.name AS branch_name
         FROM clinical.encounters e
         LEFT JOIN directory.tenants t ON t.id = e.tenant_id
         LEFT JOIN directory.branches b ON b.id = e.branch_id
        WHERE e.patient_profile_id = ?
        ORDER BY e.start_at ASC NULLS LAST, e.id`,
      [patientProfileId],
    );
  }
}
