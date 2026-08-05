import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID, IsDateString } from 'class-validator';

const ROLES = ['STAFF', 'SECRETARY', 'ASSISTANT', 'NURSE', 'BILLING'] as const;
const SCOPES = ['TENANT', 'PRACTICE', 'SITE', 'UNIT'] as const;

/** Cuerpo de `POST /org/{tenant_membership_id}/user-assignments` (UC-29-01). */
export class CreateOrgUserAssignmentDto {
  /**
   * Valor de role mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Rol de la asignación', enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  role?: (typeof ROLES)[number];

  /**
   * Valor de access scope mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Alcance de acceso', enum: SCOPES })
  @IsOptional()
  @IsIn(SCOPES)
  accessScope?: (typeof SCOPES)[number];

  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({
    description: 'Nodo de scope: práctica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /**
   * Identificador asociado a practice site.
   */
  @ApiPropertyOptional({
    description: 'Nodo de scope: sede de práctica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /**
   * Identificador asociado a clinical unit.
   */
  @ApiPropertyOptional({
    description: 'Nodo de scope: unidad clínica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /**
   * Identificador asociado a care space.
   */
  @ApiPropertyOptional({
    description: 'Nodo de scope: care space',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  /**
   * Identificador asociado a diagnostic unit.
   */
  @ApiPropertyOptional({
    description: 'Nodo de scope: unidad de diagnóstico',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  diagnosticUnitId?: string;

  /**
   * Identificador asociado a pharmacy.
   */
  @ApiPropertyOptional({
    description: 'Nodo de scope: farmacia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  pharmacyId?: string;

  /**
   * Identificador asociado a supervisor user.
   */
  @ApiPropertyOptional({
    description: 'Supervisor responsable',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  supervisorUserId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia (ISO)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fin de vigencia (ISO)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}
