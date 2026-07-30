import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `multipart_uploads`.
 */
@Entity({ schema: 'object_storage', tableName: 'multipart_uploads' })
export class MultipartUploads {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a namespace.
   */
  @Property({ fieldName: 'namespace_id', type: 'uuid' })
  namespaceId!: string;

  /**
   * Identificador asociado a provider upload.
   */
  @Property({ fieldName: 'provider_upload_id', columnType: 'varchar' })
  providerUploadId!: string;

  /**
   * Valor de target object key mantenido por la instancia.
   */
  @Property({ fieldName: 'target_object_key', columnType: 'varchar' })
  targetObjectKey!: string;

  /**
   * Valor de expected size bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'expected_size_bytes', type: 'bigint' })
  expectedSizeBytes!: string;

  /**
   * Valor de received size bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'received_size_bytes', type: 'bigint' })
  receivedSizeBytes!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
