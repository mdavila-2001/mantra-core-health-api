import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
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
 * interfaz tenga que pintar como texto. Con el modelo v4.2.1 el pedido ya
 * persiste su modalidad de entrega y su código de retiro, y este contrato los
 * sirve; lo que sigue sin modelo o sin carril (dirección de envío, precios
 * congelados, motivo de rechazo persistido, sustituciones) NO se expone
 * todavía — omitirlo es honesto; servirlo vacío fingiría que existe.
 */

/**
 * Modalidades de entrega del contrato FAR-I2, como las escribe el cliente.
 *
 * Las tres se aceptan en la validación para poder responder un 422
 * **tipificado y explicable** sobre las dos de envío — el carril de envío es
 * FAR-E4 y todavía no existe; rechazarlas en el pipe sería un 400 mudo.
 */
export const DELIVERY_MODES = ['RETIRO', 'DOMICILIO', 'TRABAJO'] as const;

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
   * Cómo llega el pedido a la persona. Hoy solo `RETIRO` se persiste; las dos
   * modalidades de envío responden 422 tipificado hasta que exista el carril
   * de envío (FAR-E4). Opcional por compatibilidad: un pedido sin modalidad
   * se crea, pero nunca va a poder marcarse listo para retiro.
   */
  @ApiPropertyOptional({ enum: DELIVERY_MODES })
  @IsOptional()
  @IsIn([...DELIVERY_MODES])
  deliveryMode?: (typeof DELIVERY_MODES)[number];

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
   * Cantidad ya entregada en el mostrador, acumulada entre entregas parciales
   * (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`.
   */
  @ApiProperty()
  fulfilledQuantity!: number;

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
   * Nombre pintable del paciente, resuelto en lote por el backend (la bandeja
   * FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene
   * nombre cargado.
   */
  @ApiPropertyOptional({ nullable: true })
  patientName!: string | null;

  /**
   * Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos
   * anteriores al modelo v4.2.1, que no la declararon.
   */
  @ApiPropertyOptional({ type: InventoryConceptDto, nullable: true })
  deliveryMode!: InventoryConceptDto | null;

  /**
   * Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`.
   *
   * **Solo en la lectura del titular**: es la prueba de posesión con que la
   * persona retira, así que la bandeja y las lecturas de staff lo sirven
   * `null` — el mostrador no valida mirándolo, valida enviándolo en
   * `POST /pharmacy/orders/:id/dispense`.
   */
  @ApiPropertyOptional({ nullable: true })
  pickupCode!: string | null;

  /**
   * Líneas del pedido.
   */
  @ApiProperty({ type: [PharmacyOrderLineDto] })
  lines!: PharmacyOrderLineDto[];
}

/**
 * Decisiones por renglón al confirmar (FAR-E2).
 *
 * `PROPONER_GENERICO` se acepta en la validación para poder responder con un
 * 422 **tipificado y explicable** — la propuesta de sustitución está bloqueada
 * por modelo (sin persistencia por línea) y rechazarla en el pipe de
 * validación la volvería un 400 mudo.
 */
export const CONFIRM_LINE_DECISIONS = [
  'NO_DISPONIBLE',
  'PROPONER_GENERICO',
] as const;

/** Un ajuste de línea que el mostrador declara al confirmar. */
export class ConfirmOrderAdjustmentDto {
  /**
   * Producto del renglón ajustado.
   */
  @ApiProperty({ format: 'uuid', description: 'Producto de la línea ajustada' })
  @IsUUID()
  productId!: string;

  /**
   * Qué decidió el mostrador sobre el renglón.
   */
  @ApiProperty({ enum: CONFIRM_LINE_DECISIONS })
  @IsIn([...CONFIRM_LINE_DECISIONS])
  decision!: (typeof CONFIRM_LINE_DECISIONS)[number];
}

/** Cuerpo de `POST /pharmacy/orders/:id/confirm` (FAR-E2). */
export class ConfirmPharmacyOrderDto {
  /**
   * Ajustes por renglón; sin ajustes, se confirma todo tal como está.
   */
  @ApiPropertyOptional({ type: [ConfirmOrderAdjustmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmOrderAdjustmentDto)
  adjustments?: ConfirmOrderAdjustmentDto[];
}

/** Cuerpo de `POST /pharmacy/orders/:id/reject` (FAR-E2). */
export class RejectPharmacyOrderDto {
  /**
   * Motivo del rechazo, obligatorio y en palabras.
   *
   * **No se persiste en el pedido** (bloqueador de modelo): viaja en el evento
   * de dominio y en el aviso inmediato al paciente, y el `GET` del pedido no
   * puede devolverlo hasta que el modelo declare la columna.
   */
  @ApiProperty({ description: 'Motivo del rechazo (no se persiste todavía)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

/** Cuerpo de `POST /pharmacy/orders/:id/dispense` (FAR-E3). */
export class DispensePharmacyOrderDto {
  /**
   * El código que trae la persona al mostrador. Se compara sin distinguir
   * mayúsculas; un código que no coincide responde 422 tipificado sin ningún
   * efecto — el front lo muestra como `codigoValido: false`, no como error.
   */
  @ApiProperty({ description: 'Código de retiro que presenta la persona' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  pickupCode!: string;

  /**
   * Productos que se lleva en ESTA entrega (parcial). Sin declarar, se
   * entrega todo el saldo en pie del pedido.
   */
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Productos de esta entrega; omitido = todo el saldo en pie',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  productIds?: string[];

  /**
   * Clave de idempotencia del mostrador: reintentar la misma clave devuelve
   * el pedido tal como quedó, sin repetir stock ni ledger.
   */
  @ApiPropertyOptional({
    description: 'Clave de idempotencia; repetirla no duplica la entrega',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;
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
