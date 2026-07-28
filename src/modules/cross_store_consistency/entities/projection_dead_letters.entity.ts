import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `projection_dead_letters`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_dead_letters',
})
export class ProjectionDeadLetters {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a projection delivery attempt.
   */
  @Property({ fieldName: 'projection_delivery_attempt_id', type: 'uuid' })
  projectionDeliveryAttemptId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Valor de reason code mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_code', columnType: 'varchar' })
  reasonCode!: string;

  /**
   * Identificador asociado a payload object.
   */
  @Property({ fieldName: 'payload_object_id', type: 'uuid' })
  payloadObjectId!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @Property({ fieldName: 'resolved_at', columnType: 'timestamptz' })
  resolvedAt!: Date;
}
