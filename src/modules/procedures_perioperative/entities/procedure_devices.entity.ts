import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_devices`.
 */
@Entity({ schema: 'procedures_perioperative', tableName: 'procedure_devices' })
export class ProcedureDevices {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a procedure.
   */
  @Property({ fieldName: 'procedure_id', type: 'uuid' }) // FK → clinical.procedures
  procedureId!: string;

  /**
   * Identificador asociado a device.
   */
  @Property({ fieldName: 'device_id', type: 'uuid' }) // FK → iam.devices
  deviceId!: string;

  /**
   * Identificador asociado a use role concept.
   */
  @Property({ fieldName: 'use_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  useRoleConceptId!: string;

  /**
   * Valor de lot number mantenido por la instancia.
   */
  @Property({ fieldName: 'lot_number', columnType: 'varchar', nullable: true })
  lotNumber?: string;

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
   * Valor de udi carrier mantenido por la instancia.
   */
  @Property({ fieldName: 'udi_carrier', columnType: 'varchar', nullable: true })
  udiCarrier?: string;

  /**
   * Valor de used at mantenido por la instancia.
   */
  @Property({ fieldName: 'used_at', columnType: 'timestamptz', nullable: true })
  usedAt?: Date;

  /**
   * Valor de removed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'removed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  removedAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  statusConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
