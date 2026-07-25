import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_performers',
})
export class ProcedurePerformers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_id', type: 'uuid' }) // FK → clinical.procedures
  procedureId!: string;

  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  @Property({ fieldName: 'performer_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  performerRoleConceptId!: string;

  @Property({ fieldName: 'organization_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  organizationId?: string;

  @Property({
    fieldName: 'starts_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startsAt?: Date;

  @Property({ fieldName: 'ends_at', columnType: 'timestamptz', nullable: true })
  endsAt?: Date;

  @Property({
    fieldName: 'contribution_text',
    columnType: 'text',
    nullable: true,
  })
  contributionText?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
