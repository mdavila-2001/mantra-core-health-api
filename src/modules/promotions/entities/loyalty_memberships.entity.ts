import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `loyalty_memberships`.
 */
@Entity({ schema: 'promotions', tableName: 'loyalty_memberships' })
export class LoyaltyMemberships {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a loyalty program.
   */
  @Property({ fieldName: 'loyalty_program_id', type: 'uuid' }) // FK → promotions.loyalty_programs
  loyaltyProgramId!: string;

  /**
   * Identificador asociado a member type concept.
   */
  @Property({ fieldName: 'member_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberTypeConceptId!: string;

  /**
   * Identificador asociado a member ref.
   */
  @Property({ fieldName: 'member_ref_id', type: 'uuid' })
  memberRefId!: string;

  /**
   * Identificador asociado a current tier.
   */
  @Property({ fieldName: 'current_tier_id', type: 'uuid', nullable: true }) // FK → promotions.loyalty_tiers
  currentTierId?: string;

  /**
   * Valor de points balance mantenido por la instancia.
   */
  @Property({
    fieldName: 'points_balance',
    columnType: 'numeric',
    nullable: true,
  })
  pointsBalance?: string;

  /**
   * Valor de lifetime points mantenido por la instancia.
   */
  @Property({
    fieldName: 'lifetime_points',
    columnType: 'numeric',
    nullable: true,
  })
  lifetimePoints?: string;

  /**
   * Valor de enrolled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'enrolled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  enrolledAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
