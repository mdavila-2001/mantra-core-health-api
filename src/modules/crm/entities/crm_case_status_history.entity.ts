import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_case_status_history' })
export class CrmCaseStatusHistory {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'crm_case_id', type: 'uuid' }) // FK → crm.crm_cases
  crmCaseId!: string;

  @Property({
    fieldName: 'from_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  fromStatusConceptId?: string;

  @Property({ fieldName: 'to_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toStatusConceptId!: string;

  @Property({
    fieldName: 'changed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  changedAt?: Date;

  @Property({ fieldName: 'changed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  changedByUserId?: string;

  @Property({ fieldName: 'reason_text', columnType: 'varchar', nullable: true })
  reasonText?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
