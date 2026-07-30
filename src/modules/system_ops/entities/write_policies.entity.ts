import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `write_policies`.
 */
@Entity({ schema: 'system_ops', tableName: 'write_policies' })
export class WritePolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a insert mode concept.
   */
  @Property({ fieldName: 'insert_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  insertModeConceptId!: string;

  /**
   * Identificador asociado a update mode concept.
   */
  @Property({ fieldName: 'update_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  updateModeConceptId!: string;

  /**
   * Identificador asociado a delete mode concept.
   */
  @Property({ fieldName: 'delete_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  deleteModeConceptId!: string;

  /**
   * Valor de requires reason mantenido por la instancia.
   */
  @Property({ fieldName: 'requires_reason', type: 'boolean', nullable: true })
  requiresReason?: boolean;

  /**
   * Valor de requires approval mantenido por la instancia.
   */
  @Property({ fieldName: 'requires_approval', type: 'boolean', nullable: true })
  requiresApproval?: boolean;

  /**
   * Valor de max batch size mantenido por la instancia.
   */
  @Property({ fieldName: 'max_batch_size', columnType: 'int', nullable: true })
  maxBatchSize?: number;

  /**
   * Valor de dual control mantenido por la instancia.
   */
  @Property({ fieldName: 'dual_control', type: 'boolean', nullable: true })
  dualControl?: boolean;

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
