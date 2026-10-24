import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Campaña preventiva de una aseguradora (Tarea 4 · M-06). La patología CIE-10 sólo describe
 * lo que se previene: nunca filtra afiliados por su historia clínica (decisión D4).
 */
@Entity({ schema: 'insurance', tableName: 'insurance_campaigns' })
export class InsuranceCampaigns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_carrier_id', type: 'uuid' }) // FK → insurance.insurance_carriers (inferida)
  insuranceCarrierId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'campaign_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  campaignTypeConceptId!: string;

  @Property({
    fieldName: 'target_condition_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  targetConditionConceptId?: string;

  @Property({ fieldName: 'copay_bonus_percentage', columnType: 'numeric' })
  copayBonusPercentage!: string;

  @Property({ fieldName: 'valid_from', columnType: 'date' })
  validFrom!: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date' })
  validTo!: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  @Property({
    fieldName: 'activated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  activatedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
