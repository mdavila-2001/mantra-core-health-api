import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_glossary_term_revisions`.
 */
@Entity({
  schema: 'data_catalog',
  tableName: 'catalog_glossary_term_revisions',
})
export class CatalogGlossaryTermRevisions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a term.
   */
  @Property({ fieldName: 'term_id', type: 'uuid' }) // FK (destino no resuelto)
  termId!: string;

  /**
   * Valor de revision no mantenido por la instancia.
   */
  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  /**
   * Valor de content json mantenido por la instancia.
   */
  @Property({ fieldName: 'content_json', type: 'json', columnType: 'jsonb' })
  contentJson!: unknown;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Valor de change reason mantenido por la instancia.
   */
  @Property({ fieldName: 'change_reason', columnType: 'text', nullable: true })
  changeReason?: string;

  /**
   * Identificador asociado a author user.
   */
  @Property({ fieldName: 'author_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  authorUserId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
