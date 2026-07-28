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
  /**
   * Identificador asociado a service concept.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Servicio solicitado' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  /**
   * Valor de requested quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad solicitada', example: '1' })
  @IsOptional()
  @IsNumberString()
  requestedQuantity?: string;

  /**
   * Valor de requested amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Monto solicitado', example: '250.00' })
  @IsOptional()
  @IsNumberString()
  requestedAmount?: string;
}

/** UC-26-04: solicitar autorización previa con items. */
export class CreatePriorAuthRequestDto {
  /**
   * Identificador asociado a patient coverage.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientCoverageId!: string;

  /**
   * Identificador asociado a requesting provider entity.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Entidad prestadora solicitante',
  })
  @IsUUID()
  requestingProviderEntityId!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({
    type: [PriorAuthItemDto],
    description: '1..N ítems solicitados',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PriorAuthItemDto)
  items!: PriorAuthItemDto[];
}

/** UC-26-05: emitir determinación de autorización previa. */
export class CreateDeterminationDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ enum: ['APPROVED', 'DENIED', 'PARTIAL'] })
  @IsIn(['APPROVED', 'DENIED', 'PARTIAL'])
  decision!: 'APPROVED' | 'DENIED' | 'PARTIAL';

  /**
   * Valor de approved quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad aprobada' })
  @IsOptional()
  @IsNumberString()
  approvedQuantity?: string;

  /**
   * Valor de approved amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Monto aprobado' })
  @IsOptional()
  @IsNumberString()
  approvedAmount?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  validTo?: string;
}
