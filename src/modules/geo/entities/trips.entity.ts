import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `trips`.
 */
@Entity({ schema: 'geo', tableName: 'trips' })
export class Trips {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tracking session.
   */
  @Property({ fieldName: 'tracking_session_id', type: 'uuid', nullable: true }) // FK → geo.tracking_sessions
  trackingSessionId?: string;

  /**
   * Identificador asociado a origin address.
   */
  @Property({ fieldName: 'origin_address_id', type: 'uuid', nullable: true }) // FK → common.addresses
  originAddressId?: string;

  /**
   * Identificador asociado a destination address.
   */
  @Property({
    fieldName: 'destination_address_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.addresses
  destinationAddressId?: string;

  /**
   * Valor de distance m mantenido por la instancia.
   */
  @Property({ fieldName: 'distance_m', columnType: 'numeric', nullable: true })
  distanceM?: string;

  /**
   * Valor de duration s mantenido por la instancia.
   */
  @Property({ fieldName: 'duration_s', columnType: 'int', nullable: true })
  durationS?: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

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
