import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `service_level_indicators`.
 */
@Entity({ schema: 'platform_ops', tableName: 'service_level_indicators' })
export class ServiceLevelIndicators {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a service component.
   */
  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a indicator type concept.
   */
  @Property({ fieldName: 'indicator_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  indicatorTypeConceptId!: string;

  /**
   * Valor de query definition json mantenido por la instancia.
   */
  @Property({
    fieldName: 'query_definition_json',
    type: 'json',
    columnType: 'jsonb',
  })
  queryDefinitionJson!: unknown;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  unitConceptId!: string;

  /**
   * Valor de good event definition mantenido por la instancia.
   */
  @Property({
    fieldName: 'good_event_definition',
    columnType: 'text',
    nullable: true,
  })
  goodEventDefinition?: string;

  /**
   * Valor de total event definition mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_event_definition',
    columnType: 'text',
    nullable: true,
  })
  totalEventDefinition?: string;

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
