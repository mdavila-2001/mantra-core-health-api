import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /role-assignments/{roleId}/support-assignments` (UC-14-09). */
export class CreateSupportAssignmentDto {
  @ApiProperty({
    description: 'Perfil de apoyo (profiles.secretary_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  supportProfileId!: string;

  @ApiPropertyOptional({
    description: 'Concepto de rol de apoyo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  supportRoleConceptId?: string;

  @ApiPropertyOptional({
    description: 'Concepto de alcance del apoyo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  scopeConceptId?: string;

  @ApiPropertyOptional({ description: 'Vigente desde (ISO date)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Vigente hasta (ISO date)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}
