import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsUUID } from 'class-validator';
import { ASSIGNMENT_SCOPES } from './create-org-user-assignment.dto';

const SCOPES = ASSIGNMENT_SCOPES;

/**
 * Cuerpo de `PATCH /org/user-assignments/{id}` (UC-29-10). Al menos uno de
 * `supervisorUserId`, `accessScope`, un objetivo (`practiceId`, `practiceSiteId`,
 * `clinicalUnitId`, `careSpaceId`) o `suspend` debe venir (validado en servicio).
 *
 * Cambiar el alcance es cambiar el objetivo: si viaja `accessScope` o algún
 * objetivo, los objetivos del cuerpo **reemplazan** a los de la asignación (los
 * que no vienen quedan en blanco) y el conjunto tiene que ser coherente con el
 * alcance resultante.
 */
export class UpdateOrgUserAssignmentDto {
  /**
   * Identificador asociado a supervisor user.
   */
  @ApiPropertyOptional({ description: 'Nuevo supervisor', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supervisorUserId?: string;

  /**
   * Valor de access scope mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nuevo alcance de acceso', enum: SCOPES })
  @IsOptional()
  @IsIn(SCOPES)
  accessScope?: (typeof SCOPES)[number];

  /** Nuevo objetivo: práctica (alcance PRACTICE). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /** Nuevo objetivo: sede (alcance SITE). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /** Nuevo objetivo: unidad clínica (alcance UNIT). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /** Nuevo objetivo: espacio (alcance SPACE). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  /**
   * Valor de suspend mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Suspender la asignación (cascada a delegaciones)',
  })
  @IsOptional()
  @IsBoolean()
  suspend?: boolean;

  /**
   * Valor de expected row version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'row_version esperado (concurrencia optimista)',
  })
  @IsOptional()
  @IsInt()
  expectedRowVersion?: number;
}
