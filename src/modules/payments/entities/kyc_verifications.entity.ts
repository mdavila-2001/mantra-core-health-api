import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `kyc_verifications`.
 */
@Entity({ schema: 'payments', tableName: 'kyc_verifications' })
export class KycVerifications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a connected account.
   */
  @Property({ fieldName: 'connected_account_id', type: 'uuid' }) // FK → payments.connected_accounts
  connectedAccountId!: string;

  /**
   * Identificador asociado a kyc level concept.
   */
  @Property({ fieldName: 'kyc_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  kycLevelConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de provider ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_ref',
    columnType: 'varchar',
    nullable: true,
  })
  providerRef?: string;

  /**
   * Identificador asociado a risk rating concept.
   */
  @Property({
    fieldName: 'risk_rating_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  riskRatingConceptId?: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

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
   * Identificador asociado a evidence file.
   */
  @Property({ fieldName: 'evidence_file_id', type: 'uuid', nullable: true }) // FK → common.files
  evidenceFileId?: string;

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
