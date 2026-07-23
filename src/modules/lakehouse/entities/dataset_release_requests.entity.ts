import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'dataset_release_requests' })
export class DatasetReleaseRequests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'research_project_id', type: 'uuid' })
  researchProjectId!: string;

  @Property({ fieldName: 'data_product_version_id', type: 'uuid' })
  dataProductVersionId!: string;

  @Property({ fieldName: 'cohort_definition_id', type: 'uuid' })
  cohortDefinitionId!: string;

  @Property({ fieldName: 'purpose_of_use_code', columnType: 'varchar' })
  purposeOfUseCode!: string;

  @Property({ fieldName: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId!: string;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({ columnType: 'varchar' })
  status!: string;
}
