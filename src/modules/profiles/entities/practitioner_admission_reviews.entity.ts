import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practitioner_admission_reviews`: el
 * estado vigente de la revisión de cada requisito/ítem de una admisión (v4.2.67).
 */
@Entity({ schema: 'profiles', tableName: 'practitioner_admission_reviews' })
export class PractitionerAdmissionReviews {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Admisión a la que pertenece la revisión.
   */
  @Property({ fieldName: 'admission_id', type: 'uuid' }) // FK (destino no resuelto)
  admissionId!: string;

  /**
   * Requisito del catálogo que se revisa.
   */
  @Property({ fieldName: 'requirement_id', type: 'uuid' }) // FK (destino no resuelto)
  requirementId!: string;

  /**
   * Ficha revisada (matrícula, título, especialidad) o, para un dato del
   * perfil, el id del profesional.
   */
  @Property({ fieldName: 'item_id', type: 'uuid' })
  itemId!: string;

  /**
   * Estado vigente de la revisión.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Archivo que respalda el ítem, si lo hay.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files (inferida)
  fileId?: string;

  /**
   * Fuente consultada para verificar.
   */
  @Property({
    fieldName: 'verification_source_uri',
    columnType: 'text',
    nullable: true,
  })
  verificationSourceUri?: string;

  /**
   * Tipo de fuente consultada (registro del Ministerio, colegio, SEDES…).
   */
  @Property({
    fieldName: 'source_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  sourceTypeConceptId?: string;

  /**
   * Referencia de la fuente: nº de trámite, comprobante o URL.
   */
  @Property({ fieldName: 'source_ref', columnType: 'text', nullable: true })
  sourceRef?: string;

  /**
   * Cuándo se consultó la fuente.
   */
  @Property({
    fieldName: 'source_consulted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  sourceConsultedAt?: Date;

  /**
   * Huella de lo que el revisor vio (documento y datos).
   */
  @Property({
    fieldName: 'evidence_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceSha256?: string;

  /**
   * Código estructurado del motivo.
   */
  @Property({
    fieldName: 'reason_code_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  reasonCodeConceptId?: string;

  /**
   * Motivo del rechazo o de la información pedida.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /**
   * Nota interna del revisor: NUNCA se expone al solicitante.
   */
  @Property({ fieldName: 'internal_note', columnType: 'text', nullable: true })
  internalNote?: string;

  /**
   * Quién revisó.
   */
  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  reviewedByUserId?: string;

  /**
   * Cuándo se revisó.
   */
  @Property({
    fieldName: 'reviewed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reviewedAt?: Date;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
