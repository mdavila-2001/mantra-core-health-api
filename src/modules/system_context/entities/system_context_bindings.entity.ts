import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_context', tableName: 'system_context_bindings' })
export class SystemContextBindings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'system_context_id', type: 'uuid' }) // FK → system_context.system_contexts
  systemContextId!: string;

  @Property({ fieldName: 'consumer_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  consumerTypeConceptId!: string;

  @Property({ fieldName: 'consumer_id', type: 'uuid' })
  consumerId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'country_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  countryConceptId?: string;

  @Property({
    fieldName: 'activation_rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  activationRuleJson?: unknown;

  @Property({ columnType: 'int', nullable: true })
  priority?: number;

  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
