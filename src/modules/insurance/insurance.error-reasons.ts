/**
 * Catálogo de sub-códigos de negocio estables para el módulo `insurance`.
 *
 * Complementa el `code` genérico (CONFLICT, NOT_FOUND, etc.) de
 * `DomainException` con el motivo concreto dentro del dominio de seguros,
 * para que un cliente pueda ramificar sin parsear `message`.
 */
export enum InsuranceErrorReason {
  /** La aseguradora (carrier) referida no existe. */
  CARRIER_NOT_FOUND = 'CARRIER_NOT_FOUND',
  /** El lote de conciliación referido no existe. */
  RECONCILIATION_BATCH_NOT_FOUND = 'RECONCILIATION_BATCH_NOT_FOUND',
  /** El reclamo (claim) referido no existe. */
  CLAIM_NOT_FOUND = 'CLAIM_NOT_FOUND',
  /** La versión de adjudicación referida no existe o no pertenece al reclamo. */
  ADJUDICATION_VERSION_NOT_FOUND = 'ADJUDICATION_VERSION_NOT_FOUND',
  /** El plan referido no existe. */
  PLAN_NOT_FOUND = 'PLAN_NOT_FOUND',
  /** El plan existe pero no está en estado activo. */
  PLAN_NOT_ACTIVE = 'PLAN_NOT_ACTIVE',
  /** El afiliado ya tiene una cobertura activa en ese plan. */
  COVERAGE_ALREADY_EXISTS = 'COVERAGE_ALREADY_EXISTS',
  /** La cobertura referida no existe. */
  COVERAGE_NOT_FOUND = 'COVERAGE_NOT_FOUND',
  /** Ya existe una solicitud de elegibilidad con esa clave de idempotencia. */
  ELIGIBILITY_REQUEST_DUPLICATE = 'ELIGIBILITY_REQUEST_DUPLICATE',
  /** La cobertura primaria indicada para el COB no existe. */
  PRIMARY_COVERAGE_NOT_FOUND = 'PRIMARY_COVERAGE_NOT_FOUND',
  /** El COB requiere al menos una cobertura secundaria y no se indicó. */
  COB_SECONDARY_COVERAGE_REQUIRED = 'COB_SECONDARY_COVERAGE_REQUIRED',
  /** Ya existe un reclamo con esa clave de idempotencia. */
  CLAIM_DUPLICATE = 'CLAIM_DUPLICATE',
  /** El pedido vinculado ya tiene un reclamo activo. */
  CLAIM_ALREADY_EXISTS_FOR_ORDER = 'CLAIM_ALREADY_EXISTS_FOR_ORDER',
  /** El reclamo no está en un estado que admita adjudicación. */
  CLAIM_NOT_ADJUDICABLE = 'CLAIM_NOT_ADJUDICABLE',
  /** La línea de reclamo referida no existe o no pertenece al reclamo. */
  CLAIM_LINE_NOT_FOUND = 'CLAIM_LINE_NOT_FOUND',
  /** No existe una adjudicación in_force sobre la cual publicar la EOB. */
  ADJUDICATION_NOT_FOUND_FOR_EOB = 'ADJUDICATION_NOT_FOUND_FOR_EOB',
  /** Ya se publicó la EOB para esa versión de adjudicación. */
  EOB_ALREADY_PUBLISHED = 'EOB_ALREADY_PUBLISHED',
  /** El reclamo no está en un estado que admita reversión. */
  CLAIM_NOT_REVERSIBLE = 'CLAIM_NOT_REVERSIBLE',
  /** La disputa (appeal) referida no existe. */
  DISPUTE_NOT_FOUND = 'DISPUTE_NOT_FOUND',
  /** La disputa no admite decisión en su estado actual. */
  DISPUTE_NOT_DECIDABLE = 'DISPUTE_NOT_DECIDABLE',
  /** El broker referido no existe. */
  BROKER_NOT_FOUND = 'BROKER_NOT_FOUND',
  /** La solicitud de autorización previa referida no existe. */
  PRIOR_AUTH_REQUEST_NOT_FOUND = 'PRIOR_AUTH_REQUEST_NOT_FOUND',
  /** La solicitud de autorización previa no admite determinación en su estado actual. */
  PRIOR_AUTH_NOT_DETERMINABLE = 'PRIOR_AUTH_NOT_DETERMINABLE',
  /** El acuerdo broker-aseguradora referido no existe. */
  AGREEMENT_NOT_FOUND = 'AGREEMENT_NOT_FOUND',
  /** El acuerdo broker-aseguradora existe pero no está activo. */
  AGREEMENT_NOT_ACTIVE = 'AGREEMENT_NOT_ACTIVE',
  /** Ya existe una liquidación de comisiones para ese periodo. */
  COMMISSION_STATEMENT_ALREADY_EXISTS = 'COMMISSION_STATEMENT_ALREADY_EXISTS',
  /** El producto referido no existe. */
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  /** La red de prestadores referida no existe. */
  PROVIDER_NETWORK_NOT_FOUND = 'PROVIDER_NETWORK_NOT_FOUND',
  /** La red de prestadores existe pero no está activa. */
  PROVIDER_NETWORK_NOT_ACTIVE = 'PROVIDER_NETWORK_NOT_ACTIVE',
  /** La red de prestadores está fuera de su vigencia. */
  PROVIDER_NETWORK_EXPIRED = 'PROVIDER_NETWORK_EXPIRED',
}
