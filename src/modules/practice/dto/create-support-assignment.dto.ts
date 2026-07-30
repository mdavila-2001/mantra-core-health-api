import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /role-assignments/{roleId}/support-assignments` (UC-14-09). */
export class CreateSupportAssignmentDto {
  /**
   * Identificador asociado a support profile.
   */
  @ApiProperty({
    description: 'Perfil de apoyo (profiles.secretary_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  supportProfileId!: string;

  /**
   * Identificador asociado a support role concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de rol de apoyo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  supportRoleConceptId?: string;

  /**
   * Identificador asociado a scope concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de alcance del apoyo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  scopeConceptId?: string;

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
