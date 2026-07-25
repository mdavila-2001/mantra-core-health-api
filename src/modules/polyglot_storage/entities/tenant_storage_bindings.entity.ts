import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'tenant_storage_bindings' })
export class TenantStorageBindings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  @Property({ fieldName: 'primary_placement_id', type: 'uuid' }) // FK → polyglot_storage.dataset_placements
  primaryPlacementId!: string;

  @Property({
    fieldName: 'secondary_placement_id',
    type: 'uuid',
    nullable: true,
  }) // FK → polyglot_storage.dataset_placements
  secondaryPlacementId?: string;

  @Property({ fieldName: 'tenant_partition_key', columnType: 'varchar' })
  tenantPartitionKey!: string;

  @Property({ fieldName: 'tenant_encryption_key_ref', columnType: 'varchar' })
  tenantEncryptionKeyRef!: string;

  @Property({ columnType: 'varchar' })
  state!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
