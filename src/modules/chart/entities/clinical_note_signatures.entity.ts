import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'chart', tableName: 'clinical_note_signatures' })
export class ClinicalNoteSignatures {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'clinical_note_version_id', type: 'uuid' }) // FK → chart.clinical_note_versions
  clinicalNoteVersionId!: string;

  @Property({ fieldName: 'signer_profile_id', type: 'uuid' }) // FK (destino no resuelto)
  signerProfileId!: string;

  @Property({ fieldName: 'signature_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  signatureTypeConceptId!: string;

  @Property({
    fieldName: 'signature_value_encrypted',
    columnType: 'text',
    nullable: true,
  })
  signatureValueEncrypted?: string;

  @Property({
    fieldName: 'certificate_thumbprint',
    columnType: 'varchar',
    nullable: true,
  })
  certificateThumbprint?: string;

  @Property({
    fieldName: 'signed_content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  signedContentHash?: string;

  @Property({ fieldName: 'signed_at', columnType: 'timestamptz' })
  signedAt!: Date;
}
