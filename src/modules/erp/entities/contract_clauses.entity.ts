import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'contract_clauses' })
export class ContractClauses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'clause_code', columnType: 'varchar' })
  clauseCode!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ fieldName: 'clause_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  clauseTypeConceptId!: string;

  @Property({ fieldName: 'default_text', columnType: 'text', nullable: true })
  defaultText?: string;

  @Property({
    fieldName: 'risk_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  riskLevelConceptId?: string;

  @Property({ fieldName: 'requires_approval', type: 'boolean', nullable: true })
  requiresApproval?: boolean;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
