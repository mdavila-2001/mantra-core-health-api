import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dashboard_widgets`.
 */
@Entity({ schema: 'reporting', tableName: 'dashboard_widgets' })
export class DashboardWidgets {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dashboard.
   */
  @Property({ fieldName: 'dashboard_id', type: 'uuid' }) // FK → reporting.dashboards
  dashboardId!: string;

  /**
   * Identificador asociado a report definition.
   */
  @Property({ fieldName: 'report_definition_id', type: 'uuid', nullable: true }) // FK → reporting.report_definitions
  reportDefinitionId?: string;

  /**
   * Identificador asociado a widget type concept.
   */
  @Property({ fieldName: 'widget_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  widgetTypeConceptId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Identificador asociado a visualization concept.
   */
  @Property({
    fieldName: 'visualization_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  visualizationConceptId?: string;

  /**
   * Valor de config json mantenido por la instancia.
   */
  @Property({
    fieldName: 'config_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  configJson?: unknown;

  /**
   * Valor de position json mantenido por la instancia.
   */
  @Property({
    fieldName: 'position_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  positionJson?: unknown;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
