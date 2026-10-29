import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practice_sites`.
 */
@Entity({ schema: 'practice', tableName: 'practice_sites' })
export class PracticeSites {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Identificador asociado a branch.
   */
  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a site type concept.
   */
  @Property({ fieldName: 'site_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  siteTypeConceptId!: string;

  /**
   * Identificador asociado a physical type concept.
   */
  @Property({
    fieldName: 'physical_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  physicalTypeConceptId?: string;

  /**
   * Identificador asociado a operational status concept.
   */
  @Property({
    fieldName: 'operational_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  operationalStatusConceptId?: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @Property({ fieldName: 'time_zone', columnType: 'varchar', nullable: true })
  timeZone?: string;

  /**
   * Identificador asociado a address.
   */
  @Property({ fieldName: 'address_id', type: 'uuid', nullable: true }) // FK → common.addresses
  addressId?: string;

  /**
   * Identificador asociado a managing tenant.
   */
  @Property({ fieldName: 'managing_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  managingTenantId?: string;

  /**
   * Archivo del QR de cobro bancario de la sede, en `common.files`. Nulo si la
   * sede no cobra por QR.
   */
  @Property({ fieldName: 'bank_qr_file_id', type: 'uuid', nullable: true }) // FK → common.files (inferida)
  bankQrFileId?: string;

  @Property({ fieldName: 'logo_file_id', type: 'uuid', nullable: true }) // FK → common.files (inferida)
  logoFileId?: string;

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

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'snis_code', columnType: 'varchar', nullable: true })
  snisCode?: string;

  @Property({ fieldName: 'subsector_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  subsectorConceptId?: string;

  @Property({
    fieldName: 'care_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  careLevelConceptId?: string;

  @Property({
    fieldName: 'facility_typology_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  facilityTypologyConceptId?: string;

  @Property({
    fieldName: 'managing_entity_name',
    columnType: 'varchar',
    nullable: true,
  })
  managingEntityName?: string;

  @Property({
    fieldName: 'health_network_name',
    columnType: 'varchar',
    nullable: true,
  })
  healthNetworkName?: string;

  @Property({
    fieldName: 'sedes_department_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  sedesDepartmentConceptId?: string;

  @Property({
    fieldName: 'municipality_name',
    columnType: 'varchar',
    nullable: true,
  })
  municipalityName?: string;

  @Property({
    fieldName: 'snis_verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  snisVerifiedAt?: Date;

  @Property({
    fieldName: 'snis_verified_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users (inferida)
  snisVerifiedByUserId?: string;
}
