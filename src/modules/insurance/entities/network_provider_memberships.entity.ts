import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'network_provider_memberships' })
export class NetworkProviderMemberships {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_network_id', type: 'uuid' }) // FK → insurance.provider_networks
  providerNetworkId!: string;

  @Property({ fieldName: 'provider_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  providerTypeConceptId!: string;

  @Property({ fieldName: 'provider_entity_id', type: 'uuid' })
  providerEntityId!: string;

  @Property({
    fieldName: 'practitioner_role_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practitioner_role_assignments
  practitionerRoleAssignmentId?: string;

  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  @Property({ fieldName: 'hospital_id', type: 'uuid', nullable: true }) // FK → organization_extensions.hospitals
  hospitalId?: string;

  @Property({ fieldName: 'diagnostic_unit_id', type: 'uuid', nullable: true }) // FK → diagnostic_units.diagnostic_units
  diagnosticUnitId?: string;

  @Property({ fieldName: 'pharmacy_id', type: 'uuid', nullable: true }) // FK → pharmacy.pharmacies
  pharmacyId?: string;

  @Property({
    fieldName: 'participation_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  participationLevelConceptId?: string;

  @Property({
    fieldName: 'contract_reference',
    columnType: 'varchar',
    nullable: true,
  })
  contractReference?: string;

  @Property({ fieldName: 'effective_from', columnType: 'date', nullable: true })
  effectiveFrom?: Date;

  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

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
