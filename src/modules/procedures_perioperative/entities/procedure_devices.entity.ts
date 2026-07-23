import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'procedures_perioperative', tableName: 'procedure_devices' })
export class ProcedureDevices {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_id', type: 'uuid' }) // FK → clinical.procedures
  procedureId!: string;

  @Property({ fieldName: 'device_id', type: 'uuid' }) // FK → iam.devices
  deviceId!: string;

  @Property({ fieldName: 'use_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  useRoleConceptId!: string;

  @Property({ fieldName: 'lot_number', columnType: 'varchar', nullable: true })
  lotNumber?: string;

  @Property({
    fieldName: 'serial_number',
    columnType: 'varchar',
    nullable: true,
  })
  serialNumber?: string;

  @Property({ fieldName: 'udi_carrier', columnType: 'varchar', nullable: true })
  udiCarrier?: string;

  @Property({ fieldName: 'used_at', columnType: 'timestamptz', nullable: true })
  usedAt?: Date;

  @Property({
    fieldName: 'removed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  removedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  statusConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
