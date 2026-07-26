import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /pharmacy/:pharmacyId/transfers` (UC-25-10). */
export class CreateTransferDto {
  @ApiProperty({ format: 'uuid', description: 'Sede de farmacia' })
  @IsUUID()
  pharmacySiteId!: string;

  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  pharmacyProductId!: string;

  @ApiProperty({ format: 'uuid', description: 'Ubicación origen' })
  @IsUUID()
  fromLocationId!: string;

  @ApiProperty({ format: 'uuid', description: 'Ubicación destino' })
  @IsUUID()
  toLocationId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Lote específico' })
  @IsOptional()
  @IsUUID()
  inventoryLotId?: string;

  @ApiProperty({ description: 'Cantidad a transferir', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity!: number;
}
