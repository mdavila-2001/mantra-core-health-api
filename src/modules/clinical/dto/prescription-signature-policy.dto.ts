import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /clinical/prescription-signature-policies` (REDESA D-05).
 * Las dimensiones opcionales (jurisdicción, tipo de medicamento, canal) son
 * comodines cuando se omiten: la política aplica a todo lo no acotado.
 */
export class CreatePrescriptionSignaturePolicyDto {
  @ApiProperty({
    description: 'Tenant al que aplica la política (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({
    description: 'Código de jurisdicción (comodín si se omite)',
    maxLength: 16,
  })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  jurisdictionCode?: string;

  @ApiPropertyOptional({
    description: 'Tipo de medicamento (concept id); comodín si se omite',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  medicationTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Canal de emisión (concept id); comodín si se omite',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  channelConceptId?: string;

  @ApiProperty({
    description: 'Si la firma es obligatoria cuando esta política aplica',
  })
  @IsBoolean()
  signatureRequired!: boolean;

  @ApiPropertyOptional({
    description: 'Inicio de vigencia (por defecto, ahora)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({
    description: 'Fin de vigencia (nulo = indefinido)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

/** Respuesta de una política de firma de receta. */
export class PrescriptionSignaturePolicyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiPropertyOptional({ nullable: true })
  jurisdictionCode?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  medicationTypeConceptId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  channelConceptId?: string | null;

  @ApiProperty()
  signatureRequired!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  effectiveFrom!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveTo?: Date | null;
}
