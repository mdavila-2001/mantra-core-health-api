import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `opportunities`.
 */
@Entity({ schema: 'crm', tableName: 'opportunities' })
export class Opportunities {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a pipeline.
   */
  @Property({ fieldName: 'pipeline_id', type: 'uuid' }) // FK → crm.pipelines
  pipelineId!: string;

  /**
   * Identificador asociado a stage.
   */
  @Property({ fieldName: 'stage_id', type: 'uuid' }) // FK → crm.pipeline_stages
  stageId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a crm account.
   */
  @Property({ fieldName: 'crm_account_id', type: 'uuid', nullable: true }) // FK → crm.crm_accounts
  crmAccountId?: string;

  /**
   * Identificador asociado a primary contact.
   */
  @Property({ fieldName: 'primary_contact_id', type: 'uuid', nullable: true }) // FK → crm.contacts
  primaryContactId?: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  amount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de expected close date mantenido por la instancia.
   */
  @Property({
    fieldName: 'expected_close_date',
    columnType: 'date',
    nullable: true,
  })
  expectedCloseDate?: Date;

  /**
   * Valor de probability percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'probability_percent',
    columnType: 'numeric',
    nullable: true,
  })
  probabilityPercent?: string;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Identificador asociado a sales order.
   */
  @Property({ fieldName: 'sales_order_id', type: 'uuid', nullable: true }) // FK → erp.sales_orders
  salesOrderId?: string;

  /**
   * Identificador asociado a lost reason concept.
   */
  @Property({
    fieldName: 'lost_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lostReasonConceptId?: string;

  /**
   * Valor de won at mantenido por la instancia.
   */
  @Property({ fieldName: 'won_at', columnType: 'timestamptz', nullable: true })
  wonAt?: Date;

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
