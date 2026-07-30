import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `system_context_inputs`.
 */
@Entity({ schema: 'system_context', tableName: 'system_context_inputs' })
export class SystemContextInputs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a system context version.
   */
  @Property({ fieldName: 'system_context_version_id', type: 'uuid' }) // FK → system_context.system_context_versions
  systemContextVersionId!: string;

  /**
   * Identificador asociado a source type concept.
   */
  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  /**
   * Valor de source schema name mantenido por la instancia.
   */
  @Property({ fieldName: 'source_schema_name', columnType: 'varchar' })
  sourceSchemaName!: string;

  /**
   * Valor de source entity name mantenido por la instancia.
   */
  @Property({ fieldName: 'source_entity_name', columnType: 'varchar' })
  sourceEntityName!: string;

  /**
   * Identificador asociado a source record.
   */
  @Property({ fieldName: 'source_record_id', type: 'uuid' })
  sourceRecordId!: string;

  /**
   * Identificador asociado a source version.
   */
  @Property({ fieldName: 'source_version_id', type: 'uuid', nullable: true })
  sourceVersionId?: string;

  /**
   * Valor de source content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'source_content_hash', columnType: 'varchar' })
  sourceContentHash!: string;

  /**
   * Valor de source freshness at mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_freshness_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  sourceFreshnessAt?: Date;

  /**
   * Valor de precedence mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  precedence?: number;

  /**
   * Valor de required mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

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
