import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_equipment`.
 */
@Entity({ schema: 'diagnostic_units', tableName: 'diagnostic_equipment' })
export class DiagnosticEquipment {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a diagnostic unit site.
   */
  @Property({ fieldName: 'diagnostic_unit_site_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_unit_sites
  diagnosticUnitSiteId!: string;

  /**
   * Identificador asociado a equipment type concept.
   */
  @Property({ fieldName: 'equipment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  equipmentTypeConceptId!: string;

  /**
   * Valor de manufacturer mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  manufacturer?: string;

  /**
   * Valor de model mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  model?: string;

  /**
   * Valor de serial number mantenido por la instancia.
   */
  @Property({
    fieldName: 'serial_number',
    columnType: 'varchar',
    nullable: true,
  })
  serialNumber?: string;

  /**
   * Identificador asociado a modality concept.
   */
  @Property({ fieldName: 'modality_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  modalityConceptId?: string;

  /**
   * Valor de last calibration at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_calibration_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastCalibrationAt?: Date;

  /**
   * Valor de next calibration due at mantenido por la instancia.
   */
  @Property({
    fieldName: 'next_calibration_due_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextCalibrationDueAt?: Date;

  /**
   * Identificador asociado a operational status concept.
   */
  @Property({ fieldName: 'operational_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  operationalStatusConceptId!: string;

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
