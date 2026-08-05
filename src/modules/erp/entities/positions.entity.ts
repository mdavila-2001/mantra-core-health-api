import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `positions`.
 */
@Entity({ schema: 'erp', tableName: 'positions' })
export class Positions {
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
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Identificador asociado a department.
   */
  @Property({ fieldName: 'department_id', type: 'uuid', nullable: true }) // FK → erp.departments
  departmentId?: string;

  /**
   * Identificador asociado a job family concept.
   */
  @Property({
    fieldName: 'job_family_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jobFamilyConceptId?: string;

  /**
   * Identificador asociado a grade concept.
   */
  @Property({ fieldName: 'grade_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  gradeConceptId?: string;

  /**
   * Valor de is managerial mantenido por la instancia.
   */
  @Property({ fieldName: 'is_managerial', type: 'boolean', nullable: true })
  isManagerial?: boolean;

  /**
   * Valor de headcount budget mantenido por la instancia.
   */
  @Property({
    fieldName: 'headcount_budget',
    columnType: 'int',
    nullable: true,
  })
  headcountBudget?: number;

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
