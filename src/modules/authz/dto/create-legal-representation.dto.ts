import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Tipo de representación legal del paciente (C-07 / A-03). */
export const LEGAL_REPRESENTATION_TYPES = [
  'LEGAL_GUARDIAN',
  'PARENT',
  'ATTORNEY',
  'CURATOR',
] as const;
/**
 * Define el tipo de dominio legal representation type.
 */
export type LegalRepresentationType =
  (typeof LEGAL_REPRESENTATION_TYPES)[number];

/** Cuerpo de `POST /authz/legal-representations`. */
export class CreateLegalRepresentationDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant de la representación', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Perfil del paciente representado',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a representative user.
   */
  @ApiProperty({
    description: 'Usuario que representa al paciente',
    format: 'uuid',
  })
  @IsUUID()
  representativeUserId!: string;

  /**
   * Valor de representation type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de representación',
    enum: LEGAL_REPRESENTATION_TYPES,
  })
  @IsIn(LEGAL_REPRESENTATION_TYPES)
  representationType!: LegalRepresentationType;

  /**
   * Valor de document ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia documental que sustenta la representación',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  documentRef?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia (por defecto ahora)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fin de vigencia (abierto si se omite)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;
}
