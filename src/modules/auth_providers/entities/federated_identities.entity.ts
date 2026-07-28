import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `federated_identities`.
 */
@Entity({ schema: 'auth_providers', tableName: 'federated_identities' })
export class FederatedIdentities {
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
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Valor de external subject mantenido por la instancia.
   */
  @Property({ fieldName: 'external_subject', columnType: 'varchar' })
  externalSubject!: string;

  /**
   * Valor de external email mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_email',
    columnType: 'varchar',
    nullable: true,
  })
  externalEmail?: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @Property({
    fieldName: 'display_name',
    columnType: 'varchar',
    nullable: true,
  })
  displayName?: string;

  /**
   * Valor de linked at mantenido por la instancia.
   */
  @Property({
    fieldName: 'linked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  linkedAt?: Date;

  /**
   * Valor de last login at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_login_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastLoginAt?: Date;

  /**
   * Valor de raw claims json mantenido por la instancia.
   */
  @Property({
    fieldName: 'raw_claims_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  rawClaimsJson?: unknown;

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
