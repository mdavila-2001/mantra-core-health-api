import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Encuesta post-visita configurada por el laboratorio (spec 5526-5547).
 *
 * Es una encuesta **de esta relación laboratorio–doctor**, no un formulario
 * clínico: por eso vive acá y no en `forms`. Sus respuestas individuales son
 * privadas y solo se exponen agregadas.
 */
@Entity({ schema: 'pharma_lab', tableName: 'visit_surveys' })
export class VisitSurveys {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Laboratorio que la configura.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Título.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Visitador al que se acota, si aplica.
   */
  @Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true }) // FK → pharma_lab.medical_visitors
  medicalVisitorId?: string;

  /**
   * Producto al que se acota, si aplica.
   */
  @Property({ fieldName: 'pharma_product_id', type: 'uuid', nullable: true }) // FK → pharma_lab.pharma_products
  pharmaProductId?: string;

  /**
   * Campaña a la que se acota.
   */
  @Property({
    fieldName: 'campaign_code',
    columnType: 'varchar',
    nullable: true,
  })
  campaignCode?: string;

  /**
   * Especialidad a la que se acota.
   */
  @Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  specialtyConceptId?: string;

  /**
   * Inicio de vigencia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date' })
  validFrom!: string;

  /**
   * Fin de vigencia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: string;

  /**
   * Horas después de la visita en que se envía.
   */
  @Property({ fieldName: 'send_delay_hours', columnType: 'int' })
  sendDelayHours: number = 24;

  /**
   * Cantidad de recordatorios programados.
   */
  @Property({ fieldName: 'reminder_count', columnType: 'int' })
  reminderCount: number = 0;

  /**
   * Estado de la encuesta.
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
