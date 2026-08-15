import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Versión concreta de un documento regulatorio, con su archivo y su vigencia
 * (spec 5627 «mantener el historial de versiones»).
 *
 * Es append-only y cada versión conserva su propio archivo: sustituir un
 * documento agrega una versión y marca la anterior como sustituida, nunca la
 * pisa.
 */
@Entity({ schema: 'pharma_lab', tableName: 'regulatory_document_versions' })
export class RegulatoryDocumentVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Documento al que pertenece.
   */
  @Property({ fieldName: 'regulatory_document_id', type: 'uuid' }) // FK → pharma_lab.regulatory_documents
  regulatoryDocumentId!: string;

  /**
   * Etiqueta de versión.
   */
  @Property({ columnType: 'varchar' })
  version!: string;

  /**
   * Referencia del archivo en el almacén.
   */
  @Property({ fieldName: 'storage_key', columnType: 'varchar' })
  storageKey!: string;

  /**
   * Nombre visible del archivo.
   */
  @Property({ fieldName: 'file_name', columnType: 'varchar' })
  fileName!: string;

  /**
   * Tipo MIME.
   */
  @Property({
    fieldName: 'content_type',
    columnType: 'varchar',
    nullable: true,
  })
  contentType?: string;

  /**
   * Fecha de emisión de esta versión.
   */
  @Property({ fieldName: 'issued_on', columnType: 'date', nullable: true })
  issuedOn?: string;

  /**
   * Fecha de vencimiento de esta versión.
   */
  @Property({ fieldName: 'expires_on', columnType: 'date', nullable: true })
  expiresOn?: string;

  /**
   * Estado de la versión: vigente, sustituida o invalidada.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Motivo de la sustitución o invalidación.
   */
  @Property({ fieldName: 'change_reason', columnType: 'text', nullable: true })
  changeReason?: string;

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
