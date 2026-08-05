import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dynamic_enum_options`.
 */
@Entity({ schema: 'system_context', tableName: 'dynamic_enum_options' })
export class DynamicEnumOptions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dynamic enum version.
   */
  @Property({ fieldName: 'dynamic_enum_version_id', type: 'uuid' }) // FK → system_context.dynamic_enum_versions
  dynamicEnumVersionId!: string;

  /**
   * Identificador asociado a concept.
   */
  @Property({ fieldName: 'concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  conceptId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de display mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  display!: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  /**
   * Valor de is default mantenido por la instancia.
   */
  @Property({ fieldName: 'is_default', type: 'boolean', nullable: true })
  isDefault?: boolean;

  /**
   * Valor de enabled mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  enabled?: boolean;

  /**
   * Valor de metadata json mantenido por la instancia.
   */
  @Property({
    fieldName: 'metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metadataJson?: unknown;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
