import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { InventoryPageQueryDto } from './inventory-page-query.dto';

/** Query of `GET /pharmacy/:pharmacyId/inventory/positions`. */
export class InventoryPositionsQueryDto extends InventoryPageQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  lotId?: string;

  @ApiPropertyOptional({
    enum: ['true', 'false'],
    description: 'Solo posiciones con existencia física o en cuarentena',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  onlyWithStock?: 'true' | 'false';
}
