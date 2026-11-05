import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_product_images`.
 */
@Entity({ schema: 'pharmacy', tableName: 'pharmacy_product_images' })
export class PharmacyProductImages {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy product.
   */
  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products (inferida)
  pharmacyProductId!: string;

  /**
   * Identificador asociado a image file.
   */
  @Property({ fieldName: 'image_file_id', type: 'uuid' }) // FK → common.files (inferida)
  imageFileId!: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  ordinal!: number;

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
