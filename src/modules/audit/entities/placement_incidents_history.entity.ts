import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `placement_incidents_history`.
 */
@Entity({ schema: 'audit', tableName: 'placement_incidents_history' })
export class PlacementIncidentsHistory {
  /**
   * Identificador asociado a history.
   */
  @PrimaryKey({ fieldName: 'history_id', type: 'uuid' })
  historyId: string = randomUUID();

  /**
   * Identificador asociado a placement incident.
   */
  @Property({ fieldName: 'placement_incident_id', type: 'uuid' }) // FK → clinical.placement_incidents (inferida)
  placementIncidentId!: string;

  /**
   * Valor de revision no mantenido por la instancia.
   */
  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  /**
   * Identificador asociado a operation concept.
   */
  @Property({ fieldName: 'operation_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  operationConceptId!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

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
   * Valor de data snapshot mantenido por la instancia.
   */
  @Property({ fieldName: 'data_snapshot', type: 'json', columnType: 'jsonb' })
  dataSnapshot!: unknown;

  /**
   * Identificador asociado a changed by user.
   */
  @Property({ fieldName: 'changed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  changedByUserId?: string;

  /**
   * Identificador asociado a change reason concept.
   */
  @Property({
    fieldName: 'change_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  changeReasonConceptId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;
}
