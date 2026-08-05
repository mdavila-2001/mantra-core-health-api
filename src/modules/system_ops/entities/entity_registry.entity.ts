import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `entity_registry`.
 */
@Entity({ schema: 'system_ops', tableName: 'entity_registry' })
export class EntityRegistry {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de schema name mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_name', columnType: 'varchar' })
  schemaName!: string;

  /**
   * Valor de table name mantenido por la instancia.
   */
  @Property({ fieldName: 'table_name', columnType: 'varchar' })
  tableName!: string;

  /**
   * Identificador asociado a domain.
   */
  @Property({ fieldName: 'domain_id', type: 'uuid', nullable: true }) // FK → system_ops.data_domains
  domainId?: string;

  /**
   * Identificador asociado a classification.
   */
  @Property({ fieldName: 'classification_id', type: 'uuid', nullable: true }) // FK → system_ops.data_classifications
  classificationId?: string;

  /**
   * Valor de is append only mantenido por la instancia.
   */
  @Property({ fieldName: 'is_append_only', type: 'boolean' })
  isAppendOnly!: boolean;

  /**
   * Valor de is soft delete mantenido por la instancia.
   */
  @Property({ fieldName: 'is_soft_delete', type: 'boolean' })
  isSoftDelete!: boolean;

  /**
   * Valor de has history mantenido por la instancia.
   */
  @Property({ fieldName: 'has_history', type: 'boolean' })
  hasHistory!: boolean;

  /**
   * Valor de history table mantenido por la instancia.
   */
  @Property({
    fieldName: 'history_table',
    columnType: 'varchar',
    nullable: true,
  })
  historyTable?: string;

  /**
   * Identificador asociado a retention policy.
   */
  @Property({ fieldName: 'retention_policy_id', type: 'uuid', nullable: true }) // FK → system_ops.retention_policies
  retentionPolicyId?: string;

  /**
   * Identificador asociado a partition spec.
   */
  @Property({ fieldName: 'partition_spec_id', type: 'uuid', nullable: true }) // FK → system_ops.partition_specs
  partitionSpecId?: string;

  /**
   * Identificador asociado a write policy.
   */
  @Property({ fieldName: 'write_policy_id', type: 'uuid', nullable: true }) // FK → system_ops.write_policies
  writePolicyId?: string;

  /**
   * Valor de owner team mantenido por la instancia.
   */
  @Property({ fieldName: 'owner_team', columnType: 'varchar', nullable: true })
  ownerTeam?: string;

  /**
   * Valor de contains pii mantenido por la instancia.
   */
  @Property({ fieldName: 'contains_pii', type: 'boolean', nullable: true })
  containsPii?: boolean;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @Property({ fieldName: 'contains_phi', type: 'boolean', nullable: true })
  containsPhi?: boolean;

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
