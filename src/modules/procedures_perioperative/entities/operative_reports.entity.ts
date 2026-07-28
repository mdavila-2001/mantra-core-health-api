import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `operative_reports`.
 */
@Entity({ schema: 'procedures_perioperative', tableName: 'operative_reports' })
export class OperativeReports {
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
   * Valor de report version mantenido por la instancia.
   */
  @Property({ fieldName: 'report_version', columnType: 'int' })
  reportVersion!: number;

  /**
   * Identificador asociado a author profile.
   */
  @Property({ fieldName: 'author_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  authorProfileId!: string;

  /**
   * Valor de authored at mantenido por la instancia.
   */
  @Property({ fieldName: 'authored_at', columnType: 'timestamptz' })
  authoredAt!: Date;

  /**
   * Valor de preoperative diagnosis text mantenido por la instancia.
   */
  @Property({
    fieldName: 'preoperative_diagnosis_text',
    columnType: 'text',
    nullable: true,
  })
  preoperativeDiagnosisText?: string;

  /**
   * Valor de postoperative diagnosis text mantenido por la instancia.
   */
  @Property({
    fieldName: 'postoperative_diagnosis_text',
    columnType: 'text',
    nullable: true,
  })
  postoperativeDiagnosisText?: string;

  /**
   * Valor de procedure description mantenido por la instancia.
   */
  @Property({
    fieldName: 'procedure_description',
    columnType: 'text',
    nullable: true,
  })
  procedureDescription?: string;

  /**
   * Valor de findings text mantenido por la instancia.
   */
  @Property({ fieldName: 'findings_text', columnType: 'text', nullable: true })
  findingsText?: string;

  /**
   * Valor de estimated blood loss ml mantenido por la instancia.
   */
  @Property({
    fieldName: 'estimated_blood_loss_ml',
    columnType: 'numeric(12,3)',
    nullable: true,
  })
  estimatedBloodLossMl?: string;

  /**
   * Valor de drains text mantenido por la instancia.
   */
  @Property({ fieldName: 'drains_text', columnType: 'text', nullable: true })
  drainsText?: string;

  /**
   * Valor de complications text mantenido por la instancia.
   */
  @Property({
    fieldName: 'complications_text',
    columnType: 'text',
    nullable: true,
  })
  complicationsText?: string;

  /**
   * Identificador asociado a disposition concept.
   */
  @Property({
    fieldName: 'disposition_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dispositionConceptId?: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de signed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'signed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signedAt?: Date;

  /**
   * Identificador asociado a signature.
   */
  @Property({ fieldName: 'signature_id', type: 'uuid', nullable: true }) // FK → chart.clinical_note_signatures
  signatureId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
