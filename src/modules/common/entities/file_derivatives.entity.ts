import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'common', tableName: 'file_derivatives' })
export class FileDerivatives {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'source_file_version_id', type: 'uuid' }) // FK → common.file_versions
  sourceFileVersionId!: string;

  @Property({ fieldName: 'derivative_file_version_id', type: 'uuid' }) // FK → common.file_versions
  derivativeFileVersionId!: string;

  @Property({ fieldName: 'derivative_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  derivativeTypeConceptId!: string;

  @Property({
    fieldName: 'generation_profile',
    columnType: 'varchar',
    nullable: true,
  })
  generationProfile?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
