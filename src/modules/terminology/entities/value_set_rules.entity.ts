import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'terminology', tableName: 'value_set_rules' })
export class ValueSetRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'value_set_version_id', type: 'uuid' }) // FK → terminology.value_set_versions
  valueSetVersionId!: string;

  @Property({ fieldName: 'code_system_id', type: 'uuid' }) // FK → terminology.code_systems
  codeSystemId!: string;

  @Property({ fieldName: 'operator_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  operatorConceptId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  property?: string;

  @Property({ columnType: 'varchar', nullable: true })
  value?: string;

  @Property({ type: 'boolean' })
  included!: boolean;

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
