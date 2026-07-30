import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contract_obligations`.
 */
@Entity({ schema: 'erp', tableName: 'contract_obligations' })
export class ContractObligations {
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
   * Identificador asociado a contract version.
   */
  @Property({ fieldName: 'contract_version_id', type: 'uuid', nullable: true }) // FK → erp.contract_versions
  contractVersionId?: string;

  /**
   * Identificador asociado a contract clause instance.
   */
  @Property({
    fieldName: 'contract_clause_instance_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_clause_instances
  contractClauseInstanceId?: string;

  /**
   * Identificador asociado a obligation type concept.
   */
  @Property({ fieldName: 'obligation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  obligationTypeConceptId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a responsible business partner.
   */
  @Property({
    fieldName: 'responsible_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  responsibleBusinessPartnerId?: string;

  /**
   * Identificador asociado a responsible user.
   */
  @Property({ fieldName: 'responsible_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  responsibleUserId?: string;

  /**
   * Valor de due date mantenido por la instancia.
   */
  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  /**
   * Valor de recurrence rule mantenido por la instancia.
   */
  @Property({
    fieldName: 'recurrence_rule',
    columnType: 'varchar',
    nullable: true,
  })
  recurrenceRule?: string;

  /**
   * Valor de financial amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'financial_amount',
    columnType: 'numeric',
    nullable: true,
  })
  financialAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de evidence required mantenido por la instancia.
   */
  @Property({ fieldName: 'evidence_required', type: 'boolean', nullable: true })
  evidenceRequired?: boolean;

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
