import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';

/** Modos de integración soportados. */
export type IntegrationModeCode = 'REALTIME' | 'BATCH';

/** Cuerpo de `POST /pharmacies/{pharmacyId}/integration-connections` (UC-24-07). */
export class CreateConnectionDto {
  /**
   * Valor de integration mode mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Modo de integración',
    enum: ['REALTIME', 'BATCH'],
  })
  @IsIn(['REALTIME', 'BATCH'])
  integrationMode!: IntegrationModeCode;

  /**
   * Identificador asociado a connection.
   */
  @ApiPropertyOptional({
    description:
      'Conexión de integración externa registrada; si se omite, la fila se auto-referencia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  connectionId?: string;

  /**
   * Identificador asociado a pharmacy site.
   */
  @ApiPropertyOptional({
    description: 'Sede a la que aplica la conexión',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  pharmacySiteId?: string;

  /**
   * Identificador asociado a inventory authority concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de la autoridad de inventario',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  inventoryAuthorityConceptId?: string;

  /**
   * Valor de supports stock query mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Soporta consulta de stock' })
  @IsOptional()
  @IsBoolean()
  supportsStockQuery?: boolean;

  /**
   * Valor de supports price query mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Soporta consulta de precio' })
  @IsOptional()
  @IsBoolean()
  supportsPriceQuery?: boolean;

  /**
   * Valor de supports reservation mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Soporta reserva' })
  @IsOptional()
  @IsBoolean()
  supportsReservation?: boolean;

  /**
   * Valor de supports dispense confirmation mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Soporta confirmación de dispensación' })
  @IsOptional()
  @IsBoolean()
  supportsDispenseConfirmation?: boolean;

  /**
   * Valor de manual fallback allowed mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Permite fallback manual' })
  @IsOptional()
  @IsBoolean()
  manualFallbackAllowed?: boolean;
}
