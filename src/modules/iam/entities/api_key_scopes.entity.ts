import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `api_key_scopes`.
 */
@Entity({ schema: 'iam', tableName: 'api_key_scopes' })
export class ApiKeyScopes {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a api key.
   */
  @Property({ fieldName: 'api_key_id', type: 'uuid' }) // FK → iam.api_keys
  apiKeyId!: string;

  /**
   * Identificador asociado a scope concept.
   */
  @Property({ fieldName: 'scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scopeConceptId!: string;

  /**
   * Valor de resource mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  resource?: string;

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

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
