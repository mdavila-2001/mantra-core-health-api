import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical_ext', tableName: 'immunization_schedules' })
export class ImmunizationSchedules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'vaccine_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  vaccineConceptId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'recommended_age_days',
    columnType: 'int',
    nullable: true,
  })
  recommendedAgeDays?: number;

  @Property({ fieldName: 'dose_number', columnType: 'int', nullable: true })
  doseNumber?: number;

  @Property({ fieldName: 'interval_days', columnType: 'int', nullable: true })
  intervalDays?: number;

  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
