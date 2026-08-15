import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Repositorio documental legal y regulatorio del laboratorio (spec 5600-5629).
 *
 * No hay borrado definitivo (5628): un documento usado como respaldo se
 * invalida o se sustituye, y ambas cosas son transiciones de estado con su
 * versión nueva, nunca un `DELETE`.
 */
@Entity({ schema: 'pharma_lab', tableName: 'regulatory_documents' })
export class RegulatoryDocuments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Laboratorio propietario.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Producto al que respalda, si aplica.
   */
  @Property({ fieldName: 'pharma_product_id', type: 'uuid', nullable: true }) // FK → pharma_lab.pharma_products
  pharmaProductId?: string;

  /**
   * Visitador al que respalda, si aplica (contrato, credenciales).
   */
  @Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true }) // FK → pharma_lab.medical_visitors
  medicalVisitorId?: string;

  /**
   * Nombre del documento.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Tipo documental.
   */
  @Property({ fieldName: 'document_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  documentTypeConceptId!: string;

  /**
   * Código del documento.
   */
  @Property({ columnType: 'varchar', nullable: true })
  code?: string;

  /**
   * Versión vigente.
   */
  @Property({ fieldName: 'current_version', columnType: 'varchar' })
  currentVersion!: string;

  /**
   * Entidad emisora.
   */
  @Property({ fieldName: 'issuer_name', columnType: 'varchar', nullable: true })
  issuerName?: string;

  /**
   * Fecha de emisión.
   */
  @Property({ fieldName: 'issued_on', columnType: 'date', nullable: true })
  issuedOn?: string;

  /**
   * Fecha de vencimiento. Alimenta la alerta por vencimiento (spec 5626).
   */
  @Property({ fieldName: 'expires_on', columnType: 'date', nullable: true })
  expiresOn?: string;

  /**
   * Estado: vigente, próximo a vencer, vencido, sustituido o invalidado.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Responsable del documento.
   */
  @Property({ fieldName: 'owner_staff_id', type: 'uuid', nullable: true }) // FK → pharma_lab.pharma_lab_staff
  ownerStaffId?: string;

  /**
   * Nivel de confidencialidad.
   */
  @Property({ fieldName: 'disclosure_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  disclosureLevelConceptId!: string;

  /**
   * Días de antelación con que se avisa el vencimiento.
   */
  @Property({ fieldName: 'expiry_alert_days', columnType: 'int' })
  expiryAlertDays: number = 30;

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
