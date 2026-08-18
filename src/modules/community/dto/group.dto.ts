import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /community/groups`. Bootstrap: crea un grupo/comunidad (padre de
 * UC-19-13).
 */
export class CreateGroupDto {
  /**
   * Valor de slug mantenido por la instancia.
   */
  @ApiProperty({ description: 'Slug único', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre del grupo', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /**
   * Valor de visibility mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Visibilidad',
    enum: ['PUBLIC', 'PRIVATE', 'SECRET'],
  })
  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE', 'SECRET'])
  visibility?: 'PUBLIC' | 'PRIVATE' | 'SECRET';

  /**
   * Valor de group type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de grupo',
    enum: ['GENERAL', 'SUPPORT'],
  })
  @IsOptional()
  @IsIn(['GENERAL', 'SUPPORT'])
  groupType?: 'GENERAL' | 'SUPPORT';

  /**
   * Tema por el que se clasifica el grupo (P7).
   *
   * Es un concepto de terminología —una fila de `community.topics`— y no texto
   * libre: el directorio filtra por tema, y un filtro sobre texto libre deja
   * fuera al que escribió "cardiologia" sin tilde.
   */
  @ApiPropertyOptional({ description: 'Tema del grupo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  topicId?: string;

  /**
   * Identificador asociado a owner profile.
   */
  @ApiPropertyOptional({ description: 'Perfil propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerProfileId?: string;
}

/** Cuerpo de `POST /community/groups/{groupId}/members` (UC-19-13). */
export class JoinGroupDto {
  /**
   * Identificador asociado a member profile.
   */
  @ApiProperty({ description: 'Perfil que se une', format: 'uuid' })
  @IsUUID()
  memberProfileId!: string;

  /**
   * Identificador asociado a invited by profile.
   */
  @ApiPropertyOptional({
    description: 'Perfil que invitó (grupos privados)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  invitedByProfileId?: string;
}
