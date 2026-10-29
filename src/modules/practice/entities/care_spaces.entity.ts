import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `care_spaces`.
 */
@Entity({ schema: 'practice', tableName: 'care_spaces' })
export class CareSpaces {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites
  practiceSiteId!: string;

  /**
   * Identificador asociado a clinical unit.
   */
  @Property({ fieldName: 'clinical_unit_id', type: 'uuid', nullable: true }) // FK → practice.clinical_units
  clinicalUnitId?: string;

  /**
   * Identificador asociado a parent space.
   */
  @Property({ fieldName: 'parent_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces
  parentSpaceId?: string;

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
   * Identificador asociado a space type concept.
   */
  @Property({ fieldName: 'space_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  spaceTypeConceptId!: string;

  /**
   * Valor de capacity mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  capacity?: number;

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

  @Property({ fieldName: 'prep_minutes', columnType: 'int', nullable: true })
  prepMinutes?: number;

  @Property({ fieldName: 'cleanup_minutes', columnType: 'int', nullable: true })
  cleanupMinutes?: number;

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'form_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  formConceptId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  @Property({ fieldName: 'floor_number', columnType: 'int', nullable: true })
  floorNumber?: number;

  @Property({
    fieldName: 'area_m2',
    columnType: 'numeric(10,2)',
    nullable: true,
  })
  areaM2?: string;

  @Property({ fieldName: 'asepsis_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  asepsisConceptId?: string;

  @Property({ fieldName: 'pressure_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  pressureConceptId?: string;

  @Property({
    fieldName: 'air_changes_per_hour',
    columnType: 'numeric(6,2)',
    nullable: true,
  })
  airChangesPerHour?: string;

  @Property({
    fieldName: 'hvac_validated_on',
    columnType: 'date',
    nullable: true,
  })
  hvacValidatedOn?: Date;

  @Property({
    fieldName: 'sex_restriction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  sexRestrictionConceptId?: string;

  @Property({ fieldName: 'age_group_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  ageGroupConceptId?: string;

  @Property({
    fieldName: 'bed_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  bedCategoryConceptId?: string;

  @Property({ type: 'boolean', nullable: true })
  censable?: boolean;

  @Property({ columnType: 'varchar(13)', nullable: true })
  gln?: string;

  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  @Property({
    fieldName: 'availability_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  availabilityReasonConceptId?: string;

  @Property({
    fieldName: 'availability_expected_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  availabilityExpectedUntil?: Date;

  @Property({
    fieldName: 'availability_changed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  availabilityChangedAt?: Date;

  @Property({
    fieldName: 'hygiene_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  hygieneStatusConceptId?: string;

  @Property({
    fieldName: 'hygiene_changed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  hygieneChangedAt?: Date;

  @Property({
    fieldName: 'terminal_cleaning_required',
    type: 'boolean',
    default: false,
  })
  terminalCleaningRequired!: boolean;

  @Property({ fieldName: 'isolation_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  isolationConceptId?: string;

  @Property({
    fieldName: 'isolation_organism_text',
    columnType: 'varchar',
    nullable: true,
  })
  isolationOrganismText?: string;

  @Property({
    fieldName: 'isolation_changed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  isolationChangedAt?: Date;

  @Property({ fieldName: 'ops_version', columnType: 'int' })
  opsVersion!: number;
}
