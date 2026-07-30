import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contract_clauses`.
 */
@Entity({ schema: 'erp', tableName: 'contract_clauses' })
export class ContractClauses {
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
   * Valor de clause code mantenido por la instancia.
   */
  @Property({ fieldName: 'clause_code', columnType: 'varchar' })
  clauseCode!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Identificador asociado a clause type concept.
   */
  @Property({ fieldName: 'clause_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  clauseTypeConceptId!: string;

  /**
   * Valor de default text mantenido por la instancia.
   */
  @Property({ fieldName: 'default_text', columnType: 'text', nullable: true })
  defaultText?: string;

  /**
   * Identificador asociado a risk level concept.
   */
  @Property({
    fieldName: 'risk_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  riskLevelConceptId?: string;

  /**
   * Valor de requires approval mantenido por la instancia.
   */
  @Property({ fieldName: 'requires_approval', type: 'boolean', nullable: true })
  requiresApproval?: boolean;

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
