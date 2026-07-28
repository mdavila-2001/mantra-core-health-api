import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `coupons`.
 */
@Entity({ schema: 'promotions', tableName: 'coupons' })
export class Coupons {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a promotion.
   */
  @Property({ fieldName: 'promotion_id', type: 'uuid' }) // FK → promotions.promotions
  promotionId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Identificador asociado a coupon type concept.
   */
  @Property({ fieldName: 'coupon_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  couponTypeConceptId!: string;

  /**
   * Identificador asociado a assigned member type concept.
   */
  @Property({
    fieldName: 'assigned_member_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assignedMemberTypeConceptId?: string;

  /**
   * Identificador asociado a assigned member ref.
   */
  @Property({
    fieldName: 'assigned_member_ref_id',
    type: 'uuid',
    nullable: true,
  })
  assignedMemberRefId?: string;

  /**
   * Valor de max redemptions mantenido por la instancia.
   */
  @Property({ fieldName: 'max_redemptions', columnType: 'int', nullable: true })
  maxRedemptions?: number;

  /**
   * Valor de redemption count mantenido por la instancia.
   */
  @Property({
    fieldName: 'redemption_count',
    columnType: 'int',
    nullable: true,
  })
  redemptionCount?: number;

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
