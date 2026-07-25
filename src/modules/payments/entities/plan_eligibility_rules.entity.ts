import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'plan_eligibility_rules' })
export class PlanEligibilityRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'plan_id', type: 'uuid' })
  planId!: string;

  @Property({ fieldName: 'eligible_practice_type_concept_id', type: 'uuid' })
  eligiblePracticeTypeConceptId!: string;

  @Property({ fieldName: 'is_included', type: 'boolean' })
  isIncluded!: boolean;

  @Property({ columnType: 'varchar', nullable: true })
  notes?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' })
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
