import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { IsStrictBoolean } from '../../../pharmacy/dto/strict-boolean';

/**
 * Cuerpo de `PUT /pharmacies/:pharmacyId/sites/:siteId/products/:productId/availability`.
 */
export class SetSiteAvailabilityDto {
  /**
   * «Lo tengo» (`true`) o «No lo tengo» (`false`) en esa sede. `false` deja la
   * cantidad en 0 aunque el cuerpo traiga una.
   */
  @ApiProperty({ description: '«Lo tengo» en esta sucursal' })
  // Se valida lo que llegó en el cuerpo y no lo ya convertido: con la
  // conversión implícita del `ValidationPipe`, `"false"` (un texto no vacío)
  // llegaría como `true` y guardaría «Lo tengo» (ver `IsStrictBoolean`).
  @IsStrictBoolean()
  available!: boolean;

  /**
   * Unidades para vender en la sede. Sin ella, «Lo tengo» toma el conteo del
   * catálogo, o 1 si el producto no tiene conteo o está en 0.
   */
  @ApiPropertyOptional({ minimum: 0, maximum: 1_000_000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  quantity?: number;
}

/** El producto en la sede, después de escribir. */
export class SiteAvailabilityResponseDto {
  /**
   * Sede de la farmacia.
   */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /**
   * Producto de la farmacia.
   */
  @ApiProperty({ format: 'uuid' })
  productId!: string;

  /**
   * Si hay unidades para vender en la sede.
   */
  @ApiProperty()
  available!: boolean;

  /**
   * Unidades para vender en la sede (sin lo reservado ni lo retenido).
   */
  @ApiProperty()
  quantity!: number;

  /**
   * Última actualización de la existencia de la sede, en ISO 8601.
   */
  @ApiProperty({ format: 'date-time' })
  stockUpdatedAt!: string;
}
