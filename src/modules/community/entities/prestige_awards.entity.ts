import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `prestige_awards`.
 */
@Entity({ schema: 'community', tableName: 'prestige_awards' })
export class PrestigeAwards {
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
   * Identificador asociado a subject type concept.
   */
  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a subject ref.
   */
  @Property({ fieldName: 'subject_ref_id', type: 'uuid' })
  subjectRefId!: string;

  /**
   * Identificador asociado a public profile.
   */
  @Property({ fieldName: 'public_profile_id', type: 'uuid', nullable: true }) // FK → community.public_profiles
  publicProfileId?: string;

  /**
   * Identificador asociado a direction concept.
   */
  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  /**
   * Valor de points mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  points!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  /**
   * Valor de note mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  note?: string;

  /**
   * Identificador asociado a awarded by user.
   */
  @Property({ fieldName: 'awarded_by_user_id', type: 'uuid' }) // FK → iam.users
  awardedByUserId!: string;

  /**
   * Valor de source type mantenido por la instancia.
   */
  @Property({ fieldName: 'source_type', columnType: 'varchar', nullable: true })
  sourceType?: string;

  /**
   * Identificador asociado a source ref.
   */
  @Property({ fieldName: 'source_ref_id', type: 'uuid', nullable: true })
  sourceRefId?: string;

  /**
   * Valor de balance after mantenido por la instancia.
   */
  @Property({
    fieldName: 'balance_after',
    columnType: 'numeric',
    nullable: true,
  })
  balanceAfter?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
