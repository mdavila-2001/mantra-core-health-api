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
 * Cuerpo de `POST /clinical/prescription-signature-policies` (ALOVIDA D-05).
 * Las dimensiones opcionales (jurisdicción, tipo de medicamento, canal) son
 * comodines cuando se omiten: la política aplica a todo lo no acotado.
 */
export class CreatePrescriptionSignaturePolicyDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({
    description: 'Tenant al que aplica la política (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de jurisdiction code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Código de jurisdicción (comodín si se omite)',
    maxLength: 16,
  })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  jurisdictionCode?: string;

  /**
   * Identificador asociado a medication type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de medicamento (concept id); comodín si se omite',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  medicationTypeConceptId?: string;

  /**
   * Identificador asociado a channel concept.
   */
  @ApiPropertyOptional({
    description: 'Canal de emisión (concept id); comodín si se omite',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  channelConceptId?: string;

  /**
   * Valor de signature required mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Si la firma es obligatoria cuando esta política aplica',
  })
  @IsBoolean()
  signatureRequired!: boolean;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia (por defecto, ahora)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  /**
   * Valor de effective to mantenido por la instancia.
   */
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
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Valor de jurisdiction code mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  jurisdictionCode?: string | null;

  /**
   * Identificador asociado a medication type concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  medicationTypeConceptId?: string | null;

  /**
   * Identificador asociado a channel concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  channelConceptId?: string | null;

  /**
   * Valor de signature required mantenido por la instancia.
   */
  @ApiProperty()
  signatureRequired!: boolean;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveTo?: Date | null;
}
