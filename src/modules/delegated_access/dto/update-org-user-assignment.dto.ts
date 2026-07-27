import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsUUID } from 'class-validator';

const SCOPES = ['TENANT', 'PRACTICE', 'SITE', 'UNIT'] as const;

/**
 * Cuerpo de `PATCH /org/user-assignments/{id}` (UC-29-10). Al menos uno de
 * `supervisorUserId`, `accessScope` o `suspend` debe venir (validado en servicio).
 */
export class UpdateOrgUserAssignmentDto {
  @ApiPropertyOptional({ description: 'Nuevo supervisor', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supervisorUserId?: string;

  @ApiPropertyOptional({ description: 'Nuevo alcance de acceso', enum: SCOPES })
  @IsOptional()
  @IsIn(SCOPES)
  accessScope?: (typeof SCOPES)[number];

  @ApiPropertyOptional({
    description: 'Suspender la asignación (cascada a delegaciones)',
  })
  @IsOptional()
  @IsBoolean()
  suspend?: boolean;

  @ApiPropertyOptional({
    description: 'row_version esperado (concurrencia optimista)',
  })
  @IsOptional()
  @IsInt()
  expectedRowVersion?: number;
}
