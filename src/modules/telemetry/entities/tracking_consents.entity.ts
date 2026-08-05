import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tracking_consents`.
 */
@Entity({ schema: 'telemetry', tableName: 'tracking_consents' })
export class TrackingConsents {
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
   * Identificador asociado a purpose definition.
   */
  @Property({ fieldName: 'purpose_definition_id', type: 'uuid' }) // FK → telemetry.tracking_purpose_definitions
  purposeDefinitionId!: string;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  /**
   * Valor de consent version mantenido por la instancia.
   */
  @Property({
    fieldName: 'consent_version',
    columnType: 'varchar',
    nullable: true,
  })
  consentVersion?: string;

  /**
   * Valor de granted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'granted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  grantedAt?: Date;

  /**
   * Valor de withdrawn at mantenido por la instancia.
   */
  @Property({
    fieldName: 'withdrawn_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  withdrawnAt?: Date;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_hash',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceHash?: string;

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
}
