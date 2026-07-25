import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /authz/users/{userId}/role-assignments` (UC-06-04). */
export class CreateRoleAssignmentDto {
  @ApiProperty({ description: 'Rol a asignar (debe ser asignable)', format: 'uuid' })
  @IsUUID()
  roleId!: string;

  @ApiPropertyOptional({ description: 'Tenant del ámbito', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Sede/branch del ámbito', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Consultorio/practice del ámbito', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  @ApiPropertyOptional({ description: 'Inicio de vigencia', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Fin de vigencia', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;
}
