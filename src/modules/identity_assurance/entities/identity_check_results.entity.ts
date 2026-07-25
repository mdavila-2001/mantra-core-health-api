import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'identity_assurance', tableName: 'identity_check_results' })
export class IdentityCheckResults {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'identity_check_id', type: 'uuid' }) // FK → identity_assurance.identity_checks
  identityCheckId!: string;

  @Property({ fieldName: 'result_version', columnType: 'int' })
  resultVersion!: number;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({ fieldName: 'match_score', columnType: 'numeric', nullable: true })
  matchScore?: string;

  @Property({
    fieldName: 'discrepancy_codes_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  discrepancyCodesJson?: unknown;

  @Property({
    fieldName: 'source_response_hash',
    columnType: 'varchar',
    nullable: true,
  })
  sourceResponseHash?: string;

  @Property({ fieldName: 'supersedes_result_id', type: 'uuid', nullable: true }) // FK → identity_assurance.identity_check_results
  supersedesResultId?: string;

  @Property({ fieldName: 'checked_at', columnType: 'timestamptz' })
  checkedAt!: Date;

  @Property({
    fieldName: 'checked_by_actor_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  checkedByActorTypeConceptId?: string;

  @Property({ fieldName: 'checked_by_actor_id', type: 'uuid', nullable: true })
  checkedByActorId?: string;
}
