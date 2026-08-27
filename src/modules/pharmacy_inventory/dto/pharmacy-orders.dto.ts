import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { InventoryConceptDto } from './read-responses.dto';

/**
 * DTOs del pedido de farmacia del paciente (FAR-E1).
 *
 * El pedido se sirve **en palabras**: conceptos resueltos a `{code, display}`,
 * nombres de sede/farmacia/producto junto a cada id, y sin ningún UUID que la
 * interfaz tenga que pintar como texto. Los campos comerciales del contrato
 * FAR-I2 que dependen del cambio de modelo (modalidad de entrega, dirección,
 * precios congelados, código de retiro, motivo de rechazo, sustituciones) NO
 * se exponen todavía: llegan en una segunda vuelta cuando el modelo los
 * declare — omitirlos es honesto; servirlos vacíos fingiría que existen.
 */

/** Una línea del pedido: producto y cantidad. */
export class PharmacyOrderLineInputDto {
  /**
   * Producto de farmacia solicitado.
   */
  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  productId!: string;

  /**
   * Cantidad solicitada.
   */
  @ApiProperty({ description: 'Cantidad solicitada', minimum: 0 })
  @IsNumber()
  @IsPositive()
  quantity!: number;
}

/** Cuerpo de `POST /pharmacy/orders` (FAR-E1). */
export class CreatePharmacyOrderDto {
  /**
   * Sede de farmacia que atiende el pedido.
   */
  @ApiProperty({ format: 'uuid', description: 'Sede de farmacia' })
  @IsUUID()
  siteId!: string;

  /**
   * Receta que respalda el pedido, si existe.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Receta (clinical.medication_requests)',
  })
  @IsOptional()
  @IsUUID()
  medicationRequestId?: string;

  /**
   * Clave de idempotencia del cliente: reintentar la misma clave devuelve el
   * pedido ya creado en lugar de duplicarlo.
   */
  @ApiPropertyOptional({
    description: 'Clave de idempotencia; repetirla devuelve el mismo pedido',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;

  /**
   * Líneas del pedido.
   */
  @ApiProperty({ type: [PharmacyOrderLineInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PharmacyOrderLineInputDto)
  lines!: PharmacyOrderLineInputDto[];
}

/** Una línea del pedido, ya resuelta a palabras. */
export class PharmacyOrderLineDto {
  /**
   * Identificador asociado a product.
   */
  @ApiProperty({ format: 'uuid' })
  productId!: string;

  /**
   * Código interno del producto.
   */
  @ApiProperty()
  productCode!: string;

  /**
   * Nombre comercial.
   */
  @ApiPropertyOptional({ nullable: true })
  brandName!: string | null;

  /**
   * Nombre genérico.
   */
  @ApiPropertyOptional({ nullable: true })
  genericName!: string | null;

  /**
   * Concentración, legible.
   */
  @ApiPropertyOptional({ nullable: true })
  strengthText!: string | null;

  /**
   * Presentación, legible.
   */
  @ApiPropertyOptional({ nullable: true })
  packageSizeText!: string | null;

  /**
   * Medicamento del vademécum, resuelto.
   */
  @ApiPropertyOptional({ type: InventoryConceptDto, nullable: true })
  medication!: InventoryConceptDto | null;

  /**
   * Cantidad solicitada por el paciente.
   */
  @ApiProperty()
  requestedQuantity!: number;

  /**
   * Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock.
   */
  @ApiProperty()
  reservedQuantity!: number;

  /**
   * Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada,
   * `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada).
   */
  @ApiProperty({ type: InventoryConceptDto })
  status!: InventoryConceptDto;
}

/** Un pedido de farmacia del paciente, resuelto a palabras. */
export class PharmacyOrderDto {
  /**
   * Identificador único del pedido.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Estado del pedido (`PINV_ORDER_*`).
   */
  @ApiProperty({ type: InventoryConceptDto })
  status!: InventoryConceptDto;

  /**
   * Instante de creación, ISO 8601.
   */
  @ApiProperty()
  createdAt!: string;

  /**
   * Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el
   * carril E2 la renueva al dejarlo listo para retiro).
   */
  @ApiProperty()
  expiresAt!: string;

  /**
   * Identificador asociado a site.
   */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /**
   * Nombre de la sede.
   */
  @ApiProperty()
  siteName!: string;

  /**
   * Identificador asociado a pharmacy.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  /**
   * Nombre de la farmacia (comercial, o la razón social).
   */
  @ApiProperty()
  pharmacyName!: string;

  /**
   * Receta que respalda el pedido, si la hay.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  medicationRequestId!: string | null;

  /**
   * Líneas del pedido.
   */
  @ApiProperty({ type: [PharmacyOrderLineDto] })
  lines!: PharmacyOrderLineDto[];
}

/** Respuesta de `GET /pharmacy/orders/me`. */
export class PharmacyOrderListResponseDto {
  /**
   * Pedidos del paciente, más nuevos primero.
   */
  @ApiProperty({ type: [PharmacyOrderDto] })
  items!: PharmacyOrderDto[];

  /**
   * Cuántos pedidos se sirven.
   */
  @ApiProperty()
  count!: number;
}
