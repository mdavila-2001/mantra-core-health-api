import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `care_space_blocks`.
 */
@Entity({ schema: 'practice', tableName: 'care_space_blocks' })
export class CareSpaceBlocks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces (inferida)
  careSpaceId!: string;

  /**
   * Identificador asociado a kind concept.
   */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  kindConceptId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  reasonConceptId!: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'varchar', nullable: true })
  reasonText?: string;

  /**
   * Valor de starts at mantenido por la instancia.
   */
  @Property({ fieldName: 'starts_at', columnType: 'timestamptz' })
  startsAt!: Date;

  /**
   * Valor de expected end at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expected_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expectedEndAt?: Date;

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
   * Identificador asociado a ended by user.
   */
  @Property({ fieldName: 'ended_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  endedByUserId?: string;

  /**
   * Valor de end note mantenido por la instancia.
   */
  @Property({ fieldName: 'end_note', columnType: 'varchar', nullable: true })
  endNote?: string;

  /**
   * Valor de cancelled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancelled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelledAt?: Date;

  /**
   * Valor de cancel reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancel_reason',
    columnType: 'varchar',
    nullable: true,
  })
  cancelReason?: string;

  /**
   * Valor de work order ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'work_order_ref',
    columnType: 'varchar',
    nullable: true,
  })
  workOrderRef?: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
