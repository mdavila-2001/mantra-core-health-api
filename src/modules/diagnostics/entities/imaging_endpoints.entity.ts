import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'imaging_endpoints' })
export class ImagingEndpoints {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'endpoint_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  endpointTypeConceptId!: string;

  @Property({ fieldName: 'base_uri', columnType: 'text' })
  baseUri!: string;

  @Property({ fieldName: 'connection_id', type: 'uuid', nullable: true }) // FK → integrations.provider_connections
  connectionId?: string;

  @Property({
    fieldName: 'storage_region_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  storageRegionConceptId?: string;

  @Property({
    fieldName: 'dicom_conformance_statement_uri',
    columnType: 'text',
    nullable: true,
  })
  dicomConformanceStatementUri?: string;

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
