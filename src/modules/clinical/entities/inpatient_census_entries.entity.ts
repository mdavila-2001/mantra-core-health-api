import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'inpatient_census_entries' })
export class InpatientCensusEntries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'census_day_id', type: 'uuid' }) // FK (destino no resuelto)
  censusDayId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters (inferida)
  encounterId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles (inferida)
  patientProfileId!: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces (inferida)
  careSpaceId?: string;

  @Property({
    fieldName: 'bed_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  bedCategoryConceptId?: string;

  @Property({ fieldName: 'movement_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  movementConceptId!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
