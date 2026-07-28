import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `storage_integrity_policies`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'storage_integrity_policies' })
export class StorageIntegrityPolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dataset definition.
   */
  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  /**
   * Valor de hash algorithm mantenido por la instancia.
   */
  @Property({ fieldName: 'hash_algorithm', columnType: 'varchar' })
  hashAlgorithm!: string;

  /**
   * Valor de verification interval hours mantenido por la instancia.
   */
  @Property({ fieldName: 'verification_interval_hours', columnType: 'int' })
  verificationIntervalHours!: number;

  /**
   * Valor de sample percentage mantenido por la instancia.
   */
  @Property({ fieldName: 'sample_percentage', columnType: 'numeric(5,2)' })
  samplePercentage!: string;

  /**
   * Valor de compare with canonical source mantenido por la instancia.
   */
  @Property({ fieldName: 'compare_with_canonical_source', type: 'boolean' })
  compareWithCanonicalSource!: boolean;

  /**
   * Valor de quarantine on mismatch mantenido por la instancia.
   */
  @Property({ fieldName: 'quarantine_on_mismatch', type: 'boolean' })
  quarantineOnMismatch!: boolean;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
