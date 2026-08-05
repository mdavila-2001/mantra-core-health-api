import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /diagnostic-units/{id}/practitioner-assignments` (UC-23-10). */
export class CreatePractitionerAssignmentDto {
  /**
   * Identificador asociado a practitioner role assignment.
   */
  @ApiProperty({
    description: 'Asignación de rol del profesional (RRHH)',
    format: 'uuid',
  })
  @IsUUID()
  practitionerRoleAssignmentId!: string;

  /**
   * Identificador asociado a diagnostic unit site.
   */
  @ApiPropertyOptional({ description: 'Sitio de la unidad', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  diagnosticUnitSiteId?: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @ApiPropertyOptional({
    description: 'Especialidad aportada (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Identificador asociado a assignment role concept.
   */
  @ApiPropertyOptional({
    description: 'Rol de la asignación (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assignmentRoleConceptId?: string;

  /**
   * Valor de may validate results mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Puede validar resultados' })
  @IsOptional()
  @IsBoolean()
  mayValidateResults?: boolean;

  /**
   * Valor de may sign reports mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Puede firmar informes' })
  @IsOptional()
  @IsBoolean()
  maySignReports?: boolean;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vigente desde',
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
    description: 'Vigente hasta',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;
}
