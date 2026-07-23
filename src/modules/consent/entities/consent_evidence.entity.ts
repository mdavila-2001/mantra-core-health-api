import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'consent', tableName: 'consent_evidence' })
export class ConsentEvidence {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  @Property({ fieldName: 'subject_id', type: 'uuid' })
  subjectId!: string;

  @Property({ fieldName: 'evidence_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  evidenceTypeConceptId!: string;

  @Property({ fieldName: 'document_file_id', type: 'uuid', nullable: true }) // FK → common.files
  documentFileId?: string;

  @Property({ fieldName: 'signature_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  signatureId?: string;

  @Property({
    fieldName: 'captured_channel_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  capturedChannelConceptId?: string;

  @Property({
    fieldName: 'policy_snapshot_hash',
    columnType: 'varchar',
    nullable: true,
  })
  policySnapshotHash?: string;

  @Property({
    fieldName: 'evidence_hash',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceHash?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
