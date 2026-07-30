import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /pharmacy/:pharmacyId/transfers` (UC-25-10). */
export class CreateTransferDto {
  /**
   * Identificador asociado a pharmacy site.
   */
  @ApiProperty({ format: 'uuid', description: 'Sede de farmacia' })
  @IsUUID()
  pharmacySiteId!: string;

  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  pharmacyProductId!: string;

  /**
   * Identificador asociado a from location.
   */
  @ApiProperty({ format: 'uuid', description: 'Ubicación origen' })
  @IsUUID()
  fromLocationId!: string;

  /**
   * Identificador asociado a to location.
   */
  @ApiProperty({ format: 'uuid', description: 'Ubicación destino' })
  @IsUUID()
  toLocationId!: string;

  /**
   * Identificador asociado a inventory lot.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Lote específico' })
  @IsOptional()
  @IsUUID()
  inventoryLotId?: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cantidad a transferir', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity!: number;
}
