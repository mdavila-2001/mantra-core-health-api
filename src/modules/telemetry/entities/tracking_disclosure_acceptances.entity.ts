import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tracking_disclosure_acceptances`.
 */
@Entity({ schema: 'telemetry', tableName: 'tracking_disclosure_acceptances' })
export class TrackingDisclosureAcceptances {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tracking disclosure version.
   */
  @Property({ fieldName: 'tracking_disclosure_version_id', type: 'uuid' }) // FK → telemetry.tracking_disclosure_versions
  trackingDisclosureVersionId!: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Identificador asociado a session.
   */
  @Property({ fieldName: 'session_id', type: 'uuid', nullable: true }) // FK → iam.sessions
  sessionId?: string;

  /**
   * Valor de accepted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'accepted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acceptedAt?: Date;

  /**
   * Valor de ip prefix hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'ip_prefix_hash',
    columnType: 'varchar',
    nullable: true,
  })
  ipPrefixHash?: string;

  /**
   * Valor de user agent hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'user_agent_hash',
    columnType: 'varchar',
    nullable: true,
  })
  userAgentHash?: string;

  /**
   * Identificador asociado a acceptance status concept.
   */
  @Property({ fieldName: 'acceptance_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  acceptanceStatusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
