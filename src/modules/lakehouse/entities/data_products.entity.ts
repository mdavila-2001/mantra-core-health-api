import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `data_products`.
 */
@Entity({ schema: 'lakehouse', tableName: 'data_products' })
export class DataProducts {
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
   * Identificador asociado a owner team.
   */
  @Property({ fieldName: 'owner_team_id', type: 'uuid' })
  ownerTeamId!: string;

  /**
   * Valor de business purpose mantenido por la instancia.
   */
  @Property({ fieldName: 'business_purpose', columnType: 'text' })
  businessPurpose!: string;

  /**
   * Valor de classification code mantenido por la instancia.
   */
  @Property({ fieldName: 'classification_code', columnType: 'varchar' })
  classificationCode!: string;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @Property({ fieldName: 'contains_phi', type: 'boolean' })
  containsPhi!: boolean;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;
}
