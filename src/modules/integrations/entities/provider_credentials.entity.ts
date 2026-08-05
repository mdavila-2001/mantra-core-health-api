import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_credentials`.
 */
@Entity({ schema: 'integrations', tableName: 'provider_credentials' })
export class ProviderCredentials {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a connection.
   */
  @Property({ fieldName: 'connection_id', type: 'uuid' }) // FK → integrations.provider_connections
  connectionId!: string;

  /**
   * Identificador asociado a secret type concept.
   */
  @Property({ fieldName: 'secret_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  secretTypeConceptId!: string;

  /**
   * Valor de secret ref mantenido por la instancia.
   */
  @Property({ fieldName: 'secret_ref', columnType: 'varchar', nullable: true })
  secretRef?: string;

  /**
   * Valor de encrypted mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  encrypted?: boolean;

  /**
   * Valor de rotated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'rotated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  rotatedAt?: Date;

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
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
