import { ApiProperty } from '@nestjs/swagger';

/** An active stock location with the site it belongs to. */
export class InventoryLocationItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  @ApiProperty()
  siteName!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

/** Response of `GET /pharmacy/:pharmacyId/inventory/locations`. */
export class InventoryLocationListDto {
  @ApiProperty({ type: [InventoryLocationItemDto] })
  items!: InventoryLocationItemDto[];
}
