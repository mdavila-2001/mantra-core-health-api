import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'service_level_indicators' })
export class ServiceLevelIndicators {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'indicator_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  indicatorTypeConceptId!: string;

  @Property({
    fieldName: 'query_definition_json',
    type: 'json',
    columnType: 'jsonb',
  })
  queryDefinitionJson!: unknown;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  unitConceptId!: string;

  @Property({
    fieldName: 'good_event_definition',
    columnType: 'text',
    nullable: true,
  })
  goodEventDefinition?: string;

  @Property({
    fieldName: 'total_event_definition',
    columnType: 'text',
    nullable: true,
  })
  totalEventDefinition?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
