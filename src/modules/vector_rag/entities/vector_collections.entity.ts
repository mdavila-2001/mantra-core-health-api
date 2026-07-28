import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `vector_collections`.
 */
@Entity({ schema: 'vector_rag', tableName: 'vector_collections' })
export class VectorCollections {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

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
   * Identificador asociado a embedding model version.
   */
  @Property({ fieldName: 'embedding_model_version_id', type: 'uuid' })
  embeddingModelVersionId!: string;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @Property({ fieldName: 'contains_phi', type: 'boolean' })
  containsPhi!: boolean;

  /**
   * Identificador asociado a access policy.
   */
  @Property({ fieldName: 'access_policy_id', type: 'uuid' })
  accessPolicyId!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
