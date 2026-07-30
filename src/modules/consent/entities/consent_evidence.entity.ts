import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `consent_evidence`.
 */
@Entity({ schema: 'consent', tableName: 'consent_evidence' })
export class ConsentEvidence {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a subject type concept.
   */
  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a subject.
   */
  @Property({ fieldName: 'subject_id', type: 'uuid' })
  subjectId!: string;

  /**
   * Identificador asociado a evidence type concept.
   */
  @Property({ fieldName: 'evidence_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  evidenceTypeConceptId!: string;

  /**
   * Identificador asociado a document file.
   */
  @Property({ fieldName: 'document_file_id', type: 'uuid', nullable: true }) // FK → common.files
  documentFileId?: string;

  /**
   * Identificador asociado a signature.
   */
  @Property({ fieldName: 'signature_id', type: 'uuid', nullable: true }) // FK → chart.clinical_note_signatures
  signatureId?: string;

  /**
   * Identificador asociado a captured channel concept.
   */
  @Property({
    fieldName: 'captured_channel_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  capturedChannelConceptId?: string;

  /**
   * Valor de policy snapshot hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'policy_snapshot_hash',
    columnType: 'varchar',
    nullable: true,
  })
  policySnapshotHash?: string;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_hash',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceHash?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
