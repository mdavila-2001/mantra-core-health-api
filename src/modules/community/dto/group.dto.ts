import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * Cuerpo de `POST /community/groups`. Bootstrap: crea un grupo/comunidad (padre de
 * UC-19-13).
 */
export class CreateGroupDto {
  @ApiProperty({ description: 'Slug único', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug!: string;

  @ApiProperty({ description: 'Nombre del grupo', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Visibilidad', enum: ['PUBLIC', 'PRIVATE', 'SECRET'] })
  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE', 'SECRET'])
  visibility?: 'PUBLIC' | 'PRIVATE' | 'SECRET';

  @ApiPropertyOptional({ description: 'Tipo de grupo', enum: ['GENERAL', 'SUPPORT'] })
  @IsOptional()
  @IsIn(['GENERAL', 'SUPPORT'])
  groupType?: 'GENERAL' | 'SUPPORT';

  @ApiPropertyOptional({ description: 'Perfil propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerProfileId?: string;
}

/** Cuerpo de `POST /community/groups/{groupId}/members` (UC-19-13). */
export class JoinGroupDto {
  @ApiProperty({ description: 'Perfil que se une', format: 'uuid' })
  @IsUUID()
  memberProfileId!: string;

  @ApiPropertyOptional({ description: 'Perfil que invitó (grupos privados)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  invitedByProfileId?: string;
}
