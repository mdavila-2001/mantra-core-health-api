import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Campaña preventiva de una aseguradora (Tarea 4 · M-06). La patología CIE-10 sólo describe
 * lo que se previene: nunca filtra afiliados por su historia clínica (decisión D4).
 */
@Entity({ schema: 'insurance', tableName: 'insurance_campaigns' })
export class InsuranceCampaigns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance carrier.
   */
  @Property({ fieldName: 'insurance_carrier_id', type: 'uuid' }) // FK → insurance.insurance_carriers
  insuranceCarrierId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a campaign type concept.
   */
  @Property({ fieldName: 'campaign_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  campaignTypeConceptId!: string;

  /**
   * Identificador asociado a target condition concept.
   */
  @Property({
    fieldName: 'target_condition_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  targetConditionConceptId?: string;

  /**
   * Valor de copay bonus percentage mantenido por la instancia.
   */
  @Property({ fieldName: 'copay_bonus_percentage', columnType: 'numeric' })
  copayBonusPercentage!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date' })
  validFrom!: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date' })
  validTo!: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de activated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'activated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  activatedAt?: Date;

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
