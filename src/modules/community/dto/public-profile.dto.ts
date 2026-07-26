import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Tipos de sujeto que un perfil público puede representar. */
export type ProfileTargetType = 'USER' | 'PRACTITIONER' | 'ORGANIZATION';

/**
 * Cuerpo de `POST /community/public-profiles`. Endpoint de bootstrap: proyecta un
 * usuario/paciente/organización (id de otro módulo, vía DTO) como perfil público,
 * nodo raíz al que apuntan las FK sociales del módulo.
 */
export class CreatePublicProfileDto {
  @ApiProperty({ description: 'Tenant propietario', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Id del sujeto proyectado (user/patient/org de otro módulo)', format: 'uuid' })
  @IsUUID()
  targetId!: string;

  @ApiPropertyOptional({ description: 'Tipo de sujeto', enum: ['USER', 'PRACTITIONER', 'ORGANIZATION'] })
  @IsOptional()
  @IsIn(['USER', 'PRACTITIONER', 'ORGANIZATION'])
  targetType?: ProfileTargetType;

  @ApiProperty({ description: 'Slug único legible', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug!: string;

  @ApiProperty({ description: 'Nombre visible', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  biography?: string;

  @ApiPropertyOptional({ description: 'Acepta reviews de servicio' })
  @IsOptional()
  @IsBoolean()
  acceptsReviews?: boolean;
}
