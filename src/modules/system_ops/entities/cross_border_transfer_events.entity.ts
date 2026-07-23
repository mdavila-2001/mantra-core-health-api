import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'cross_border_transfer_events' })
export class CrossBorderTransferEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'data_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dataCategoryConceptId!: string;

  @Property({ fieldName: 'source_region_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceRegionConceptId!: string;

  @Property({ fieldName: 'destination_region_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  destinationRegionConceptId!: string;

  @Property({ fieldName: 'transfer_basis_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  transferBasisConceptId!: string;

  @Property({ fieldName: 'recipient_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  recipientTenantId?: string;

  @Property({
    fieldName: 'transfer_reference',
    columnType: 'varchar',
    nullable: true,
  })
  transferReference?: string;

  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
