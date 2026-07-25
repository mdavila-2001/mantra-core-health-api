import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { EFFECTS, type Effect } from './create-access-policy.dto';
import { PERMISSION_SCOPES, type PermissionScope } from './create-permission.dto';

/** Un binding permiso→efecto dentro del rol. */
export class RolePermissionItemDto {
  @ApiProperty({ description: 'Id del permiso', format: 'uuid' })
  @IsUUID()
  permissionId!: string;

  @ApiProperty({ description: 'Efecto (deny prevalece)', enum: EFFECTS })
  @IsIn(EFFECTS)
  effect!: Effect;

  @ApiPropertyOptional({ description: 'Ámbito', enum: PERMISSION_SCOPES })
  @IsOptional()
  @IsIn(PERMISSION_SCOPES)
  scope?: PermissionScope;

  @ApiPropertyOptional({ description: 'Restricción ABAC (JSON)', type: Object })
  @IsOptional()
  @IsObject()
  constraintJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Value set de campos permitidos', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fieldValueSetId?: string;
}

/** Cuerpo de `PUT /authz/roles/{roleId}/permissions` (UC-06-03). */
export class SetRolePermissionsDto {
  @ApiProperty({ description: 'Bindings permiso→efecto a aplicar (reemplaza los activos)', type: [RolePermissionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RolePermissionItemDto)
  permissions!: RolePermissionItemDto[];
}
