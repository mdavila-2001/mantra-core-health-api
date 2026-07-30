import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `organization_affiliations`.
 */
@Entity({
  schema: 'organization_extensions',
  tableName: 'organization_affiliations',
})
export class OrganizationAffiliations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a primary tenant.
   */
  @Property({ fieldName: 'primary_tenant_id', type: 'uuid' }) // FK → directory.tenants
  primaryTenantId!: string;

  /**
   * Identificador asociado a participating tenant.
   */
  @Property({ fieldName: 'participating_tenant_id', type: 'uuid' }) // FK → directory.tenants
  participatingTenantId!: string;

  /**
   * Identificador asociado a affiliation type concept.
   */
  @Property({ fieldName: 'affiliation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  affiliationTypeConceptId!: string;

  /**
   * Identificador asociado a host practice site.
   */
  @Property({
    fieldName: 'host_practice_site_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practice_sites
  hostPracticeSiteId?: string;

  /**
   * Identificador asociado a healthcare service.
   */
  @Property({
    fieldName: 'healthcare_service_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.healthcare_services
  healthcareServiceId?: string;

  /**
   * Valor de contract reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'contract_reference',
    columnType: 'varchar',
    nullable: true,
  })
  contractReference?: string;

  /**
   * Identificador asociado a data use agreement.
   */
  @Property({
    fieldName: 'data_use_agreement_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  dataUseAgreementId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
