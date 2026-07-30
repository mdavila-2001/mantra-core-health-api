import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `activity_event_schema_definitions`.
 */
@Entity({ schema: 'telemetry', tableName: 'activity_event_schema_definitions' })
export class ActivityEventSchemaDefinitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de event name mantenido por la instancia.
   */
  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_version', columnType: 'int' })
  schemaVersion!: number;

  /**
   * Identificador asociado a purpose definition.
   */
  @Property({ fieldName: 'purpose_definition_id', type: 'uuid' }) // FK → telemetry.tracking_purpose_definitions
  purposeDefinitionId!: string;

  /**
   * Identificador asociado a portal type concept.
   */
  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  portalTypeConceptId!: string;

  /**
   * Valor de property schema json mantenido por la instancia.
   */
  @Property({
    fieldName: 'property_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  propertySchemaJson?: unknown;

  /**
   * Valor de prohibited property patterns json mantenido por la instancia.
   */
  @Property({
    fieldName: 'prohibited_property_patterns_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  prohibitedPropertyPatternsJson?: unknown;

  /**
   * Identificador asociado a pii classification concept.
   */
  @Property({
    fieldName: 'pii_classification_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  piiClassificationConceptId?: string;

  /**
   * Valor de phi allowed mantenido por la instancia.
   */
  @Property({ fieldName: 'phi_allowed', type: 'boolean', nullable: true })
  phiAllowed?: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
