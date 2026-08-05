import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `draft_records`.
 */
@Entity({ schema: 'system_ops', tableName: 'draft_records' })
export class DraftRecords {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de schema name mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_name', columnType: 'varchar' })
  schemaName!: string;

  /**
   * Valor de table name mantenido por la instancia.
   */
  @Property({ fieldName: 'table_name', columnType: 'varchar' })
  tableName!: string;

  /**
   * Identificador asociado a target record.
   */
  @Property({ fieldName: 'target_record_id', type: 'uuid', nullable: true })
  targetRecordId?: string;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid' }) // FK → iam.users
  ownerUserId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de draft label mantenido por la instancia.
   */
  @Property({ fieldName: 'draft_label', columnType: 'varchar', nullable: true })
  draftLabel?: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_version', columnType: 'int', nullable: true })
  schemaVersion?: number;

  /**
   * Identificador asociado a published record.
   */
  @Property({ fieldName: 'published_record_id', type: 'uuid', nullable: true })
  publishedRecordId?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

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
