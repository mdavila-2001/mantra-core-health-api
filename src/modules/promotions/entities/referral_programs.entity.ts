import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `referral_programs`.
 */
@Entity({ schema: 'promotions', tableName: 'referral_programs' })
export class ReferralPrograms {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a referrer award type concept.
   */
  @Property({ fieldName: 'referrer_award_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  referrerAwardTypeConceptId!: string;

  /**
   * Valor de referrer award amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'referrer_award_amount',
    columnType: 'numeric',
    nullable: true,
  })
  referrerAwardAmount?: string;

  /**
   * Identificador asociado a referee award type concept.
   */
  @Property({ fieldName: 'referee_award_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  refereeAwardTypeConceptId!: string;

  /**
   * Valor de referee award amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'referee_award_amount',
    columnType: 'numeric',
    nullable: true,
  })
  refereeAwardAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a qualifying event concept.
   */
  @Property({
    fieldName: 'qualifying_event_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  qualifyingEventConceptId?: string;

  /**
   * Valor de max referrals per user mantenido por la instancia.
   */
  @Property({
    fieldName: 'max_referrals_per_user',
    columnType: 'int',
    nullable: true,
  })
  maxReferralsPerUser?: number;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
