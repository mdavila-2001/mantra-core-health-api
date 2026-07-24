import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'vector_documents' })
export class VectorDocuments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'vector_collection_id', type: 'uuid' })
  vectorCollectionId!: string;

  @Property({ fieldName: 'source_document_id', type: 'uuid' })
  sourceDocumentId!: string;

  @Property({ fieldName: 'source_version_id', type: 'uuid' })
  sourceVersionId!: string;

  @Property({ fieldName: 'document_type', columnType: 'varchar' })
  documentType!: string;

  @Property({ columnType: 'varchar' })
  language!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'contains_phi', type: 'boolean' })
  containsPhi!: boolean;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' })
  patientProfileId!: string;

  @Property({ fieldName: 'security_labels', type: 'array' })
  securityLabels!: string[];

  @Property({ fieldName: 'purpose_of_use_codes', type: 'array' })
  purposeOfUseCodes!: string[];

  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
