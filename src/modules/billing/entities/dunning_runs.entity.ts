import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dunning_runs`.
 */
@Entity({ schema: 'billing', tableName: 'dunning_runs' })
export class DunningRuns {
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
   * Valor de run number mantenido por la instancia.
   */
  @Property({ fieldName: 'run_number', columnType: 'varchar' })
  runNumber!: string;

  /**
   * Valor de run date mantenido por la instancia.
   */
  @Property({ fieldName: 'run_date', columnType: 'date', nullable: true })
  runDate?: Date;

  /**
   * Identificador asociado a dunning level concept.
   */
  @Property({
    fieldName: 'dunning_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dunningLevelConceptId?: string;

  /**
   * Identificador asociado a company bank account.
   */
  @Property({
    fieldName: 'company_bank_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.company_bank_accounts
  companyBankAccountId?: string;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
