import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `laboratory_work_order_tests`.
 */
@Entity({ schema: 'diagnostics', tableName: 'laboratory_work_order_tests' })
export class LaboratoryWorkOrderTests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a laboratory work order.
   */
  @Property({ fieldName: 'laboratory_work_order_id', type: 'uuid' }) // FK → diagnostics.laboratory_work_orders
  laboratoryWorkOrderId!: string;

  /**
   * Identificador asociado a service request.
   */
  @Property({ fieldName: 'service_request_id', type: 'uuid' }) // FK → clinical.service_requests
  serviceRequestId!: string;

  /**
   * Identificador asociado a test code concept.
   */
  @Property({ fieldName: 'test_code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  testCodeConceptId!: string;

  /**
   * Identificador asociado a specimen.
   */
  @Property({ fieldName: 'specimen_id', type: 'uuid', nullable: true }) // FK → diagnostics.specimens
  specimenId?: string;

  /**
   * Identificador asociado a method concept.
   */
  @Property({ fieldName: 'method_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  methodConceptId?: string;

  /**
   * Identificador asociado a analyzer device.
   */
  @Property({ fieldName: 'analyzer_device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  analyzerDeviceId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Identificador asociado a observation.
   */
  @Property({ fieldName: 'observation_id', type: 'uuid', nullable: true }) // FK → clinical.observations
  observationId?: string;

  /**
   * Identificador asociado a diagnostic report.
   */
  @Property({ fieldName: 'diagnostic_report_id', type: 'uuid', nullable: true }) // FK → clinical.diagnostic_reports
  diagnosticReportId?: string;

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
