import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `automated_rules`.
 */
@Entity({ schema: 'ads', tableName: 'automated_rules' })
export class AutomatedRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad account.
   */
  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a scope concept.
   */
  @Property({ fieldName: 'scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scopeConceptId!: string;

  /**
   * Valor de entity filter json mantenido por la instancia.
   */
  @Property({
    fieldName: 'entity_filter_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  entityFilterJson?: unknown;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @Property({ fieldName: 'condition_json', type: 'json', columnType: 'jsonb' })
  conditionJson!: unknown;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Valor de action params json mantenido por la instancia.
   */
  @Property({
    fieldName: 'action_params_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  actionParamsJson?: unknown;

  /**
   * Identificador asociado a evaluation schedule concept.
   */
  @Property({ fieldName: 'evaluation_schedule_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  evaluationScheduleConceptId!: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'is_enabled', type: 'boolean', nullable: true })
  isEnabled?: boolean;

  /**
   * Valor de last evaluated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_evaluated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastEvaluatedAt?: Date;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
