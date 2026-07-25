import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'clinical_units' })
export class ClinicalUnits {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites
  practiceSiteId!: string;

  @Property({ fieldName: 'parent_unit_id', type: 'uuid', nullable: true }) // FK → practice.clinical_units
  parentUnitId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'unit_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  unitTypeConceptId!: string;

  @Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  specialtyConceptId?: string;

  @Property({
    fieldName: 'service_mode_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  serviceModeConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
