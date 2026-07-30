import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `file_derivatives`.
 */
@Entity({ schema: 'common', tableName: 'file_derivatives' })
export class FileDerivatives {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a source file version.
   */
  @Property({ fieldName: 'source_file_version_id', type: 'uuid' }) // FK → common.file_versions
  sourceFileVersionId!: string;

  /**
   * Identificador asociado a derivative file version.
   */
  @Property({ fieldName: 'derivative_file_version_id', type: 'uuid' }) // FK → common.file_versions
  derivativeFileVersionId!: string;

  /**
   * Identificador asociado a derivative type concept.
   */
  @Property({ fieldName: 'derivative_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  derivativeTypeConceptId!: string;

  /**
   * Valor de generation profile mantenido por la instancia.
   */
  @Property({
    fieldName: 'generation_profile',
    columnType: 'varchar',
    nullable: true,
  })
  generationProfile?: string;

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
