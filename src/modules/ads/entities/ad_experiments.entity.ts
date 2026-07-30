import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_experiments`.
 */
@Entity({ schema: 'ads', tableName: 'ad_experiments' })
export class AdExperiments {
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
   * Identificador asociado a experiment type concept.
   */
  @Property({ fieldName: 'experiment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  experimentTypeConceptId!: string;

  /**
   * Identificador asociado a objective metric concept.
   */
  @Property({ fieldName: 'objective_metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectiveMetricConceptId!: string;

  /**
   * Valor de hypothesis mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  hypothesis?: string;

  /**
   * Valor de holdout percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'holdout_percent',
    columnType: 'numeric',
    nullable: true,
  })
  holdoutPercent?: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startAt?: Date;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @Property({ fieldName: 'end_at', columnType: 'timestamptz', nullable: true })
  endAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a winner variant.
   */
  @Property({ fieldName: 'winner_variant_id', type: 'uuid', nullable: true }) // FK → ads.experiment_variants
  winnerVariantId?: string;

  /**
   * Valor de confidence level mantenido por la instancia.
   */
  @Property({
    fieldName: 'confidence_level',
    columnType: 'numeric',
    nullable: true,
  })
  confidenceLevel?: string;

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
