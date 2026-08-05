import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/** Una línea de reserva de stock. */
export class ReservationLineDto {
  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  pharmacyProductId!: string;

  /**
   * Identificador asociado a inventory location.
   */
  @ApiProperty({ format: 'uuid', description: 'Ubicación de inventario' })
  @IsUUID()
  inventoryLocationId!: string;

  /**
   * Identificador asociado a inventory lot.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Lote específico' })
  @IsOptional()
  @IsUUID()
  inventoryLotId?: string;

  /**
   * Valor de requested quantity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cantidad solicitada', minimum: 0 })
  @IsNumber()
  @Min(0)
  requestedQuantity!: number;
}

/** Cuerpo de `POST /pharmacy/:pharmacyId/reservations` (UC-25-04). */
export class CreateReservationDto {
  /**
   * Identificador asociado a pharmacy site.
   */
  @ApiProperty({ format: 'uuid', description: 'Sede de farmacia' })
  @IsUUID()
  pharmacySiteId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Paciente' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a medication request.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Solicitud de medicación',
  })
  @IsOptional()
  @IsUUID()
  medicationRequestId?: string;

  /**
   * Identificador asociado a quotation.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Cotización asociada' })
  @IsOptional()
  @IsUUID()
  quotationId?: string;

  /**
   * Valor de expires in minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Minutos hasta expiración (default 60)',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInMinutes?: number;

  /**
   * Valor de lines mantenido por la instancia.
   */
  @ApiProperty({ type: [ReservationLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReservationLineDto)
  lines!: ReservationLineDto[];
}
