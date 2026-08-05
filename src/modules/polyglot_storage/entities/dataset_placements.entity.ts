import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dataset_placements`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'dataset_placements' })
export class DatasetPlacements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dataset version.
   */
  @Property({ fieldName: 'dataset_version_id', type: 'uuid' }) // FK → polyglot_storage.dataset_versions
  datasetVersionId!: string;

  /**
   * Identificador asociado a storage backend region.
   */
  @Property({ fieldName: 'storage_backend_region_id', type: 'uuid' }) // FK → polyglot_storage.storage_backend_regions
  storageBackendRegionId!: string;

  /**
   * Identificador asociado a collection definition.
   */
  @Property({ fieldName: 'collection_definition_id', type: 'uuid' }) // FK → polyglot_storage.collection_definitions
  collectionDefinitionId!: string;

  /**
   * Valor de placement role mantenido por la instancia.
   */
  @Property({ fieldName: 'placement_role', columnType: 'varchar' })
  placementRole!: string;

  /**
   * Identificador asociado a residency policy.
   */
  @Property({ fieldName: 'residency_policy_id', type: 'uuid' }) // FK → polyglot_storage.residency_policies
  residencyPolicyId!: string;

  /**
   * Identificador asociado a replication policy.
   */
  @Property({ fieldName: 'replication_policy_id', type: 'uuid' }) // FK → polyglot_storage.replication_policies
  replicationPolicyId!: string;

  /**
   * Identificador asociado a consistency policy.
   */
  @Property({ fieldName: 'consistency_policy_id', type: 'uuid' }) // FK → polyglot_storage.consistency_policies
  consistencyPolicyId!: string;

  /**
   * Identificador asociado a encryption profile.
   */
  @Property({ fieldName: 'encryption_profile_id', type: 'uuid' }) // FK → polyglot_storage.encryption_profiles
  encryptionProfileId!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;

  /**
   * Valor de activated at mantenido por la instancia.
   */
  @Property({ fieldName: 'activated_at', columnType: 'timestamptz' })
  activatedAt!: Date;
}
