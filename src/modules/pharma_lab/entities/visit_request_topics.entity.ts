import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Productos o temas que el visitador declara que va a presentar (spec 5360).
 *
 * Un tema puede ser un producto del catálogo o un asunto libre; por eso
 * `pharma_product_id` es opcional y `topic` cubre el resto.
 */
@Entity({ schema: 'pharma_lab', tableName: 'visit_request_topics' })
export class VisitRequestTopics {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Solicitud a la que pertenece el tema.
   */
  @Property({ fieldName: 'visit_request_id', type: 'uuid' }) // FK → pharma_lab.visit_requests
  visitRequestId!: string;

  /**
   * Producto del catálogo, cuando el tema es un medicamento concreto.
   */
  @Property({ fieldName: 'pharma_product_id', type: 'uuid', nullable: true }) // FK → pharma_lab.pharma_products
  pharmaProductId?: string;

  /**
   * Tema libre, cuando no corresponde a un producto.
   */
  @Property({ columnType: 'varchar', nullable: true })
  topic?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
