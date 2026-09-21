import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Revisión inmutable de una ficha (`data_catalog.catalog_annotation_revisions`).
 * Cada cambio de contenido crea una; una aprobación se liga a un número de
 * revisión, nunca a "la ficha", para que editar después no herede el visto
 * bueno.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_annotation_revisions' })
export class CatalogAnnotationRevisions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'annotation_id', type: 'uuid' }) // FK → data_catalog.catalog_annotations
  annotationId!: string;

  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  /** Contenido completo de la ficha en esta revisión. */
  @Property({ fieldName: 'content_json', type: 'json', columnType: 'jsonb' })
  contentJson!: unknown;

  /** SHA-256 del contenido canónico; dos parches con el mismo resultado no duplican revisión. */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ columnType: 'varchar' })
  origin!: string;

  /** Estado con el que nació la revisión (DRAFT o NEEDS_REVIEW). */
  @Property({ fieldName: 'submitted_status', columnType: 'varchar' })
  submittedStatus!: string;

  @Property({ fieldName: 'change_reason', columnType: 'text', nullable: true })
  changeReason?: string;

  @Property({ fieldName: 'author_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  authorUserId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
