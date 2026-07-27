import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /diagnostic-units/{id}/practitioner-assignments` (UC-23-10). */
export class CreatePractitionerAssignmentDto {
  @ApiProperty({
    description: 'Asignación de rol del profesional (RRHH)',
    format: 'uuid',
  })
  @IsUUID()
  practitionerRoleAssignmentId!: string;

  @ApiPropertyOptional({ description: 'Sitio de la unidad', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  diagnosticUnitSiteId?: string;

  @ApiPropertyOptional({
    description: 'Especialidad aportada (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  @ApiPropertyOptional({
    description: 'Rol de la asignación (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assignmentRoleConceptId?: string;

  @ApiPropertyOptional({ description: 'Puede validar resultados' })
  @IsOptional()
  @IsBoolean()
  mayValidateResults?: boolean;

  @ApiPropertyOptional({ description: 'Puede firmar informes' })
  @IsOptional()
  @IsBoolean()
  maySignReports?: boolean;

  @ApiPropertyOptional({
    description: 'Vigente desde',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  @ApiPropertyOptional({
    description: 'Vigente hasta',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;
}
