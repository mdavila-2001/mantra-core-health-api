import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'extension_target_policies' })
export class ExtensionTargetPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'target_resource_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetResourceConceptId!: string;

  @Property({ fieldName: 'definition_set_id', type: 'uuid' }) // FK (destino no resuelto)
  definitionSetId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  @Property({
    fieldName: 'allow_tenant_fields',
    type: 'boolean',
    nullable: true,
  })
  allowTenantFields?: boolean;

  @Property({
    fieldName: 'allow_vendor_fields',
    type: 'boolean',
    nullable: true,
  })
  allowVendorFields?: boolean;

  @Property({ fieldName: 'maximum_fields', columnType: 'int', nullable: true })
  maximumFields?: number;

  @Property({
    fieldName: 'maximum_payload_bytes',
    columnType: 'int',
    nullable: true,
  })
  maximumPayloadBytes?: number;

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
