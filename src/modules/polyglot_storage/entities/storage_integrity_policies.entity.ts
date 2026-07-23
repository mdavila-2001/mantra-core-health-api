import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'storage_integrity_policies' })
export class StorageIntegrityPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  @Property({ fieldName: 'hash_algorithm', columnType: 'varchar' })
  hashAlgorithm!: string;

  @Property({ fieldName: 'verification_interval_hours', columnType: 'int' })
  verificationIntervalHours!: number;

  @Property({ fieldName: 'sample_percentage', columnType: 'numeric(5,2)' })
  samplePercentage!: string;

  @Property({ fieldName: 'compare_with_canonical_source', type: 'boolean' })
  compareWithCanonicalSource!: boolean;

  @Property({ fieldName: 'quarantine_on_mismatch', type: 'boolean' })
  quarantineOnMismatch!: boolean;

  @Property({ columnType: 'varchar' })
  state!: string;
}
