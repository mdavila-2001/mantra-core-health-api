import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';

/** Modos de integración soportados. */
export type IntegrationModeCode = 'REALTIME' | 'BATCH';

/** Cuerpo de `POST /pharmacies/{pharmacyId}/integration-connections` (UC-24-07). */
export class CreateConnectionDto {
  @ApiProperty({
    description: 'Modo de integración',
    enum: ['REALTIME', 'BATCH'],
  })
  @IsIn(['REALTIME', 'BATCH'])
  integrationMode!: IntegrationModeCode;

  @ApiPropertyOptional({
    description:
      'Conexión de integración externa registrada; si se omite, la fila se auto-referencia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  connectionId?: string;

  @ApiPropertyOptional({
    description: 'Sede a la que aplica la conexión',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  pharmacySiteId?: string;

  @ApiPropertyOptional({
    description: 'Concept id de la autoridad de inventario',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  inventoryAuthorityConceptId?: string;

  @ApiPropertyOptional({ description: 'Soporta consulta de stock' })
  @IsOptional()
  @IsBoolean()
  supportsStockQuery?: boolean;

  @ApiPropertyOptional({ description: 'Soporta consulta de precio' })
  @IsOptional()
  @IsBoolean()
  supportsPriceQuery?: boolean;

  @ApiPropertyOptional({ description: 'Soporta reserva' })
  @IsOptional()
  @IsBoolean()
  supportsReservation?: boolean;

  @ApiPropertyOptional({ description: 'Soporta confirmación de dispensación' })
  @IsOptional()
  @IsBoolean()
  supportsDispenseConfirmation?: boolean;

  @ApiPropertyOptional({ description: 'Permite fallback manual' })
  @IsOptional()
  @IsBoolean()
  manualFallbackAllowed?: boolean;
}
