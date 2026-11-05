import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_annotation_revisions`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_annotation_revisions' })
export class CatalogAnnotationRevisions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a annotation.
   */
  @Property({ fieldName: 'annotation_id', type: 'uuid' }) // FK → data_catalog.catalog_annotations
  annotationId!: string;

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
   * Valor de origin mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  origin!: string;

  /**
   * Valor de submitted status mantenido por la instancia.
   */
  @Property({ fieldName: 'submitted_status', columnType: 'varchar' })
  submittedStatus!: string;

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
