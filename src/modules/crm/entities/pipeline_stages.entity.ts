import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pipeline_stages`.
 */
@Entity({ schema: 'crm', tableName: 'pipeline_stages' })
export class PipelineStages {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pipeline.
   */
  @Property({ fieldName: 'pipeline_id', type: 'uuid' }) // FK → crm.pipelines
  pipelineId!: string;

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
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  /**
   * Valor de probability percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'probability_percent',
    columnType: 'numeric',
    nullable: true,
  })
  probabilityPercent?: string;

  /**
   * Valor de is won mantenido por la instancia.
   */
  @Property({ fieldName: 'is_won', type: 'boolean', nullable: true })
  isWon?: boolean;

  /**
   * Valor de is lost mantenido por la instancia.
   */
  @Property({ fieldName: 'is_lost', type: 'boolean', nullable: true })
  isLost?: boolean;

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
