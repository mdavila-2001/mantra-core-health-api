import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `governance_change_log`.
 */
@Entity({ schema: 'system_ops', tableName: 'governance_change_log' })
export class GovernanceChangeLog {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de target type mantenido por la instancia.
   */
  @Property({ fieldName: 'target_type', columnType: 'varchar' })
  targetType!: string;

  /**
   * Identificador asociado a target.
   */
  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Identificador asociado a changed by user.
   */
  @Property({ fieldName: 'changed_by_user_id', type: 'uuid' }) // FK → iam.users
  changedByUserId!: string;

  /**
   * Valor de previous snapshot json mantenido por la instancia.
   */
  @Property({
    fieldName: 'previous_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  previousSnapshotJson?: unknown;

  /**
   * Valor de new snapshot json mantenido por la instancia.
   */
  @Property({
    fieldName: 'new_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  newSnapshotJson?: unknown;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  reason?: string;

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
