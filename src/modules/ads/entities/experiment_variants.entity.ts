import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `experiment_variants`.
 */
@Entity({ schema: 'ads', tableName: 'experiment_variants' })
export class ExperimentVariants {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad experiment.
   */
  @Property({ fieldName: 'ad_experiment_id', type: 'uuid' }) // FK → ads.ad_experiments
  adExperimentId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de variant ref type mantenido por la instancia.
   */
  @Property({ fieldName: 'variant_ref_type', columnType: 'varchar' })
  variantRefType!: string;

  /**
   * Identificador asociado a variant ref.
   */
  @Property({ fieldName: 'variant_ref_id', type: 'uuid' })
  variantRefId!: string;

  /**
   * Valor de traffic split percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'traffic_split_percent',
    columnType: 'numeric',
    nullable: true,
  })
  trafficSplitPercent?: string;

  /**
   * Valor de is control mantenido por la instancia.
   */
  @Property({ fieldName: 'is_control', type: 'boolean', nullable: true })
  isControl?: boolean;

  /**
   * Valor de result metric value mantenido por la instancia.
   */
  @Property({
    fieldName: 'result_metric_value',
    columnType: 'numeric',
    nullable: true,
  })
  resultMetricValue?: string;

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
