import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /community/bookmarks` (UC-19-04). */
export class CreateBookmarkDto {
  @ApiProperty({ description: 'Perfil que guarda', format: 'uuid' })
  @IsUUID()
  profileId!: string;

  @ApiProperty({
    description: 'Tipo de objeto',
    enum: ['POST', 'COMMENT', 'REVIEW'],
  })
  @IsIn(['POST', 'COMMENT', 'REVIEW'])
  bookmarkableType!: 'POST' | 'COMMENT' | 'REVIEW';

  @ApiProperty({ description: 'Id del objeto', format: 'uuid' })
  @IsUUID()
  bookmarkableRefId!: string;

  @ApiPropertyOptional({
    description: 'Colección a la que se añade',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  collectionName?: string;
}
