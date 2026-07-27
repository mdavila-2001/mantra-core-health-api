import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /consent/privacy-restrictions` (UC-07-07). */
export class CreatePrivacyRestrictionDto {
  @ApiProperty({
    description: 'Paciente titular (patient profile id)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({
    description: 'Clase de datos restringida (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  dataClassConceptId!: string;

  @ApiPropertyOptional({
    description: 'Tipo de restricción (concept id); por defecto bloqueo',
  })
  @IsOptional()
  @IsUUID()
  restrictionTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de actor destino (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  targetActorTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Actor destino concreto (id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  targetActorId?: string;

  @ApiPropertyOptional({ description: 'Motivo textual' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reasonText?: string;

  @ApiPropertyOptional({ description: 'Fin de vigencia (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;

  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
