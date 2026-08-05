import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `vector_documents`.
 */
@Entity({ schema: 'vector_rag', tableName: 'vector_documents' })
export class VectorDocuments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a vector collection.
   */
  @Property({ fieldName: 'vector_collection_id', type: 'uuid' })
  vectorCollectionId!: string;

  /**
   * Identificador asociado a source document.
   */
  @Property({ fieldName: 'source_document_id', type: 'uuid' })
  sourceDocumentId!: string;

  /**
   * Identificador asociado a source version.
   */
  @Property({ fieldName: 'source_version_id', type: 'uuid' })
  sourceVersionId!: string;

  /**
   * Valor de document type mantenido por la instancia.
   */
  @Property({ fieldName: 'document_type', columnType: 'varchar' })
  documentType!: string;

  /**
   * Valor de language mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  language!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @Property({ fieldName: 'contains_phi', type: 'boolean' })
  containsPhi!: boolean;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de security labels mantenido por la instancia.
   */
  @Property({ fieldName: 'security_labels', type: 'array' })
  securityLabels!: string[];

  /**
   * Valor de purpose of use codes mantenido por la instancia.
   */
  @Property({ fieldName: 'purpose_of_use_codes', type: 'array' })
  purposeOfUseCodes!: string[];

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
