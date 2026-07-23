import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'operational_framework_controls' })
export class OperationalFrameworkControls {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'operational_framework_id', type: 'uuid' }) // FK → system_ops.operational_frameworks
  operationalFrameworkId!: string;

  @Property({ fieldName: 'parent_control_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  parentControlId?: string;

  @Property({ fieldName: 'control_code', columnType: 'varchar' })
  controlCode!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ fieldName: 'pillar_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  pillarConceptId?: string;

  @Property({ fieldName: 'objective_text', columnType: 'text', nullable: true })
  objectiveText?: string;

  @Property({
    fieldName: 'evidence_requirements_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceRequirementsJson?: unknown;

  @Property({
    fieldName: 'assessment_guidance_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  assessmentGuidanceJson?: unknown;

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
