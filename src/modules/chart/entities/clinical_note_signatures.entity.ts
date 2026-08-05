import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `clinical_note_signatures`.
 */
@Entity({ schema: 'chart', tableName: 'clinical_note_signatures' })
export class ClinicalNoteSignatures {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a clinical note version.
   */
  @Property({ fieldName: 'clinical_note_version_id', type: 'uuid' }) // FK → chart.clinical_note_versions
  clinicalNoteVersionId!: string;

  /**
   * Identificador asociado a signer profile.
   */
  @Property({ fieldName: 'signer_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  signerProfileId!: string;

  /**
   * Identificador asociado a signature type concept.
   */
  @Property({ fieldName: 'signature_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  signatureTypeConceptId!: string;

  /**
   * Valor de signature value encrypted mantenido por la instancia.
   */
  @Property({
    fieldName: 'signature_value_encrypted',
    columnType: 'text',
    nullable: true,
  })
  signatureValueEncrypted?: string;

  /**
   * Valor de certificate thumbprint mantenido por la instancia.
   */
  @Property({
    fieldName: 'certificate_thumbprint',
    columnType: 'varchar',
    nullable: true,
  })
  certificateThumbprint?: string;

  /**
   * Valor de signed content hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'signed_content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  signedContentHash?: string;

  /**
   * Valor de signed at mantenido por la instancia.
   */
  @Property({ fieldName: 'signed_at', columnType: 'timestamptz' })
  signedAt!: Date;
}
