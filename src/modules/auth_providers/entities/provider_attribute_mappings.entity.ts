import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_attribute_mappings`.
 */
@Entity({ schema: 'auth_providers', tableName: 'provider_attribute_mappings' })
export class ProviderAttributeMappings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a provider.
   */
  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → auth_providers.identity_providers
  providerId!: string;

  /**
   * Valor de source claim mantenido por la instancia.
   */
  @Property({ fieldName: 'source_claim', columnType: 'varchar' })
  sourceClaim!: string;

  /**
   * Valor de target attribute mantenido por la instancia.
   */
  @Property({ fieldName: 'target_attribute', columnType: 'varchar' })
  targetAttribute!: string;

  /**
   * Valor de is identifier mantenido por la instancia.
   */
  @Property({ fieldName: 'is_identifier', type: 'boolean', nullable: true })
  isIdentifier?: boolean;

  /**
   * Valor de transform json mantenido por la instancia.
   */
  @Property({
    fieldName: 'transform_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  transformJson?: unknown;

  /**
   * Valor de required mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

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
