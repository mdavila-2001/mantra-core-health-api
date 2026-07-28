import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `frontend_view_kpis`.
 */
@Entity({ schema: 'read_models', tableName: 'frontend_view_kpis' })
export class FrontendViewKpis {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a frontend page view.
   */
  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  /**
   * Valor de kpi code mantenido por la instancia.
   */
  @Property({ fieldName: 'kpi_code', columnType: 'varchar' })
  kpiCode!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  label!: string;

  /**
   * Valor de value column mantenido por la instancia.
   */
  @Property({ fieldName: 'value_column', columnType: 'varchar' })
  valueColumn!: string;

  /**
   * Valor de comparison column mantenido por la instancia.
   */
  @Property({ fieldName: 'comparison_column', columnType: 'varchar' })
  comparisonColumn!: string;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  /**
   * Valor de format mask mantenido por la instancia.
   */
  @Property({ fieldName: 'format_mask', columnType: 'varchar', nullable: true })
  formatMask?: string;

  /**
   * Valor de threshold rules json mantenido por la instancia.
   */
  @Property({
    fieldName: 'threshold_rules_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  thresholdRulesJson?: unknown;

  /**
   * Valor de drilldown route template mantenido por la instancia.
   */
  @Property({
    fieldName: 'drilldown_route_template',
    columnType: 'varchar',
    nullable: true,
  })
  drilldownRouteTemplate?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  ordinal!: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
