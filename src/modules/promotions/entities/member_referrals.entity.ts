import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `member_referrals`.
 */
@Entity({ schema: 'promotions', tableName: 'member_referrals' })
export class MemberReferrals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a referral program.
   */
  @Property({ fieldName: 'referral_program_id', type: 'uuid' }) // FK → promotions.referral_programs
  referralProgramId!: string;

  /**
   * Identificador asociado a referrer user.
   */
  @Property({ fieldName: 'referrer_user_id', type: 'uuid' }) // FK → iam.users
  referrerUserId!: string;

  /**
   * Valor de referral code mantenido por la instancia.
   */
  @Property({ fieldName: 'referral_code', columnType: 'varchar' })
  referralCode!: string;

  /**
   * Identificador asociado a referee user.
   */
  @Property({ fieldName: 'referee_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  refereeUserId?: string;

  /**
   * Valor de referee contact mantenido por la instancia.
   */
  @Property({
    fieldName: 'referee_contact',
    columnType: 'varchar',
    nullable: true,
  })
  refereeContact?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de qualified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'qualified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  qualifiedAt?: Date;

  /**
   * Identificador asociado a referrer reward ledger.
   */
  @Property({
    fieldName: 'referrer_reward_ledger_id',
    type: 'uuid',
    nullable: true,
  }) // FK → promotions.loyalty_memberships
  referrerRewardLedgerId?: string;

  /**
   * Identificador asociado a referee reward ledger.
   */
  @Property({
    fieldName: 'referee_reward_ledger_id',
    type: 'uuid',
    nullable: true,
  }) // FK → promotions.loyalty_memberships
  refereeRewardLedgerId?: string;

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
