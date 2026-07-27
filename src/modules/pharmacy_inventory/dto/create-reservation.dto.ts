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
  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  pharmacyProductId!: string;

  @ApiProperty({ format: 'uuid', description: 'Ubicación de inventario' })
  @IsUUID()
  inventoryLocationId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Lote específico' })
  @IsOptional()
  @IsUUID()
  inventoryLotId?: string;

  @ApiProperty({ description: 'Cantidad solicitada', minimum: 0 })
  @IsNumber()
  @Min(0)
  requestedQuantity!: number;
}

/** Cuerpo de `POST /pharmacy/:pharmacyId/reservations` (UC-25-04). */
export class CreateReservationDto {
  @ApiProperty({ format: 'uuid', description: 'Sede de farmacia' })
  @IsUUID()
  pharmacySiteId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Paciente' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Solicitud de medicación',
  })
  @IsOptional()
  @IsUUID()
  medicationRequestId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Cotización asociada' })
  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @ApiPropertyOptional({
    description: 'Minutos hasta expiración (default 60)',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInMinutes?: number;

  @ApiProperty({ type: [ReservationLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReservationLineDto)
  lines!: ReservationLineDto[];
}
