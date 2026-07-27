import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsUUID } from 'class-validator';

/** Un ítem de permiso de un set delegado. */
export class PermissionSetItemDto {
  @ApiProperty({ description: 'Permiso referenciado en authz', format: 'uuid' })
  @IsUUID()
  permissionId!: string;

  @ApiPropertyOptional({
    description: 'Restricción declarativa (constraint) del permiso',
  })
  @IsOptional()
  @IsObject()
  constraintJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Requiere step-up (autenticación reforzada)',
  })
  @IsOptional()
  @IsBoolean()
  requiresStepUpAuthentication?: boolean;
}
