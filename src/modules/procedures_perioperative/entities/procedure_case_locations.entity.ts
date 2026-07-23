import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_case_locations',
})
export class ProcedureCaseLocations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces
  careSpaceId!: string;

  @Property({ fieldName: 'location_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  locationRoleConceptId!: string;

  @Property({ fieldName: 'starts_at', columnType: 'timestamptz' })
  startsAt!: Date;

  @Property({ fieldName: 'ends_at', columnType: 'timestamptz', nullable: true })
  endsAt?: Date;

  @Property({
    fieldName: 'transfer_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  transferReasonConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
