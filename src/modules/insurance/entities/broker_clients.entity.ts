import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'broker_clients' })
export class BrokerClients {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_broker_id', type: 'uuid' }) // FK → insurance.insurance_brokers
  insuranceBrokerId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  @Property({ fieldName: 'employer_group_id', type: 'uuid', nullable: true }) // FK → insurance.employer_groups
  employerGroupId?: string;

  @Property({ fieldName: 'client_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  clientTypeConceptId!: string;

  @Property({
    fieldName: 'assigned_broker_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  assignedBrokerUserId?: string;

  @Property({ fieldName: 'effective_from', columnType: 'date', nullable: true })
  effectiveFrom?: Date;

  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

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
