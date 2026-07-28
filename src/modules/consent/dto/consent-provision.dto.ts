import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

/** Acción permitida/denegada por una provisión granular. */
export type ProvisionAction = 'PERMIT' | 'DENY';

/**
 * Provisión granular de un consentimiento: qué acción (permit/deny) sobre qué
 * clase de datos, para qué actor/rol y con qué etiqueta de seguridad.
 */
export class ConsentProvisionInputDto {
  /**
   * Valor de action mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Acción de la provisión',
    enum: ['PERMIT', 'DENY'],
  })
  @IsIn(['PERMIT', 'DENY'])
  action!: ProvisionAction;

  /**
   * Identificador asociado a data class concept.
   */
  @ApiPropertyOptional({
    description: 'Clase de datos afectada (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataClassConceptId?: string;

  /**
   * Identificador asociado a actor user.
   */
  @ApiPropertyOptional({
    description: 'Actor concreto autorizado/denegado (user id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  /**
   * Identificador asociado a actor role concept.
   */
  @ApiPropertyOptional({
    description: 'Rol del actor (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  actorRoleConceptId?: string;

  /**
   * Identificador asociado a purpose of use concept.
   */
  @ApiPropertyOptional({
    description: 'Propósito de uso (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  purposeOfUseConceptId?: string;

  /**
   * Identificador asociado a security label concept.
   */
  @ApiPropertyOptional({
    description: 'Etiqueta de seguridad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  securityLabelConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Inicio de vigencia (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fin de vigencia (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;

  /**
   * Identificador asociado a provision type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de provisión (concept id); por defecto la base',
  })
  @IsOptional()
  @IsString()
  provisionTypeConceptId?: string;
}
