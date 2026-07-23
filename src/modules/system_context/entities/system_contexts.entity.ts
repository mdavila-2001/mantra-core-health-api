import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_context', tableName: 'system_contexts' })
export class SystemContexts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'context_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contextTypeConceptId!: string;

  @Property({ fieldName: 'scope_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scopeTypeConceptId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'country_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  countryConceptId?: string;

  @Property({ fieldName: 'locale_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  localeConceptId?: string;

  @Property({ fieldName: 'current_version_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  currentVersionId?: string;

  @Property({
    fieldName: 'refresh_policy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  refreshPolicyConceptId?: string;

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
