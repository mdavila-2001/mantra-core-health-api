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
  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  pharmacyProductId!: string;

  @ApiProperty({ format: 'uuid', description: 'Ubicación desde donde se dispensa' })
  @IsUUID()
  inventoryLocationId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Lote dispensado' })
  @IsOptional()
  @IsUUID()
  inventoryLotId?: string;

  @ApiProperty({ description: 'Cantidad dispensada', minimum: 0 })
  @IsNumber()
  @Min(0)
  dispensedQuantity!: number;

  @ApiPropertyOptional({ description: 'Monto a cargo del paciente' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  patientAmount?: number;

  @ApiPropertyOptional({ description: 'Monto a cargo del asegurador' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  insurerAmount?: number;
}

/** Cuerpo de `POST /pharmacy/:pharmacyId/dispensations` (UC-25-03). */
export class CreateDispensationDto {
  @ApiProperty({ format: 'uuid', description: 'Sede de farmacia' })
  @IsUUID()
  pharmacySiteId!: string;

  @ApiProperty({ format: 'uuid', description: 'Paciente' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Solicitud de medicación' })
  @IsOptional()
  @IsUUID()
  medicationRequestId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Reserva a consumir' })
  @IsOptional()
  @IsUUID()
  inventoryReservationId?: string;

  @ApiPropertyOptional({ description: 'Clave de idempotencia' })
  @IsOptional()
  idempotencyKey?: string;

  @ApiProperty({ type: [DispensationLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DispensationLineDto)
  lines!: DispensationLineDto[];
}
