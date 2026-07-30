import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_implants`.
 */
@Entity({ schema: 'procedures_perioperative', tableName: 'procedure_implants' })
export class ProcedureImplants {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a procedure case.
   */
  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  /**
   * Identificador asociado a procedure.
   */
  @Property({ fieldName: 'procedure_id', type: 'uuid' }) // FK → clinical.procedures
  procedureId!: string;

  /**
   * Identificador asociado a implant device.
   */
  @Property({ fieldName: 'implant_device_id', type: 'uuid' }) // FK → iam.devices
  implantDeviceId!: string;

  /**
   * Identificador asociado a implant role concept.
   */
  @Property({ fieldName: 'implant_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  implantRoleConceptId!: string;

  /**
   * Identificador asociado a body site concept.
   */
  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  /**
   * Identificador asociado a laterality concept.
   */
  @Property({
    fieldName: 'laterality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lateralityConceptId?: string;

  /**
   * Valor de implanted at mantenido por la instancia.
   */
  @Property({ fieldName: 'implanted_at', columnType: 'timestamptz' })
  implantedAt!: Date;

  /**
   * Valor de explanted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'explanted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  explantedAt?: Date;

  /**
   * Identificador asociado a explant reason concept.
   */
  @Property({
    fieldName: 'explant_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  explantReasonConceptId?: string;

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
