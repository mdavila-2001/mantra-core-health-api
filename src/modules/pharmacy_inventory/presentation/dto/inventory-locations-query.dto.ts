import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Query of `GET /pharmacy/:pharmacyId/inventory/locations`. */
export class InventoryLocationsQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Solo esta sede' })
  @IsOptional()
  @IsUUID()
  siteId?: string;
}
