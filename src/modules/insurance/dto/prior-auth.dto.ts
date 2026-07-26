import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Ítem de una solicitud de autorización previa (UC-26-04). */
export class PriorAuthItemDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Servicio solicitado' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  @ApiPropertyOptional({ description: 'Cantidad solicitada', example: '1' })
  @IsOptional()
  @IsNumberString()
  requestedQuantity?: string;

  @ApiPropertyOptional({ description: 'Monto solicitado', example: '250.00' })
  @IsOptional()
  @IsNumberString()
  requestedAmount?: string;
}

/** UC-26-04: solicitar autorización previa con items. */
export class CreatePriorAuthRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientCoverageId!: string;

  @ApiProperty({ format: 'uuid', description: 'Entidad prestadora solicitante' })
  @IsUUID()
  requestingProviderEntityId!: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;

  @ApiProperty({ type: [PriorAuthItemDto], description: '1..N ítems solicitados' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PriorAuthItemDto)
  items!: PriorAuthItemDto[];
}

/** UC-26-05: emitir determinación de autorización previa. */
export class CreateDeterminationDto {
  @ApiProperty({ enum: ['APPROVED', 'DENIED', 'PARTIAL'] })
  @IsIn(['APPROVED', 'DENIED', 'PARTIAL'])
  decision!: 'APPROVED' | 'DENIED' | 'PARTIAL';

  @ApiPropertyOptional({ description: 'Cantidad aprobada' })
  @IsOptional()
  @IsNumberString()
  approvedQuantity?: string;

  @ApiPropertyOptional({ description: 'Monto aprobado' })
  @IsOptional()
  @IsNumberString()
  approvedAmount?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  validFrom?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  validTo?: string;
}
