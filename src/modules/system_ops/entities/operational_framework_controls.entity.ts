import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `operational_framework_controls`.
 */
@Entity({ schema: 'system_ops', tableName: 'operational_framework_controls' })
export class OperationalFrameworkControls {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a operational framework.
   */
  @Property({ fieldName: 'operational_framework_id', type: 'uuid' }) // FK → system_ops.operational_frameworks
  operationalFrameworkId!: string;

  /**
   * Identificador asociado a parent control.
   */
  @Property({ fieldName: 'parent_control_id', type: 'uuid', nullable: true }) // FK → system_ops.operational_framework_controls
  parentControlId?: string;

  /**
   * Valor de control code mantenido por la instancia.
   */
  @Property({ fieldName: 'control_code', columnType: 'varchar' })
  controlCode!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Identificador asociado a pillar concept.
   */
  @Property({ fieldName: 'pillar_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  pillarConceptId?: string;

  /**
   * Valor de objective text mantenido por la instancia.
   */
  @Property({ fieldName: 'objective_text', columnType: 'text', nullable: true })
  objectiveText?: string;

  /**
   * Valor de evidence requirements json mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_requirements_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceRequirementsJson?: unknown;

  /**
   * Valor de assessment guidance json mantenido por la instancia.
   */
  @Property({
    fieldName: 'assessment_guidance_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  assessmentGuidanceJson?: unknown;

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
