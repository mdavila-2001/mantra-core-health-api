import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsUUID } from 'class-validator';

/** Un ítem de permiso de un set delegado. */
export class PermissionSetItemDto {
  /**
   * Identificador asociado a permission.
   */
  @ApiProperty({ description: 'Permiso referenciado en authz', format: 'uuid' })
  @IsUUID()
  permissionId!: string;

  /**
   * Valor de constraint json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Restricción declarativa (constraint) del permiso',
  })
  @IsOptional()
  @IsObject()
  constraintJson?: Record<string, unknown>;

  /**
   * Valor de requires step up authentication mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Requiere step-up (autenticación reforzada)',
  })
  @IsOptional()
  @IsBoolean()
  requiresStepUpAuthentication?: boolean;
}
