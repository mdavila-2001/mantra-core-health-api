import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'common', tableName: 'addresses' })
export class Addresses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'owner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ownerTypeConceptId!: string;

  @Property({ fieldName: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Property({ fieldName: 'use_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  useConceptId?: string;

  @Property({ fieldName: 'type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  typeConceptId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  lines?: string;

  @Property({ columnType: 'varchar', nullable: true })
  city?: string;

  @Property({
    fieldName: 'administrative_area_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  administrativeAreaConceptId?: string;

  @Property({ fieldName: 'postal_code', columnType: 'varchar', nullable: true })
  postalCode?: string;

  @Property({ fieldName: 'country_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  countryConceptId!: string;

  @Property({ columnType: 'numeric', nullable: true })
  latitude?: string;

  @Property({ columnType: 'numeric', nullable: true })
  longitude?: string;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
