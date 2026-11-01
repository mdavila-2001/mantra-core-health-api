import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_change_acknowledgements`.
 */
@Entity({
  schema: 'data_catalog',
  tableName: 'catalog_change_acknowledgements',
})
export class CatalogChangeAcknowledgements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a change event.
   */
  @Property({ fieldName: 'change_event_id', type: 'uuid' }) // FK (destino no resuelto)
  changeEventId!: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users (inferida)
  userId!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  reason?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
