import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo Insurance (26). El prefijo `insurance` aísla las claves
 * para que el UUID determinista no colisione con conceptos homónimos de otros
 * módulos. Se declaran solo los estados/tipos/resultados que los endpoints usan
 * para poblar cada columna `*_concept_id NOT NULL` de los inserts.
 *
 * El agregador central (`src/common/seed/module-concepts.ts`) reúne el array
 * exportado `INSURANCE_CONCEPT_SEEDS`; los servicios consumen el mapa `INS`.
 */
export const { seeds: INSURANCE_CONCEPT_SEEDS, ids: INS } = defineModuleConcepts('insurance', {
  // Aseguradoras / productos / planes / beneficios
  CARRIER_ACTIVE: { code: 'CARRIER_ACTIVE', display: 'Aseguradora activa' },
  VERIFY_PENDING: { code: 'VERIFICATION_PENDING', display: 'Verificación pendiente' },
  VERIFY_VERIFIED: { code: 'VERIFICATION_VERIFIED', display: 'Verificado' },
  PRODUCT_ACTIVE: { code: 'PRODUCT_ACTIVE', display: 'Producto activo' },
  PRODUCT_TYPE_HEALTH: { code: 'PRODUCT_TYPE_HEALTH', display: 'Producto de salud' },
  PLAN_ACTIVE: { code: 'PLAN_ACTIVE', display: 'Plan activo' },
  BENEFIT_ACTIVE: { code: 'BENEFIT_ACTIVE', display: 'Beneficio activo' },
  BENEFIT_CATEGORY_GENERAL: { code: 'BENEFIT_CATEGORY_GENERAL', display: 'Beneficio general' },

  // Redes y membresías
  NETWORK_ACTIVE: { code: 'NETWORK_ACTIVE', display: 'Red activa' },
  NETWORK_TYPE_PPO: { code: 'NETWORK_TYPE_PPO', display: 'Red PPO' },
  MEMBERSHIP_ACTIVE: { code: 'MEMBERSHIP_ACTIVE', display: 'Membresía activa' },
  PROVIDER_TYPE_PRACTICE: { code: 'PROVIDER_TYPE_PRACTICE', display: 'Prestador: práctica' },
  PARTICIPATION_IN_NETWORK: { code: 'PARTICIPATION_IN_NETWORK', display: 'En red' },

  // Coberturas y dependientes
  COVERAGE_ACTIVE: { code: 'COVERAGE_ACTIVE', display: 'Cobertura activa' },
  DEPENDENT_ACTIVE: { code: 'DEPENDENT_ACTIVE', display: 'Dependiente activo' },
  RELATIONSHIP_SELF: { code: 'RELATIONSHIP_SELF', display: 'Titular' },
  RELATIONSHIP_SPOUSE: { code: 'RELATIONSHIP_SPOUSE', display: 'Cónyuge' },
  RELATIONSHIP_CHILD: { code: 'RELATIONSHIP_CHILD', display: 'Hijo/a' },
  CLIENT_TYPE_INDIVIDUAL: { code: 'CLIENT_TYPE_INDIVIDUAL', display: 'Cliente individual' },

  // Elegibilidad
  ELIG_REQUESTED: { code: 'ELIGIBILITY_REQUESTED', display: 'Elegibilidad solicitada' },
  ELIG_RESOLVED: { code: 'ELIGIBILITY_RESOLVED', display: 'Elegibilidad resuelta' },
  ELIG_OUTCOME_ACTIVE: { code: 'ELIGIBILITY_ACTIVE', display: 'Cobertura vigente' },
  ELIG_PROVIDER_TYPE_PRACTICE: { code: 'ELIG_PROVIDER_TYPE_PRACTICE', display: 'Solicitante: práctica' },

  // Autorización previa
  PRIOR_AUTH_SUBMITTED: { code: 'PRIOR_AUTH_SUBMITTED', display: 'Autorización enviada' },
  PRIOR_AUTH_IN_REVIEW: { code: 'PRIOR_AUTH_IN_REVIEW', display: 'Autorización en revisión' },
  PRIOR_AUTH_DETERMINED: { code: 'PRIOR_AUTH_DETERMINED', display: 'Autorización determinada' },
  DECISION_APPROVED: { code: 'DECISION_APPROVED', display: 'Aprobado' },
  DECISION_DENIED: { code: 'DECISION_DENIED', display: 'Denegado' },
  DECISION_PARTIAL: { code: 'DECISION_PARTIAL', display: 'Parcial' },

  // Reclamos y adjudicación
  CLAIM_SUBMITTED: { code: 'CLAIM_SUBMITTED', display: 'Reclamo enviado' },
  CLAIM_ADJUDICATED: { code: 'CLAIM_ADJUDICATED', display: 'Reclamo adjudicado' },
  CLAIM_REVERSED: { code: 'CLAIM_REVERSED', display: 'Reclamo revertido' },
  CLAIM_PAID: { code: 'CLAIM_PAID', display: 'Reclamo pagado' },
  BILLING_PROVIDER_TYPE_PRACTICE: { code: 'BILLING_PROVIDER_TYPE_PRACTICE', display: 'Facturador: práctica' },
  ADJ_OUTCOME_APPROVED: { code: 'ADJUDICATION_APPROVED', display: 'Adjudicación aprobada' },
  ADJ_OUTCOME_DENIED: { code: 'ADJUDICATION_DENIED', display: 'Adjudicación denegada' },
  LINE_DECISION_APPROVED: { code: 'LINE_DECISION_APPROVED', display: 'Línea aprobada' },
  LINE_DECISION_DENIED: { code: 'LINE_DECISION_DENIED', display: 'Línea denegada' },

  // EOB
  EOB_PUBLISHED: { code: 'EOB_PUBLISHED', display: 'EOB publicada' },

  // Coordinación de beneficios
  COB_RULE_STANDARD: { code: 'COB_RULE_STANDARD', display: 'Regla COB estándar' },
  COB_ACTIVE: { code: 'COB_ACTIVE', display: 'COB vigente' },

  // Reversión
  REVERSAL_REASON_CORRECTION: { code: 'REVERSAL_REASON_CORRECTION', display: 'Corrección' },

  // Disputas y apelaciones
  DISPUTE_OPEN: { code: 'DISPUTE_OPEN', display: 'Disputa abierta' },
  DISPUTE_IN_REVIEW: { code: 'DISPUTE_IN_REVIEW', display: 'Disputa en revisión' },
  DISPUTE_RESOLVED: { code: 'DISPUTE_RESOLVED', display: 'Disputa resuelta' },
  DISPUTE_TYPE_APPEAL: { code: 'DISPUTE_TYPE_APPEAL', display: 'Tipo: apelación' },
  DISPUTE_REASON_UNDERPAID: { code: 'DISPUTE_REASON_UNDERPAID', display: 'Motivo: pago insuficiente' },
  PARTY_PROVIDER: { code: 'PARTY_PROVIDER', display: 'Parte: prestador' },
  PARTY_PATIENT: { code: 'PARTY_PATIENT', display: 'Parte: paciente' },
  APPEAL_LEVEL_FIRST: { code: 'APPEAL_LEVEL_FIRST', display: 'Apelación primer nivel' },
  APPEAL_DECISION_UPHELD: { code: 'APPEAL_DECISION_UPHELD', display: 'Ratificado' },
  APPEAL_DECISION_OVERTURNED: { code: 'APPEAL_DECISION_OVERTURNED', display: 'Revertido' },

  // Conciliación
  RECON_BATCH_OPEN: { code: 'RECON_BATCH_OPEN', display: 'Lote abierto' },
  RECON_BATCH_RECONCILED: { code: 'RECON_BATCH_RECONCILED', display: 'Lote conciliado' },
  RECON_ITEM_MATCHED: { code: 'RECON_ITEM_MATCHED', display: 'Ítem conciliado' },
  RECON_PROVIDER_TYPE_PRACTICE: { code: 'RECON_PROVIDER_TYPE_PRACTICE', display: 'Conciliación: práctica' },
  VARIANCE_NONE: { code: 'VARIANCE_NONE', display: 'Sin variación' },

  // Brokers
  BROKER_ACTIVE: { code: 'BROKER_ACTIVE', display: 'Broker activo' },
  EMPLOYER_GROUP_ACTIVE: { code: 'EMPLOYER_GROUP_ACTIVE', display: 'Grupo empleador activo' },
  AGREEMENT_ACTIVE: { code: 'AGREEMENT_ACTIVE', display: 'Acuerdo activo' },
  COMMISSION_MODEL_FLAT: { code: 'COMMISSION_MODEL_FLAT', display: 'Comisión fija' },
  COMMISSION_DRAFT: { code: 'COMMISSION_DRAFT', display: 'Liquidación borrador' },
});
