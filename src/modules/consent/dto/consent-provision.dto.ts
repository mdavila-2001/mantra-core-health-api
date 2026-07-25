import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

/** Acción permitida/denegada por una provisión granular. */
export type ProvisionAction = 'PERMIT' | 'DENY';

/**
 * Provisión granular de un consentimiento: qué acción (permit/deny) sobre qué
 * clase de datos, para qué actor/rol y con qué etiqueta de seguridad.
 */
export class ConsentProvisionInputDto {
  @ApiProperty({ description: 'Acción de la provisión', enum: ['PERMIT', 'DENY'] })
  @IsIn(['PERMIT', 'DENY'])
  action!: ProvisionAction;

  @ApiPropertyOptional({ description: 'Clase de datos afectada (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  dataClassConceptId?: string;

  @ApiPropertyOptional({ description: 'Actor concreto autorizado/denegado (user id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiPropertyOptional({ description: 'Rol del actor (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  actorRoleConceptId?: string;

  @ApiPropertyOptional({ description: 'Propósito de uso (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purposeOfUseConceptId?: string;

  @ApiPropertyOptional({ description: 'Etiqueta de seguridad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  securityLabelConceptId?: string;

  @ApiPropertyOptional({ description: 'Inicio de vigencia (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Fin de vigencia (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;

  @ApiPropertyOptional({ description: 'Tipo de provisión (concept id); por defecto la base' })
  @IsOptional()
  @IsString()
  provisionTypeConceptId?: string;
}
