import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Productos que el visitador está autorizado a representar (spec 5301, 5311).
 *
 * No es decoración: el servicio de solicitudes rechaza una visita cuyo temario
 * incluya un producto que el visitador no representa, y el registro de visita
 * rechaza material asociado a un producto no autorizado.
 */
@Entity({ schema: 'pharma_lab', tableName: 'medical_visitor_products' })
export class MedicalVisitorProducts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Visitador autorizado.
   */
  @Property({ fieldName: 'medical_visitor_id', type: 'uuid' }) // FK → pharma_lab.medical_visitors
  medicalVisitorId!: string;

  /**
   * Medicamento del catálogo del laboratorio.
   */
  @Property({ fieldName: 'pharma_product_id', type: 'uuid' }) // FK → pharma_lab.pharma_products
  pharmaProductId!: string;

  /**
   * Fecha desde la que rige la autorización.
   */
  @Property({ fieldName: 'authorized_from', columnType: 'date' })
  authorizedFrom!: string;

  /**
   * Fecha en que se revocó la autorización.
   */
  @Property({ fieldName: 'authorized_to', columnType: 'date', nullable: true })
  authorizedTo?: string;

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
