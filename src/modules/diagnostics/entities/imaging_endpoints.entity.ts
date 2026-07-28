import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `imaging_endpoints`.
 */
@Entity({ schema: 'diagnostics', tableName: 'imaging_endpoints' })
export class ImagingEndpoints {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a endpoint type concept.
   */
  @Property({ fieldName: 'endpoint_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  endpointTypeConceptId!: string;

  /**
   * Valor de base uri mantenido por la instancia.
   */
  @Property({ fieldName: 'base_uri', columnType: 'text' })
  baseUri!: string;

  /**
   * Identificador asociado a connection.
   */
  @Property({ fieldName: 'connection_id', type: 'uuid', nullable: true }) // FK → integrations.provider_connections
  connectionId?: string;

  /**
   * Identificador asociado a storage region concept.
   */
  @Property({
    fieldName: 'storage_region_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  storageRegionConceptId?: string;

  /**
   * Valor de dicom conformance statement uri mantenido por la instancia.
   */
  @Property({
    fieldName: 'dicom_conformance_statement_uri',
    columnType: 'text',
    nullable: true,
  })
  dicomConformanceStatementUri?: string;

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
