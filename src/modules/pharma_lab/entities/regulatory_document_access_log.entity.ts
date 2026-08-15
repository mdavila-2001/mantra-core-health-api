import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Registro de toda consulta y descarga del repositorio documental (spec 5629:
 * «registrar toda creación, consulta, descarga, sustitución o invalidación»).
 *
 * Va en tabla propia y no solo en la cadena WORM porque el acceso de lectura es
 * un volumen distinto del de las mutaciones y la organización necesita poder
 * listarlo por documento sin recorrer la cadena entera.
 */
@Entity({ schema: 'pharma_lab', tableName: 'regulatory_document_access_log' })
export class RegulatoryDocumentAccessLog {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Documento consultado.
   */
  @Property({ fieldName: 'regulatory_document_id', type: 'uuid' }) // FK → pharma_lab.regulatory_documents
  regulatoryDocumentId!: string;

  /**
   * Versión concreta consultada o descargada.
   */
  @Property({
    fieldName: 'regulatory_document_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharma_lab.regulatory_document_versions
  regulatoryDocumentVersionId?: string;

  /**
   * Qué se hizo: `VIEW` o `DOWNLOAD`.
   */
  @Property({ fieldName: 'access_kind', columnType: 'varchar' })
  accessKind!: string;

  /**
   * Quién accedió.
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users
  actorUserId!: string;

  /**
   * Momento del acceso.
   */
  @Property({ fieldName: 'accessed_at', columnType: 'timestamptz' })
  accessedAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
