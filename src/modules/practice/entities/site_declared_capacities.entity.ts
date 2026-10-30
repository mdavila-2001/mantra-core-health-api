import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'site_declared_capacities' })
export class SiteDeclaredCapacities {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  @Property({ fieldName: 'capacity_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  capacityKindConceptId!: string;

  @Property({ columnType: 'int' })
  quantity!: number;

  @Property({ fieldName: 'as_of', columnType: 'date' })
  asOf!: Date;

  @Property({
    fieldName: 'resolution_number',
    columnType: 'varchar',
    nullable: true,
  })
  resolutionNumber?: string;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
