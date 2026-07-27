import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /pharmacy/recall-holds` (UC-25-08). */
export class CreateRecallHoldDto {
  @ApiProperty({ format: 'uuid', description: 'Farmacia (para el ledger)' })
  @IsUUID()
  pharmacyId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Sede de farmacia (para el ledger)',
  })
  @IsUUID()
  pharmacySiteId!: string;

  @ApiProperty({ format: 'uuid', description: 'Producto afectado' })
  @IsUUID()
  pharmacyProductId!: string;

  @ApiProperty({ format: 'uuid', description: 'Lote a poner en cuarentena' })
  @IsUUID()
  inventoryLotId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Ubicación del lote (para el ledger)',
  })
  @IsUUID()
  inventoryLocationId!: string;

  @ApiProperty({ description: 'Referencia del recall (autoridad)' })
  @IsString()
  @MaxLength(128)
  recallReference!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant de la autoridad emisora',
  })
  @IsOptional()
  @IsUUID()
  sourceAuthorityTenantId?: string;
}
