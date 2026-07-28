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
  /**
   * Identificador asociado a permission.
   */
  @ApiProperty({
    description: 'Permiso concedido/denegado excepcionalmente',
    format: 'uuid',
  })
  @IsUUID()
  permissionId!: string;

  /**
   * Valor de effect mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Efecto (deny individual prevalece sobre allow de rol)',
    enum: EFFECTS,
  })
  @IsIn(EFFECTS)
  effect!: Effect;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Justificación obligatoria', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  /**
   * Valor de scope mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Ámbito', enum: PERMISSION_SCOPES })
  @IsOptional()
  @IsIn(PERMISSION_SCOPES)
  scope?: PermissionScope;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant del grant', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de resource selector json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Selector de recursos (JSON)',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  resourceSelectorJson?: Record<string, unknown>;

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
    description: 'Fin de vigencia (acotado)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;
}
