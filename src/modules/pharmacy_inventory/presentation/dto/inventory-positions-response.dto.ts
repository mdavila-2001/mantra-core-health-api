import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../common';
import {
  InventoryLocationRefDto,
  InventoryLotRefDto,
  InventoryNamedRefDto,
} from './inventory-management-refs.dto';

/** A stock position: product at a location, per lot, split by availability. */
export class InventoryPositionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: InventoryNamedRefDto })
  product!: InventoryNamedRefDto;

  @ApiProperty({ type: InventoryNamedRefDto })
  site!: InventoryNamedRefDto;

  @ApiProperty({ type: InventoryLocationRefDto })
  location!: InventoryLocationRefDto;

  @ApiProperty({ type: InventoryLotRefDto, nullable: true })
  lot!: InventoryLotRefDto | null;

  @ApiProperty({ description: 'Existencia física' })
  onHand!: number;

  @ApiProperty({ description: 'Reservado para dispensaciones y pedidos' })
  reserved!: number;

  @ApiProperty({ description: 'En cuarentena o retenido' })
  quarantine!: number;

  @ApiProperty({ description: 'Disponible para dispensar' })
  available!: number;
}

/** Response of `GET /pharmacy/:pharmacyId/inventory/positions`. */
export class InventoryPositionPageDto {
  @ApiProperty({ type: [InventoryPositionItemDto] })
  data!: InventoryPositionItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
