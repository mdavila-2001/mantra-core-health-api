import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_signing_keys`.
 */
@Entity({ schema: 'auth_providers', tableName: 'provider_signing_keys' })
export class ProviderSigningKeys {
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
   * Identificador asociado a key.
   */
  @Property({ fieldName: 'key_id', columnType: 'varchar' })
  keyId!: string;

  /**
   * Identificador asociado a key use concept.
   */
  @Property({ fieldName: 'key_use_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  keyUseConceptId!: string;

  /**
   * Valor de algorithm mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  algorithm!: string;

  /**
   * Valor de public key mantenido por la instancia.
   */
  @Property({ fieldName: 'public_key', columnType: 'text' })
  publicKey!: string;

  /**
   * Valor de certificate mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  certificate?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
