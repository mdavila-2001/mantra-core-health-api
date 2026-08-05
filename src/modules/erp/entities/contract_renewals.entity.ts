import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contract_renewals`.
 */
@Entity({ schema: 'erp', tableName: 'contract_renewals' })
export class ContractRenewals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  /**
   * Identificador asociado a renewal type concept.
   */
  @Property({ fieldName: 'renewal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  renewalTypeConceptId!: string;

  /**
   * Valor de notice due date mantenido por la instancia.
   */
  @Property({
    fieldName: 'notice_due_date',
    columnType: 'date',
    nullable: true,
  })
  noticeDueDate?: Date;

  /**
   * Valor de renewal effective date mantenido por la instancia.
   */
  @Property({
    fieldName: 'renewal_effective_date',
    columnType: 'date',
    nullable: true,
  })
  renewalEffectiveDate?: Date;

  /**
   * Valor de new end date mantenido por la instancia.
   */
  @Property({ fieldName: 'new_end_date', columnType: 'date', nullable: true })
  newEndDate?: Date;

  /**
   * Valor de proposed value mantenido por la instancia.
   */
  @Property({
    fieldName: 'proposed_value',
    columnType: 'numeric',
    nullable: true,
  })
  proposedValue?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a initiated by user.
   */
  @Property({ fieldName: 'initiated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  initiatedByUserId?: string;

  /**
   * Identificador asociado a decision by user.
   */
  @Property({ fieldName: 'decision_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  decisionByUserId?: string;

  /**
   * Valor de decision at mantenido por la instancia.
   */
  @Property({
    fieldName: 'decision_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decisionAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
