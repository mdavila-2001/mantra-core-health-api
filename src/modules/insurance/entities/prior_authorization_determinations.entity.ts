import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `prior_authorization_determinations`.
 */
@Entity({
  schema: 'insurance',
  tableName: 'prior_authorization_determinations',
})
export class PriorAuthorizationDeterminations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a prior authorization request.
   */
  @Property({ fieldName: 'prior_authorization_request_id', type: 'uuid' }) // FK → insurance.prior_authorization_requests
  priorAuthorizationRequestId!: string;

  /**
   * Identificador asociado a prior authorization item.
   */
  @Property({
    fieldName: 'prior_authorization_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.prior_authorization_items
  priorAuthorizationItemId?: string;

  /**
   * Valor de determination version mantenido por la instancia.
   */
  @Property({ fieldName: 'determination_version', columnType: 'int' })
  determinationVersion!: number;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  /**
   * Valor de approved quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  approvedQuantity?: string;

  /**
   * Valor de approved amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_amount',
    columnType: 'numeric',
    nullable: true,
  })
  approvedAmount?: string;

  /**
   * Identificador asociado a denial reason concept.
   */
  @Property({
    fieldName: 'denial_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  denialReasonConceptId?: string;

  /**
   * Cita de la cláusula contractual que fundamenta el NO APROBADO del ítem
   * (patch v4.2.31). Nula en aprobaciones y en determinaciones anteriores.
   */
  @Property({
    fieldName: 'policy_clause_reference',
    columnType: 'varchar',
    nullable: true,
  })
  policyClauseReference?: string;

  /** Justificación circunstanciada del rechazo (patch v4.2.31). */
  @Property({
    fieldName: 'denial_rationale',
    columnType: 'text',
    nullable: true,
  })
  denialRationale?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  /**
   * Identificador asociado a supporting file.
   */
  @Property({ fieldName: 'supporting_file_id', type: 'uuid', nullable: true }) // FK → common.files
  supportingFileId?: string;

  /**
   * Valor de decided at mantenido por la instancia.
   */
  @Property({ fieldName: 'decided_at', columnType: 'timestamptz' })
  decidedAt!: Date;

  /**
   * Identificador asociado a decided by user.
   */
  @Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  decidedByUserId?: string;
}
