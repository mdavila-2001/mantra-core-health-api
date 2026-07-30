import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `cross_border_transfer_events`.
 */
@Entity({ schema: 'system_ops', tableName: 'cross_border_transfer_events' })
export class CrossBorderTransferEvents {
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
   * Identificador asociado a data category concept.
   */
  @Property({ fieldName: 'data_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dataCategoryConceptId!: string;

  /**
   * Identificador asociado a source region concept.
   */
  @Property({ fieldName: 'source_region_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceRegionConceptId!: string;

  /**
   * Identificador asociado a destination region concept.
   */
  @Property({ fieldName: 'destination_region_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  destinationRegionConceptId!: string;

  /**
   * Identificador asociado a transfer basis concept.
   */
  @Property({ fieldName: 'transfer_basis_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  transferBasisConceptId!: string;

  /**
   * Identificador asociado a recipient tenant.
   */
  @Property({ fieldName: 'recipient_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  recipientTenantId?: string;

  /**
   * Valor de transfer reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'transfer_reference',
    columnType: 'varchar',
    nullable: true,
  })
  transferReference?: string;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
