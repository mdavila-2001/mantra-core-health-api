import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'cohort_definitions' })
export class CohortDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'research_project_id', type: 'uuid' })
  researchProjectId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  version!: string;

  @Property({ fieldName: 'inclusion_expression', columnType: 'text' })
  inclusionExpression!: string;

  @Property({ fieldName: 'exclusion_expression', columnType: 'text' })
  exclusionExpression!: string;

  @Property({ fieldName: 'deidentification_profile_id', type: 'uuid' })
  deidentificationProfileId!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
