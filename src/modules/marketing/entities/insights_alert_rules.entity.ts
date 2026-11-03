import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_alert_rules`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_alert_rules' })
export class InsightsAlertRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

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
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  severityConceptId!: string;

  /**
   * Valor de unit mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  unit!: string;

  /**
   * Valor de default threshold mantenido por la instancia.
   */
  @Property({ fieldName: 'default_threshold', columnType: 'numeric(18,4)' })
  defaultThreshold!: string;

  /**
   * Valor de threshold mantenido por la instancia.
   */
  @Property({ columnType: 'numeric(18,4)' })
  threshold!: string;

  /**
   * Valor de direction mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  direction!: string;

  /**
   * Valor de enabled mantenido por la instancia.
   */
  @Property({ type: 'boolean', default: true })
  enabled!: boolean;

  /**
   * Valor de min sample json mantenido por la instancia.
   */
  @Property({
    fieldName: 'min_sample_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  minSampleJson?: unknown;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
