import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'object_manifests' })
export class ObjectManifests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'namespace_id', type: 'uuid' })
  namespaceId!: string;

  @Property({ fieldName: 'logical_object_id', type: 'uuid' })
  logicalObjectId!: string;

  @Property({ fieldName: 'object_type', columnType: 'varchar' })
  objectType!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' })
  patientProfileId!: string;

  @Property({ fieldName: 'current_version_id', type: 'uuid' })
  currentVersionId!: string;

  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;

  @Property({ fieldName: 'retention_policy_code', columnType: 'varchar' })
  retentionPolicyCode!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
