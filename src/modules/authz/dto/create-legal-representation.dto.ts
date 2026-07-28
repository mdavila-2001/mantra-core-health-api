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
export type LegalRepresentationType =
  (typeof LEGAL_REPRESENTATION_TYPES)[number];

/** Cuerpo de `POST /authz/legal-representations`. */
export class CreateLegalRepresentationDto {
  @ApiProperty({ description: 'Tenant de la representación', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Perfil del paciente representado', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({
    description: 'Usuario que representa al paciente',
    format: 'uuid',
  })
  @IsUUID()
  representativeUserId!: string;

  @ApiProperty({
    description: 'Tipo de representación',
    enum: LEGAL_REPRESENTATION_TYPES,
  })
  @IsIn(LEGAL_REPRESENTATION_TYPES)
  representationType!: LegalRepresentationType;

  @ApiPropertyOptional({
    description: 'Referencia documental que sustenta la representación',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  documentRef?: string;

  @ApiPropertyOptional({
    description: 'Inicio de vigencia (por defecto ahora)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

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
