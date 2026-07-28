import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dataset_release_requests`.
 */
@Entity({ schema: 'lakehouse', tableName: 'dataset_release_requests' })
export class DatasetReleaseRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a research project.
   */
  @Property({ fieldName: 'research_project_id', type: 'uuid' })
  researchProjectId!: string;

  /**
   * Identificador asociado a data product version.
   */
  @Property({ fieldName: 'data_product_version_id', type: 'uuid' })
  dataProductVersionId!: string;

  /**
   * Identificador asociado a cohort definition.
   */
  @Property({ fieldName: 'cohort_definition_id', type: 'uuid' })
  cohortDefinitionId!: string;

  /**
   * Valor de purpose of use code mantenido por la instancia.
   */
  @Property({ fieldName: 'purpose_of_use_code', columnType: 'varchar' })
  purposeOfUseCode!: string;

  /**
   * Identificador asociado a requested by user.
   */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId!: string;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;
}
