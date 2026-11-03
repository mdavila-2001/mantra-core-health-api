import { ApiProperty } from '@nestjs/swagger';
import { InventoryConceptDto } from './read-responses.dto';

/** An entity of the pharmacy with its display name. */
export class InventoryNamedRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

/** A stock location with its code and name. */
export class InventoryLocationRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

/** A lot with its number and expiry date. */
export class InventoryLotRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  number!: string;

  /** Expiry date (`YYYY-MM-DD`); `null` when the lot does not expire. */
  @ApiProperty({ type: String, nullable: true })
  expiresAt!: string | null;
}

/** A concept with its id, canonical code and readable label. */
export class InventoryConceptRefDto extends InventoryConceptDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}
