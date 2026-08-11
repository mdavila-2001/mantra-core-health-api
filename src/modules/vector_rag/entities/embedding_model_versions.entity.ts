import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `embedding_model_versions`.
 */
@Entity({ schema: 'vector_rag', tableName: 'embedding_model_versions' })
export class EmbeddingModelVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de provider code mantenido por la instancia.
   */
  @Property({ fieldName: 'provider_code', columnType: 'varchar' })
  providerCode!: string;

  /**
   * Identificador asociado a model.
   */
  @Property({ fieldName: 'model_id', columnType: 'varchar' })
  modelId!: string;

  /**
   * Valor de model version mantenido por la instancia.
   */
  @Property({ fieldName: 'model_version', columnType: 'varchar' })
  modelVersion!: string;

  /**
   * Valor de dimension mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  dimension!: number;

  /**
   * Valor de distance metric mantenido por la instancia.
   */
  @Property({ fieldName: 'distance_metric', columnType: 'varchar' })
  distanceMetric!: string;

  /**
   * Valor de tokenizer version mantenido por la instancia.
   */
  @Property({ fieldName: 'tokenizer_version', columnType: 'varchar' })
  tokenizerVersion!: string;

  /**
   * Valor de approved for phi mantenido por la instancia.
   */
  @Property({ fieldName: 'approved_for_phi', type: 'boolean' })
  approvedForPhi!: boolean;

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
   * Valor de retired at mantenido por la instancia.
   */
  @Property({
    fieldName: 'retired_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  retiredAt?: Date;
}
