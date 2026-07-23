import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'dataset_placements' })
export class DatasetPlacements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dataset_version_id', type: 'uuid' }) // FK → polyglot_storage.dataset_versions
  datasetVersionId!: string;

  @Property({ fieldName: 'storage_backend_region_id', type: 'uuid' }) // FK → polyglot_storage.storage_backend_regions
  storageBackendRegionId!: string;

  @Property({ fieldName: 'collection_definition_id', type: 'uuid' }) // FK → polyglot_storage.collection_definitions
  collectionDefinitionId!: string;

  @Property({ fieldName: 'placement_role', columnType: 'varchar' })
  placementRole!: string;

  @Property({ fieldName: 'residency_policy_id', type: 'uuid' }) // FK → polyglot_storage.residency_policies
  residencyPolicyId!: string;

  @Property({ fieldName: 'replication_policy_id', type: 'uuid' }) // FK → polyglot_storage.replication_policies
  replicationPolicyId!: string;

  @Property({ fieldName: 'consistency_policy_id', type: 'uuid' }) // FK → polyglot_storage.consistency_policies
  consistencyPolicyId!: string;

  @Property({ fieldName: 'encryption_profile_id', type: 'uuid' }) // FK → polyglot_storage.encryption_profiles
  encryptionProfileId!: string;

  @Property({ columnType: 'varchar' })
  state!: string;

  @Property({ fieldName: 'activated_at', columnType: 'timestamptz' })
  activatedAt!: Date;
}
