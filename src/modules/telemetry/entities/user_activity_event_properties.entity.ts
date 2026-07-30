import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `user_activity_event_properties`.
 */
@Entity({ schema: 'telemetry', tableName: 'user_activity_event_properties' })
export class UserActivityEventProperties {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user activity event.
   */
  @Property({ fieldName: 'user_activity_event_id', type: 'uuid' }) // FK → telemetry.user_activity_events
  userActivityEventId!: string;

  /**
   * Valor de property name mantenido por la instancia.
   */
  @Property({ fieldName: 'property_name', columnType: 'varchar' })
  propertyName!: string;

  /**
   * Identificador asociado a value type concept.
   */
  @Property({ fieldName: 'value_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  valueTypeConceptId!: string;

  /**
   * Valor de value string mantenido por la instancia.
   */
  @Property({ fieldName: 'value_string', columnType: 'text', nullable: true })
  valueString?: string;

  /**
   * Valor de value number mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_number',
    columnType: 'numeric',
    nullable: true,
  })
  valueNumber?: string;

  /**
   * Valor de value boolean mantenido por la instancia.
   */
  @Property({ fieldName: 'value_boolean', type: 'boolean', nullable: true })
  valueBoolean?: boolean;

  /**
   * Valor de value timestamp mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_timestamp',
    columnType: 'timestamptz',
    nullable: true,
  })
  valueTimestamp?: Date;

  /**
   * Identificador asociado a value concept.
   */
  @Property({ fieldName: 'value_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  valueConceptId?: string;

  /**
   * Valor de value hash mantenido por la instancia.
   */
  @Property({ fieldName: 'value_hash', columnType: 'varchar', nullable: true })
  valueHash?: string;

  /**
   * Identificador asociado a data classification concept.
   */
  @Property({ fieldName: 'data_classification_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dataClassificationConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
