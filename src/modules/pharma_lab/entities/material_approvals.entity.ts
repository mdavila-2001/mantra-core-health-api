import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Revisión interna de un material informativo (spec 5479). Append-only: cada
 * decisión queda, incluidas las de rechazo, para poder auditar por qué un
 * material llegó a estar aprobado.
 */
@Entity({ schema: 'pharma_lab', tableName: 'material_approvals' })
export class MaterialApprovals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Material revisado.
   */
  @Property({ fieldName: 'informational_material_id', type: 'uuid' }) // FK → pharma_lab.informational_materials (inferida)
  informationalMaterialId!: string;

  /**
   * Versión del material sobre la que recae la decisión.
   */
  @Property({ fieldName: 'material_version', columnType: 'varchar' })
  materialVersion!: string;

  /**
   * Decisión: aprobado o rechazado.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  decisionConceptId!: string;

  /**
   * Ficha de personal que decide.
   */
  @Property({ fieldName: 'reviewer_staff_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  reviewerStaffId?: string;

  /**
   * Fundamento de la decisión.
   */
  @Property({ columnType: 'text', nullable: true })
  rationale?: string;

  /**
   * Momento de la decisión.
   */
  @Property({ fieldName: 'decided_at', columnType: 'timestamptz' })
  decidedAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;
}
