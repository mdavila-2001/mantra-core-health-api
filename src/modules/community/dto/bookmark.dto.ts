import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /community/bookmarks` (UC-19-04). */
export class CreateBookmarkDto {
  /**
   * Identificador asociado a profile.
   */
  @ApiProperty({ description: 'Perfil que guarda', format: 'uuid' })
  @IsUUID()
  profileId!: string;

  /**
   * Valor de bookmarkable type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de objeto',
    enum: ['POST', 'COMMENT', 'REVIEW'],
  })
  @IsIn(['POST', 'COMMENT', 'REVIEW'])
  bookmarkableType!: 'POST' | 'COMMENT' | 'REVIEW';

  /**
   * Identificador asociado a bookmarkable ref.
   */
  @ApiProperty({ description: 'Id del objeto', format: 'uuid' })
  @IsUUID()
  bookmarkableRefId!: string;

  /**
   * Valor de collection name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Colección a la que se añade',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  collectionName?: string;
}
