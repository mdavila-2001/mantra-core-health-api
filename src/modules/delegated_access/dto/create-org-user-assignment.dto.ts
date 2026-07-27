import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID, IsDateString } from 'class-validator';

const ROLES = ['STAFF', 'SECRETARY', 'ASSISTANT', 'NURSE', 'BILLING'] as const;
const SCOPES = ['TENANT', 'PRACTICE', 'SITE', 'UNIT'] as const;

/** Cuerpo de `POST /org/{tenant_membership_id}/user-assignments` (UC-29-01). */
export class CreateOrgUserAssignmentDto {
  @ApiPropertyOptional({ description: 'Rol de la asignación', enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  role?: (typeof ROLES)[number];

  @ApiPropertyOptional({ description: 'Alcance de acceso', enum: SCOPES })
  @IsOptional()
  @IsIn(SCOPES)
  accessScope?: (typeof SCOPES)[number];

  @ApiPropertyOptional({
    description: 'Nodo de scope: práctica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  @ApiPropertyOptional({
    description: 'Nodo de scope: sede de práctica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  @ApiPropertyOptional({
    description: 'Nodo de scope: unidad clínica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  @ApiPropertyOptional({
    description: 'Nodo de scope: care space',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  @ApiPropertyOptional({
    description: 'Nodo de scope: unidad de diagnóstico',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  diagnosticUnitId?: string;

  @ApiPropertyOptional({
    description: 'Nodo de scope: farmacia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  pharmacyId?: string;

  @ApiPropertyOptional({
    description: 'Supervisor responsable',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  supervisorUserId?: string;

  @ApiPropertyOptional({
    description: 'Inicio de vigencia (ISO)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    description: 'Fin de vigencia (ISO)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}
