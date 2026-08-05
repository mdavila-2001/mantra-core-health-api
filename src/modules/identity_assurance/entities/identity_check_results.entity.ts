import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `identity_check_results`.
 */
@Entity({ schema: 'identity_assurance', tableName: 'identity_check_results' })
export class IdentityCheckResults {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a identity check.
   */
  @Property({ fieldName: 'identity_check_id', type: 'uuid' }) // FK → identity_assurance.identity_checks
  identityCheckId!: string;

  /**
   * Valor de result version mantenido por la instancia.
   */
  @Property({ fieldName: 'result_version', columnType: 'int' })
  resultVersion!: number;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Valor de match score mantenido por la instancia.
   */
  @Property({ fieldName: 'match_score', columnType: 'numeric', nullable: true })
  matchScore?: string;

  /**
   * Valor de discrepancy codes json mantenido por la instancia.
   */
  @Property({
    fieldName: 'discrepancy_codes_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  discrepancyCodesJson?: unknown;

  /**
   * Valor de source response hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_response_hash',
    columnType: 'varchar',
    nullable: true,
  })
  sourceResponseHash?: string;

  /**
   * Identificador asociado a supersedes result.
   */
  @Property({ fieldName: 'supersedes_result_id', type: 'uuid', nullable: true }) // FK → identity_assurance.identity_check_results
  supersedesResultId?: string;

  /**
   * Valor de checked at mantenido por la instancia.
   */
  @Property({ fieldName: 'checked_at', columnType: 'timestamptz' })
  checkedAt!: Date;

  /**
   * Identificador asociado a checked by actor type concept.
   */
  @Property({
    fieldName: 'checked_by_actor_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  checkedByActorTypeConceptId?: string;

  /**
   * Identificador asociado a checked by actor.
   */
  @Property({ fieldName: 'checked_by_actor_id', type: 'uuid', nullable: true })
  checkedByActorId?: string;
}
