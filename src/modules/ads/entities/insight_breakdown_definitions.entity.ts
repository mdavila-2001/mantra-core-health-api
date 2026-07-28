import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insight_breakdown_definitions`.
 */
@Entity({ schema: 'ads', tableName: 'insight_breakdown_definitions' })
export class InsightBreakdownDefinitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a platform concept.
   */
  @Property({ fieldName: 'platform_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  platformConceptId!: string;

  /**
   * Valor de breakdown code mantenido por la instancia.
   */
  @Property({ fieldName: 'breakdown_code', columnType: 'varchar' })
  breakdownCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de compatible metrics json mantenido por la instancia.
   */
  @Property({
    fieldName: 'compatible_metrics_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  compatibleMetricsJson?: unknown;

  /**
   * Valor de privacy threshold json mantenido por la instancia.
   */
  @Property({
    fieldName: 'privacy_threshold_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  privacyThresholdJson?: unknown;

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
