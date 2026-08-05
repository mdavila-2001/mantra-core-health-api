import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_event_field_rules`.
 */
@Entity({ schema: 'ads', tableName: 'ad_event_field_rules' })
export class AdEventFieldRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad event data policy.
   */
  @Property({ fieldName: 'ad_event_data_policy_id', type: 'uuid' }) // FK → ads.ad_event_data_policies
  adEventDataPolicyId!: string;

  /**
   * Valor de event name pattern mantenido por la instancia.
   */
  @Property({ fieldName: 'event_name_pattern', columnType: 'varchar' })
  eventNamePattern!: string;

  /**
   * Valor de field path mantenido por la instancia.
   */
  @Property({ fieldName: 'field_path', columnType: 'varchar' })
  fieldPath!: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Identificador asociado a transformation concept.
   */
  @Property({
    fieldName: 'transformation_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  transformationConceptId?: string;

  /**
   * Valor de rationale mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  rationale?: string;

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
