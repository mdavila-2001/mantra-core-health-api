import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /authz/users/{userId}/role-assignments` (UC-06-04). */
@ApiSchema({ name: 'AuthzCreateRoleAssignmentDto' })
export class CreateRoleAssignmentDto {
  /**
   * Identificador asociado a role.
   *
   * Alternativa a `roleCode`: hay que indicar uno de los dos.
   */
  @ApiPropertyOptional({
    description: 'Rol a asignar por id (debe ser asignable)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  /**
   * Código del rol a asignar.
   *
   * Existe porque quien asigna conoce el rol por su código —el mismo que exige
   * `@Roles('SURGEON')`— y no por su uuid. Exigir sólo el id obligaba a resolver
   * antes la fila del rol, que es un paso previo que no aporta ninguna decisión.
   */
  @ApiPropertyOptional({
    description: 'Rol a asignar por código (p. ej. `SURGEON`)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  roleCode?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant del ámbito', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a branch.
   */
  @ApiPropertyOptional({
    description: 'Sede/branch del ámbito',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({
    description: 'Consultorio/practice del ámbito',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia',
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
    description: 'Fin de vigencia',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;
}
