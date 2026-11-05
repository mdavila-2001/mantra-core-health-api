import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../common';
import {
  InventoryConceptRefDto,
  InventoryLocationRefDto,
  InventoryLotRefDto,
  InventoryNamedRefDto,
} from './inventory-management-refs.dto';
import { InventoryConceptDto } from './read-responses.dto';

/** An immutable ledger entry (kardex line). */
export class InventoryLedgerItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Monotonic sequence of the entry within the pharmacy. */
  @ApiProperty()
  sequence!: string;

  @ApiProperty({ format: 'date-time' })
  occurredAt!: string;

  @ApiProperty({ type: InventoryConceptRefDto })
  movementType!: InventoryConceptRefDto;

  @ApiProperty({ type: InventoryNamedRefDto })
  product!: InventoryNamedRefDto;

  @ApiProperty({ type: InventoryNamedRefDto })
  site!: InventoryNamedRefDto;

  @ApiProperty({ type: InventoryLocationRefDto })
  location!: InventoryLocationRefDto;

  @ApiProperty({ type: InventoryLotRefDto, nullable: true })
  lot!: InventoryLotRefDto | null;

  @ApiProperty({ description: 'Variación de la existencia, con signo' })
  quantityDelta!: number;

  @ApiProperty({ description: 'Variación de lo reservado, con signo' })
  reservationDelta!: number;

  @ApiProperty({ description: 'Variación de lo en cuarentena, con signo' })
  quarantineDelta!: number;

  @ApiProperty({ type: InventoryConceptDto, nullable: true })
  sourceType!: InventoryConceptDto | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  sourceId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  unitCostAmount!: string | null;

  /** Code of the currency concept of the unit cost. */
  @ApiProperty({ type: String, nullable: true })
  currencyCode!: string | null;
}

/** Response of `GET /pharmacy/:pharmacyId/inventory/ledger`. */
export class InventoryLedgerPageDto {
  @ApiProperty({ type: [InventoryLedgerItemDto] })
  data!: InventoryLedgerItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
