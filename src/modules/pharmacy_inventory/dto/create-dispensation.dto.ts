import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/** Una línea de dispensación. */
export class DispensationLineDto {
  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  pharmacyProductId!: string;

  /**
   * Identificador asociado a inventory location.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Ubicación desde donde se dispensa',
  })
  @IsUUID()
  inventoryLocationId!: string;

  /**
   * Identificador asociado a inventory lot.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Lote dispensado' })
  @IsOptional()
  @IsUUID()
  inventoryLotId?: string;

  /**
   * Valor de dispensed quantity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cantidad dispensada', minimum: 0 })
  @IsNumber()
  @Min(0)
  dispensedQuantity!: number;

  /**
   * Valor de patient amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Monto a cargo del paciente' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  patientAmount?: number;

  /**
   * Valor de insurer amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Monto a cargo del asegurador' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  insurerAmount?: number;
}

/** Cuerpo de `POST /pharmacy/:pharmacyId/dispensations` (UC-25-03). */
export class CreateDispensationDto {
  /**
   * Identificador asociado a pharmacy site.
   */
  @ApiProperty({ format: 'uuid', description: 'Sede de farmacia' })
  @IsUUID()
  pharmacySiteId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Paciente' })
  @IsUUID()
  patientProfileId!: string;

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
   * Identificador asociado a inventory reservation.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Reserva a consumir' })
  @IsOptional()
  @IsUUID()
  inventoryReservationId?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Clave de idempotencia' })
  @IsOptional()
  idempotencyKey?: string;

  /**
   * Valor de lines mantenido por la instancia.
   */
  @ApiProperty({ type: [DispensationLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DispensationLineDto)
  lines!: DispensationLineDto[];
}
