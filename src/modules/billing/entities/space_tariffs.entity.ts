import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'space_tariffs' })
export class SpaceTariffs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices (inferida)
  practiceId!: string;

  @Property({ fieldName: 'tariff_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  tariffKindConceptId!: string;

  @Property({
    fieldName: 'bed_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  bedCategoryConceptId?: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces (inferida)
  careSpaceId?: string;

  @Property({ fieldName: 'service_catalog_id', type: 'uuid' }) // FK → billing.service_catalog (inferida)
  serviceCatalogId!: string;

  @Property({ fieldName: 'unit_minutes', columnType: 'int', nullable: true })
  unitMinutes?: number;

  @Property({ fieldName: 'minimum_units', columnType: 'int', nullable: true })
  minimumUnits?: number;

  @Property({ fieldName: 'unit_price', columnType: 'numeric(20,6)' })
  unitPrice!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  currencyConceptId!: string;

  @Property({ fieldName: 'valid_from', columnType: 'date' })
  validFrom!: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

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
