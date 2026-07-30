import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_case_milestones`.
 */
@Entity({ schema: 'crm', tableName: 'crm_case_milestones' })
export class CrmCaseMilestones {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm case.
   */
  @Property({ fieldName: 'crm_case_id', type: 'uuid' }) // FK → crm.crm_cases
  crmCaseId!: string;

  /**
   * Identificador asociado a crm entitlement.
   */
  @Property({ fieldName: 'crm_entitlement_id', type: 'uuid', nullable: true }) // FK → crm.crm_entitlements
  crmEntitlementId?: string;

  /**
   * Identificador asociado a milestone type concept.
   */
  @Property({ fieldName: 'milestone_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  milestoneTypeConceptId!: string;

  /**
   * Valor de target at mantenido por la instancia.
   */
  @Property({
    fieldName: 'target_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  targetAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Valor de breached at mantenido por la instancia.
   */
  @Property({
    fieldName: 'breached_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  breachedAt?: Date;

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
