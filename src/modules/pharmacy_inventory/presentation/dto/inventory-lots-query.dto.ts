import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID, Matches } from 'class-validator';
import { InventoryPageQueryDto } from './inventory-page-query.dto';

/** Query of `GET /pharmacy/:pharmacyId/inventory/lots`. */
export class InventoryLotsQueryDto extends InventoryPageQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Solo lotes con posiciones en esta sede',
  })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({
    example: '2027-01-31',
    description: 'Solo lotes que vencen antes de esta fecha (YYYY-MM-DD)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  expiringBefore?: string;

  @ApiPropertyOptional({
    enum: ['true', 'false'],
    description: 'Incluir lotes ya vencidos (por defecto no)',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  includeExpired?: 'true' | 'false';
}
