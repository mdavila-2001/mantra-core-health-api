import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostic_units', tableName: 'diagnostic_equipment' })
export class DiagnosticEquipment {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'diagnostic_unit_site_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_unit_sites
  diagnosticUnitSiteId!: string;

  @Property({ fieldName: 'equipment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  equipmentTypeConceptId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  manufacturer?: string;

  @Property({ columnType: 'varchar', nullable: true })
  model?: string;

  @Property({
    fieldName: 'serial_number',
    columnType: 'varchar',
    nullable: true,
  })
  serialNumber?: string;

  @Property({ fieldName: 'modality_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  modalityConceptId?: string;

  @Property({
    fieldName: 'last_calibration_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastCalibrationAt?: Date;

  @Property({
    fieldName: 'next_calibration_due_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextCalibrationDueAt?: Date;

  @Property({ fieldName: 'operational_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  operationalStatusConceptId!: string;

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
