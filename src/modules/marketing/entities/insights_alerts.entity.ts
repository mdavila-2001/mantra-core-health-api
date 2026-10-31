import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_alerts`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_alerts' })
export class InsightsAlerts {
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
   * Valor de fingerprint mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  fingerprint!: string;

  /**
   * Valor de rule code mantenido por la instancia.
   */
  @Property({ fieldName: 'rule_code', columnType: 'varchar', nullable: true })
  ruleCode?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  severityConceptId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de what text mantenido por la instancia.
   */
  @Property({ fieldName: 'what_text', columnType: 'text' })
  whatText!: string;

  /**
   * Valor de detected on mantenido por la instancia.
   */
  @Property({ fieldName: 'detected_on', columnType: 'date' })
  detectedOn!: Date;

  /**
   * Valor de magnitude mantenido por la instancia.
   */
  @Property({ columnType: 'numeric(18,4)', nullable: true })
  magnitude?: string;

  /**
   * Valor de magnitude unit mantenido por la instancia.
   */
  @Property({
    fieldName: 'magnitude_unit',
    columnType: 'varchar',
    nullable: true,
  })
  magnitudeUnit?: string;

  /**
   * Valor de source text mantenido por la instancia.
   */
  @Property({ fieldName: 'source_text', columnType: 'varchar', nullable: true })
  sourceText?: string;

  /**
   * Valor de module code mantenido por la instancia.
   */
  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  /**
   * Valor de context json mantenido por la instancia.
   */
  @Property({
    fieldName: 'context_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  contextJson?: unknown;

  /**
   * Valor de cause text mantenido por la instancia.
   */
  @Property({ fieldName: 'cause_text', columnType: 'text', nullable: true })
  causeText?: string;

  /**
   * Valor de impact text mantenido por la instancia.
   */
  @Property({ fieldName: 'impact_text', columnType: 'text', nullable: true })
  impactText?: string;

  /**
   * Valor de recommendation text mantenido por la instancia.
   */
  @Property({
    fieldName: 'recommendation_text',
    columnType: 'text',
    nullable: true,
  })
  recommendationText?: string;

  /**
   * Valor de confidence code mantenido por la instancia.
   */
  @Property({
    fieldName: 'confidence_code',
    columnType: 'varchar',
    nullable: true,
  })
  confidenceCode?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @Property({ columnType: 'smallint' })
  priority!: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de owner team code mantenido por la instancia.
   */
  @Property({
    fieldName: 'owner_team_code',
    columnType: 'varchar',
    nullable: true,
  })
  ownerTeamCode?: string;

  /**
   * Valor de evidence json mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceJson?: unknown;

  /**
   * Valor de series json mantenido por la instancia.
   */
  @Property({
    fieldName: 'series_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  seriesJson?: unknown;

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
