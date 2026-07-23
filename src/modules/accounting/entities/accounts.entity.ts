import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'accounts' })
export class Accounts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'account_group_id', type: 'uuid', nullable: true }) // FK → accounting.account_groups
  accountGroupId?: string;

  @Property({ fieldName: 'account_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accountTypeConceptId!: string;

  @Property({ fieldName: 'normal_balance_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  normalBalanceConceptId!: string;

  @Property({ fieldName: 'parent_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  parentAccountId?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'is_configurable', type: 'boolean' })
  isConfigurable!: boolean;

  @Property({ fieldName: 'is_system', type: 'boolean', nullable: true })
  isSystem?: boolean;

  @Property({ fieldName: 'is_postable', type: 'boolean' })
  isPostable!: boolean;

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
