import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `calendar_absences`.
 */
@Entity({ schema: 'scheduling', tableName: 'calendar_absences' })
export class CalendarAbsences {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  /**
   * Identificador asociado a subject type concept.
   */
  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a subject ref.
   */
  @Property({ fieldName: 'subject_ref_id', type: 'uuid' })
  subjectRefId!: string;

  /**
   * Identificador asociado a person.
   */
  @Property({ fieldName: 'person_id', type: 'uuid', nullable: true }) // FK → profiles.persons
  personId?: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  /**
   * Identificador asociado a resource.
   */
  @Property({ fieldName: 'resource_id', type: 'uuid', nullable: true }) // FK → scheduling.schedulable_resources
  resourceId?: string;

  /**
   * Identificador asociado a absence type concept.
   */
  @Property({ fieldName: 'absence_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  absenceTypeConceptId!: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @Property({ fieldName: 'start_at', columnType: 'timestamptz' })
  startAt!: Date;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @Property({ fieldName: 'end_at', columnType: 'timestamptz' })
  endAt!: Date;

  /**
   * Valor de all day mantenido por la instancia.
   */
  @Property({ fieldName: 'all_day', type: 'boolean', nullable: true })
  allDay?: boolean;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  reason?: string;

  /**
   * Identificador asociado a approval status concept.
   */
  @Property({ fieldName: 'approval_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  approvalStatusConceptId!: string;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  /**
   * Valor de approved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

  /**
   * Identificador asociado a time off request.
   */
  @Property({ fieldName: 'time_off_request_id', type: 'uuid', nullable: true }) // FK → erp.time_off_requests
  timeOffRequestId?: string;

  /**
   * Valor de blocks scheduling mantenido por la instancia.
   */
  @Property({ fieldName: 'blocks_scheduling', type: 'boolean', nullable: true })
  blocksScheduling?: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
