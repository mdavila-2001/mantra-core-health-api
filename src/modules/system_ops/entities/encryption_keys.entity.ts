import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `encryption_keys`.
 */
@Entity({ schema: 'system_ops', tableName: 'encryption_keys' })
export class EncryptionKeys {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de key alias mantenido por la instancia.
   */
  @Property({ fieldName: 'key_alias', columnType: 'varchar' })
  keyAlias!: string;

  /**
   * Identificador asociado a key purpose concept.
   */
  @Property({ fieldName: 'key_purpose_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  keyPurposeConceptId!: string;

  /**
   * Identificador asociado a algorithm concept.
   */
  @Property({ fieldName: 'algorithm_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  algorithmConceptId!: string;

  /**
   * Identificador asociado a provider concept.
   */
  @Property({ fieldName: 'provider_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  providerConceptId?: string;

  /**
   * Valor de external key ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_key_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalKeyRef?: string;

  /**
   * Valor de key version mantenido por la instancia.
   */
  @Property({ fieldName: 'key_version', columnType: 'int', nullable: true })
  keyVersion?: number;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

  /**
   * Valor de rotation period days mantenido por la instancia.
   */
  @Property({
    fieldName: 'rotation_period_days',
    columnType: 'int',
    nullable: true,
  })
  rotationPeriodDays?: number;

  /**
   * Valor de last rotated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_rotated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRotatedAt?: Date;

  /**
   * Valor de next rotation at mantenido por la instancia.
   */
  @Property({
    fieldName: 'next_rotation_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRotationAt?: Date;

  /**
   * Identificador asociado a retention policy.
   */
  @Property({ fieldName: 'retention_policy_id', type: 'uuid', nullable: true }) // FK → system_ops.retention_policies
  retentionPolicyId?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
