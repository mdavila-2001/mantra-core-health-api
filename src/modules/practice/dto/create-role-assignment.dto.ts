import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsUUID,
} from 'class-validator';

/** Cuerpo de `POST /practices/{practiceId}/role-assignments` (UC-14-08). */
export class CreateRoleAssignmentDto {
  @ApiProperty({
    description:
      'Perfil del profesional (profiles.health_practitioner_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  practitionerProfileId!: string;

  @ApiPropertyOptional({ description: 'Sitio de la práctica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  @ApiPropertyOptional({ description: 'Unidad clínica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  @ApiPropertyOptional({ description: 'Servicio de salud', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string;

  @ApiPropertyOptional({ description: 'Concepto de rol', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  roleConceptId?: string;

  @ApiPropertyOptional({
    description: 'Concepto de especialidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  @ApiPropertyOptional({ description: 'Perfil del supervisor', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supervisorPractitionerProfileId?: string;

  @ApiPropertyOptional({
    description: 'Porcentaje de reparto de ingresos (numérico)',
  })
  @IsOptional()
  @IsNumberString()
  revenueSharePercent?: string;

  @ApiPropertyOptional({ description: '¿Rol primario?' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Vigente desde (ISO date)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Vigente hasta (ISO date)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}
