import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_value_audit`.
 */
@Entity({ schema: 'forms', tableName: 'field_value_audit' })
export class FieldValueAudit {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a field value.
   */
  @Property({ fieldName: 'field_value_id', type: 'uuid' }) // FK → forms.field_values
  fieldValueId!: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

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
