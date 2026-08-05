import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /authz/users/{userId}/role-assignments` (UC-06-04). */
@ApiSchema({ name: 'AuthzCreateRoleAssignmentDto' })
export class CreateRoleAssignmentDto {
  /**
   * Identificador asociado a role.
   */
  @ApiProperty({
    description: 'Rol a asignar (debe ser asignable)',
    format: 'uuid',
  })
  @IsUUID()
  roleId!: string;

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
