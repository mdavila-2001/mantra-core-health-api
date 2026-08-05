import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsUUID,
} from 'class-validator';

/** Cuerpo de `POST /practices/{practiceId}/role-assignments` (UC-14-08). */
@ApiSchema({ name: 'PracticeCreateRoleAssignmentDto' })
export class CreateRoleAssignmentDto {
  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiProperty({
    description:
      'Perfil del profesional (profiles.health_practitioner_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  practitionerProfileId!: string;

  /**
   * Identificador asociado a practice site.
   */
  @ApiPropertyOptional({ description: 'Sitio de la práctica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /**
   * Identificador asociado a clinical unit.
   */
  @ApiPropertyOptional({ description: 'Unidad clínica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /**
   * Identificador asociado a healthcare service.
   */
  @ApiPropertyOptional({ description: 'Servicio de salud', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string;

  /**
   * Identificador asociado a role concept.
   */
  @ApiPropertyOptional({ description: 'Concepto de rol', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  roleConceptId?: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de especialidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Identificador asociado a supervisor practitioner profile.
   */
  @ApiPropertyOptional({ description: 'Perfil del supervisor', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supervisorPractitionerProfileId?: string;

  /**
   * Valor de revenue share percent mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Porcentaje de reparto de ingresos (numérico)',
  })
  @IsOptional()
  @IsNumberString()
  revenueSharePercent?: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: '¿Rol primario?' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vigente desde (ISO date)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vigente hasta (ISO date)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}
