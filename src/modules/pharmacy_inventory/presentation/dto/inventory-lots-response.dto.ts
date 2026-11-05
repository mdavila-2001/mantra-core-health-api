import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../common';
import { InventoryNamedRefDto } from './inventory-management-refs.dto';
import { InventoryConceptDto } from './read-responses.dto';

/** On-hand quantity of a lot in one site. */
export class InventoryLotSiteStockDto {
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  @ApiProperty()
  siteName!: string;

  @ApiProperty()
  onHand!: number;
}

/** A lot with its states and on-hand stock. */
export class InventoryLotItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: InventoryNamedRefDto })
  product!: InventoryNamedRefDto;

  @ApiProperty()
  lotNumber!: string;

  /** Expiry date (`YYYY-MM-DD`); `null` when the lot does not expire. */
  @ApiProperty({ type: String, nullable: true })
  expiresAt!: string | null;

  @ApiProperty({ type: InventoryConceptDto, nullable: true })
  quarantineStatus!: InventoryConceptDto | null;

  @ApiProperty({ type: InventoryConceptDto, nullable: true })
  recallStatus!: InventoryConceptDto | null;

  /** On-hand total over `bySite` (all sites, or the filtered one). */
  @ApiProperty()
  onHandTotal!: number;

  @ApiProperty({ type: [InventoryLotSiteStockDto] })
  bySite!: InventoryLotSiteStockDto[];
}

/** Response of `GET /pharmacy/:pharmacyId/inventory/lots`. */
export class InventoryLotPageDto {
  @ApiProperty({ type: [InventoryLotItemDto] })
  data!: InventoryLotItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
