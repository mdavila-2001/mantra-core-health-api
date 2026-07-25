import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical_ext', tableName: 'clinical_alerts' })
export class ClinicalAlerts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'alert_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  alertTypeConceptId!: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  @Property({
    fieldName: 'source_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  sourceResourceType?: string;

  @Property({ fieldName: 'source_resource_id', type: 'uuid', nullable: true })
  sourceResourceId?: string;

  @Property({ fieldName: 'trigger_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  triggerConceptId?: string;

  @Property({ fieldName: 'rule_id', type: 'uuid', nullable: true }) // FK → clinical_ext.cds_rules
  ruleId?: string;

  @Property({ fieldName: 'detail_text', columnType: 'text', nullable: true })
  detailText?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'overridden_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  overriddenByUserId?: string;

  @Property({
    fieldName: 'override_reason',
    columnType: 'text',
    nullable: true,
  })
  overrideReason?: string;

  @Property({
    fieldName: 'overridden_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  overriddenAt?: Date;

  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;

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
