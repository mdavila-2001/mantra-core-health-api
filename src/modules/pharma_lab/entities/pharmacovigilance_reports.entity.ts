import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Reporte de farmacovigilancia (spec 5575-5598).
 *
 * **La identidad del paciente no entra acá.** No hay `patient_id` ni nombre: la
 * spec exige proteger la identidad del paciente (5593), y la forma de cumplirlo
 * que no depende de que alguien se acuerde es no tener la columna. Lo que sí se
 * guarda es un seudónimo opcional —edad y sexo agregados— que es lo que una
 * autoridad sanitaria necesita para evaluar el caso.
 *
 * Prohibido el uso comercial de estos datos (5598): por eso el reporte no se
 * enlaza con campañas, materiales ni contabilidad.
 */
@Entity({ schema: 'pharma_lab', tableName: 'pharmacovigilance_reports' })
export class PharmacovigilanceReports {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Laboratorio responsable del producto.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Producto involucrado.
   */
  @Property({ fieldName: 'pharma_product_id', type: 'uuid' }) // FK → pharma_lab.pharma_products
  pharmaProductId!: string;

  /**
   * Código de caso, legible y único por laboratorio.
   */
  @Property({ fieldName: 'case_code', columnType: 'varchar' })
  caseCode!: string;

  /**
   * Lote.
   */
  @Property({
    fieldName: 'batch_number',
    columnType: 'varchar',
    nullable: true,
  })
  batchNumber?: string;

  /**
   * Fecha del evento.
   */
  @Property({ fieldName: 'event_date', columnType: 'date' })
  eventDate!: string;

  /**
   * Tipo de evento.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Descripción clínica del evento, sin datos identificables.
   */
  @Property({ columnType: 'text' })
  description!: string;

  /**
   * Nivel de gravedad.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Estado del reporte.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Tipo de reportante: doctor, farmacia u organización.
   */
  @Property({ fieldName: 'reporter_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reporterTypeConceptId!: string;

  /**
   * Cuenta que envió el reporte.
   */
  @Property({ fieldName: 'reporter_user_id', type: 'uuid' }) // FK → iam.users
  reporterUserId!: string;

  /**
   * Organización del reportante, cuando la hay.
   */
  @Property({ fieldName: 'reporter_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  reporterTenantId?: string;

  /**
   * Seudónimo del caso. Nunca un identificador de paciente del sistema.
   */
  @Property({
    fieldName: 'subject_pseudonym',
    columnType: 'varchar',
    nullable: true,
  })
  subjectPseudonym?: string;

  /**
   * Edad del sujeto en años, como dato epidemiológico agregado.
   */
  @Property({
    fieldName: 'subject_age_years',
    columnType: 'int',
    nullable: true,
  })
  subjectAgeYears?: number;

  /**
   * Sexo del sujeto, como dato epidemiológico agregado.
   */
  @Property({
    fieldName: 'subject_sex_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  subjectSexConceptId?: string;

  /**
   * Momento de recepción.
   */
  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  /**
   * Momento del cierre.
   */
  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

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
