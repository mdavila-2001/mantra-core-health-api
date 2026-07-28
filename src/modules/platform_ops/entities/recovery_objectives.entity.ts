import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `recovery_objectives`.
 */
@Entity({ schema: 'platform_ops', tableName: 'recovery_objectives' })
export class RecoveryObjectives {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a service component.
   */
  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  /**
   * Identificador asociado a objective type concept.
   */
  @Property({ fieldName: 'objective_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectiveTypeConceptId!: string;

  /**
   * Valor de rto seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'rto_seconds', type: 'bigint' })
  rtoSeconds!: string;

  /**
   * Valor de rpo seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'rpo_seconds', type: 'bigint' })
  rpoSeconds!: string;

  /**
   * Valor de maximum tolerable downtime seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'maximum_tolerable_downtime_seconds',
    type: 'bigint',
    nullable: true,
  })
  maximumTolerableDowntimeSeconds?: string;

  /**
   * Identificador asociado a recovery tier concept.
   */
  @Property({
    fieldName: 'recovery_tier_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  recoveryTierConceptId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

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
