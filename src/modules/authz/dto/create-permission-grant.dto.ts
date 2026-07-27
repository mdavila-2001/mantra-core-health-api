import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EFFECTS, type Effect } from './create-access-policy.dto';
import {
  PERMISSION_SCOPES,
  type PermissionScope,
} from './create-permission.dto';

/** Cuerpo de `POST /authz/users/{userId}/permission-grants` (UC-06-05). */
export class CreatePermissionGrantDto {
  @ApiProperty({
    description: 'Permiso concedido/denegado excepcionalmente',
    format: 'uuid',
  })
  @IsUUID()
  permissionId!: string;

  @ApiProperty({
    description: 'Efecto (deny individual prevalece sobre allow de rol)',
    enum: EFFECTS,
  })
  @IsIn(EFFECTS)
  effect!: Effect;

  @ApiProperty({ description: 'Justificación obligatoria', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({ description: 'Ámbito', enum: PERMISSION_SCOPES })
  @IsOptional()
  @IsIn(PERMISSION_SCOPES)
  scope?: PermissionScope;

  @ApiPropertyOptional({ description: 'Tenant del grant', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Selector de recursos (JSON)',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  resourceSelectorJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Inicio de vigencia',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  @ApiPropertyOptional({
    description: 'Fin de vigencia (acotado)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;
}
