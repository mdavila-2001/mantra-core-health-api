import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'facility_typology_rules' })
export class FacilityTypologyRules {
  @PrimaryKey({ fieldName: 'typology_concept_id', type: 'uuid' })
  typologyConceptId: string = randomUUID();

  @PrimaryKey({ fieldName: 'space_function_concept_id', type: 'uuid' })
  spaceFunctionConceptId: string = randomUUID();

  @Property({ fieldName: 'rule_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  ruleConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
