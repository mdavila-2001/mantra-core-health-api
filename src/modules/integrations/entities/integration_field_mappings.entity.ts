import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'integrations', tableName: 'integration_field_mappings' })
export class IntegrationFieldMappings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'endpoint_id', type: 'uuid' }) // FK (destino no resuelto)
  endpointId!: string;

  @Property({ fieldName: 'source_path', columnType: 'varchar' })
  sourcePath!: string;

  @Property({ fieldName: 'target_field', columnType: 'varchar' })
  targetField!: string;

  @Property({ fieldName: 'concept_map_id', type: 'uuid', nullable: true }) // FK → terminology.concept_maps
  conceptMapId?: string;

  @Property({
    fieldName: 'transform_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  transformJson?: unknown;

  @Property({ fieldName: 'direction_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  directionConceptId?: string;

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
