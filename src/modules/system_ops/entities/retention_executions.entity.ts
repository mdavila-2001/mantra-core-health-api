import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `retention_executions`.
 */
@Entity({ schema: 'system_ops', tableName: 'retention_executions' })
export class RetentionExecutions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a retention policy.
   */
  @Property({ fieldName: 'retention_policy_id', type: 'uuid' }) // FK → system_ops.retention_policies
  retentionPolicyId!: string;

  /**
   * Identificador asociado a entity registry.
   */
  @Property({ fieldName: 'entity_registry_id', type: 'uuid', nullable: true }) // FK → system_ops.entity_registry
  entityRegistryId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  /**
   * Valor de total scanned mantenido por la instancia.
   */
  @Property({ fieldName: 'total_scanned', type: 'bigint', nullable: true })
  totalScanned?: string;

  /**
   * Valor de total deleted mantenido por la instancia.
   */
  @Property({ fieldName: 'total_deleted', type: 'bigint', nullable: true })
  totalDeleted?: string;

  /**
   * Valor de total anonymized mantenido por la instancia.
   */
  @Property({ fieldName: 'total_anonymized', type: 'bigint', nullable: true })
  totalAnonymized?: string;

  /**
   * Valor de total archived mantenido por la instancia.
   */
  @Property({ fieldName: 'total_archived', type: 'bigint', nullable: true })
  totalArchived?: string;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
