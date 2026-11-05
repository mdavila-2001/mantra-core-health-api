import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { PHARMACY_INVENTORY_CONCEPT_SEEDS } from '../../domain/pharmacy_inventory.concepts';
import { InventoryPageQueryDto } from './inventory-page-query.dto';

/**
 * Movement type codes as the catalog stores them (`catalog_concepts.code` is
 * the seed key, e.g. `pharmacy_inventory:MV_RECEIPT`), the same value the
 * response returns in `movementType.code`.
 */
export const MOVEMENT_TYPE_CODES: readonly string[] =
  PHARMACY_INVENTORY_CONCEPT_SEEDS.map((seed) => seed.key).filter((key) =>
    key.startsWith('pharmacy_inventory:MV_'),
  );

/** Query of `GET /pharmacy/:pharmacyId/inventory/ledger`. */
export class InventoryLedgerQueryDto extends InventoryPageQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  lotId?: string;

  @ApiPropertyOptional({
    example: 'pharmacy_inventory:MV_RECEIPT',
    enum: MOVEMENT_TYPE_CODES,
    description:
      'Código del tipo de movimiento, como sale en movementType.code',
  })
  @IsOptional()
  @IsIn(MOVEMENT_TYPE_CODES)
  movementType?: string;

  @ApiPropertyOptional({ description: 'Desde este instante (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Hasta este instante (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
