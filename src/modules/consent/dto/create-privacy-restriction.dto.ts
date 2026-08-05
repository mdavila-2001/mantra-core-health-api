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
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente titular (patient profile id)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a data class concept.
   */
  @ApiProperty({
    description: 'Clase de datos restringida (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  dataClassConceptId!: string;

  /**
   * Identificador asociado a restriction type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de restricción (concept id); por defecto bloqueo',
  })
  @IsOptional()
  @IsUUID()
  restrictionTypeConceptId?: string;

  /**
   * Identificador asociado a target actor type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de actor destino (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  targetActorTypeConceptId?: string;

  /**
   * Identificador asociado a target actor.
   */
  @ApiPropertyOptional({
    description: 'Actor destino concreto (id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  targetActorId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo textual' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reasonText?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fin de vigencia (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
