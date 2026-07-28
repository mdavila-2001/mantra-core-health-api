import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `authentication_credentials`.
 */
@Entity({ schema: 'iam', tableName: 'authentication_credentials' })
export class AuthenticationCredentials {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Identificador asociado a method concept.
   */
  @Property({ fieldName: 'method_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  methodConceptId!: string;

  /**
   * Valor de external subject mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_subject',
    columnType: 'varchar',
    nullable: true,
  })
  externalSubject?: string;

  /**
   * Valor de secret hash mantenido por la instancia.
   */
  @Property({ fieldName: 'secret_hash', columnType: 'varchar', nullable: true })
  secretHash?: string;

  /**
   * Identificador asociado a hash algorithm concept.
   */
  @Property({
    fieldName: 'hash_algorithm_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  hashAlgorithmConceptId?: string;

  /**
   * Valor de public key mantenido por la instancia.
   */
  @Property({ fieldName: 'public_key', columnType: 'text', nullable: true })
  publicKey?: string;

  /**
   * Valor de identity provider mantenido por la instancia.
   */
  @Property({
    fieldName: 'identity_provider',
    columnType: 'varchar',
    nullable: true,
  })
  identityProvider?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  /**
   * Valor de last used at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_used_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastUsedAt?: Date;

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
