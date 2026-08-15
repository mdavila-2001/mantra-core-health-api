import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Adjuntos de un material informativo (spec 5466-5472): fichas técnicas,
 * estudios, documentos científicos, presentaciones, videos e información
 * regulatoria.
 *
 * El binario vive en el almacén de archivos del sistema (`object_storage` /
 * `document_store`); acá solo queda su referencia y el tipo declarado.
 */
@Entity({ schema: 'pharma_lab', tableName: 'material_assets' })
export class MaterialAssets {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Material al que pertenece el adjunto.
   */
  @Property({ fieldName: 'informational_material_id', type: 'uuid' }) // FK → pharma_lab.informational_materials
  informationalMaterialId!: string;

  /**
   * Tipo del adjunto.
   */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  kindConceptId!: string;

  /**
   * Nombre visible del adjunto.
   */
  @Property({ fieldName: 'file_name', columnType: 'varchar' })
  fileName!: string;

  /**
   * Referencia del archivo en el almacén.
   */
  @Property({ fieldName: 'storage_key', columnType: 'varchar' })
  storageKey!: string;

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
   * Tamaño en bytes.
   */
  @Property({ fieldName: 'size_bytes', columnType: 'bigint', nullable: true })
  sizeBytes?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
