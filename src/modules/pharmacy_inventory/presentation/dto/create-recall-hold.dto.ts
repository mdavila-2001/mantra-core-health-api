import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /pharmacy/recall-holds` (UC-25-08). */
export class CreateRecallHoldDto {
  /**
   * Identificador asociado a pharmacy.
   */
  @ApiProperty({ format: 'uuid', description: 'Farmacia (para el ledger)' })
  @IsUUID()
  pharmacyId!: string;

  /**
   * Identificador asociado a pharmacy site.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Sede de farmacia (para el ledger)',
  })
  @IsUUID()
  pharmacySiteId!: string;

  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiProperty({ format: 'uuid', description: 'Producto afectado' })
  @IsUUID()
  pharmacyProductId!: string;

  /**
   * Identificador asociado a inventory lot.
   */
  @ApiProperty({ format: 'uuid', description: 'Lote a poner en cuarentena' })
  @IsUUID()
  inventoryLotId!: string;

  /**
   * Identificador asociado a inventory location.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Ubicación del lote (para el ledger)',
  })
  @IsUUID()
  inventoryLocationId!: string;

  /**
   * Valor de recall reference mantenido por la instancia.
   */
  @ApiProperty({ description: 'Referencia del recall (autoridad)' })
  @IsString()
  @MaxLength(128)
  recallReference!: string;

  /**
   * Identificador asociado a source authority tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant de la autoridad emisora',
  })
  @IsOptional()
  @IsUUID()
  sourceAuthorityTenantId?: string;
}
