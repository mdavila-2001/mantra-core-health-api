import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'activity_event_schema_definitions' })
export class ActivityEventSchemaDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  @Property({ fieldName: 'schema_version', columnType: 'int' })
  schemaVersion!: number;

  @Property({ fieldName: 'purpose_definition_id', type: 'uuid' }) // FK (destino no resuelto)
  purposeDefinitionId!: string;

  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  portalTypeConceptId!: string;

  @Property({
    fieldName: 'property_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  propertySchemaJson?: unknown;

  @Property({
    fieldName: 'prohibited_property_patterns_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  prohibitedPropertyPatternsJson?: unknown;

  @Property({
    fieldName: 'pii_classification_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  piiClassificationConceptId?: string;

  @Property({ fieldName: 'phi_allowed', type: 'boolean', nullable: true })
  phiAllowed?: boolean;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
