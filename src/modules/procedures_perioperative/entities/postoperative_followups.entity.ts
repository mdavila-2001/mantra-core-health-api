import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'postoperative_followups',
})
export class PostoperativeFollowups {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'followup_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  followupTypeConceptId!: string;

  @Property({ fieldName: 'appointment_id', type: 'uuid', nullable: true }) // FK → clinical.appointments (inferida)
  appointmentId?: string;

  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({
    fieldName: 'completed_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  completedByProfileId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'wound_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  woundStatusConceptId?: string;

  @Property({
    fieldName: 'pain_score',
    columnType: 'numeric(8,3)',
    nullable: true,
  })
  painScore?: string;

  @Property({
    fieldName: 'complications_present',
    type: 'boolean',
    nullable: true,
  })
  complicationsPresent?: boolean;

  @Property({
    fieldName: 'instructions_text',
    columnType: 'text',
    nullable: true,
  })
  instructionsText?: string;

  @Property({
    fieldName: 'next_followup_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextFollowupAt?: Date;

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
