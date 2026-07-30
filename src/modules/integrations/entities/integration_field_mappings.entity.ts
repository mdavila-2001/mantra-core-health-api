import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `integration_field_mappings`.
 */
@Entity({ schema: 'integrations', tableName: 'integration_field_mappings' })
export class IntegrationFieldMappings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a endpoint.
   */
  @Property({ fieldName: 'endpoint_id', type: 'uuid' }) // FK → integrations.integration_endpoints
  endpointId!: string;

  /**
   * Valor de source path mantenido por la instancia.
   */
  @Property({ fieldName: 'source_path', columnType: 'varchar' })
  sourcePath!: string;

  /**
   * Valor de target field mantenido por la instancia.
   */
  @Property({ fieldName: 'target_field', columnType: 'varchar' })
  targetField!: string;

  /**
   * Identificador asociado a concept map.
   */
  @Property({ fieldName: 'concept_map_id', type: 'uuid', nullable: true }) // FK → terminology.concept_maps
  conceptMapId?: string;

  /**
   * Valor de transform json mantenido por la instancia.
   */
  @Property({
    fieldName: 'transform_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  transformJson?: unknown;

  /**
   * Identificador asociado a direction concept.
   */
  @Property({ fieldName: 'direction_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  directionConceptId?: string;

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
