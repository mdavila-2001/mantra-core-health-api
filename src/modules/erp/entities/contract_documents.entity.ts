import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contract_documents`.
 */
@Entity({ schema: 'erp', tableName: 'contract_documents' })
export class ContractDocuments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  /**
   * Identificador asociado a document type concept.
   */
  @Property({ fieldName: 'document_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  documentTypeConceptId!: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  version?: number;

  /**
   * Valor de is signed mantenido por la instancia.
   */
  @Property({ fieldName: 'is_signed', type: 'boolean', nullable: true })
  isSigned?: boolean;

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
