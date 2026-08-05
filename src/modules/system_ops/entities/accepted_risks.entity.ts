import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `accepted_risks`.
 */
@Entity({ schema: 'system_ops', tableName: 'accepted_risks' })
export class AcceptedRisks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  title?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid', nullable: true })
  severityConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid', nullable: true })
  statusConceptId?: string;

  /**
   * Identificador asociado a accepted by user.
   */
  @Property({ fieldName: 'accepted_by_user_id', type: 'uuid', nullable: true })
  acceptedByUserId?: string;

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
   * Valor de review due at mantenido por la instancia.
   */
  @Property({
    fieldName: 'review_due_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reviewDueAt?: Date;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
