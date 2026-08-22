import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/**
 * Resultado de deshacer un vínculo social.
 *
 * ## Por qué `removed: false` y no un 404
 *
 * Dejar de seguir, quitar un marcador y desbloquear son **conmutadores**: la
 * pantalla los ofrece según lo que leyó hace un instante, y en ese instante el
 * vínculo puede haber dejado de existir —otra pestaña, otro dispositivo, un
 * bloqueo que ya podó el follow—. Un 404 obligaría a cada pantalla a tratar como
 * error lo que para el usuario es el estado que pedía. Lo que importa es el
 * estado final, y el estado final es el mismo: no hay vínculo.
 *
 * Se distingue igual con `removed`, porque quien llama puede querer saber si
 * hizo algo —para no anunciar «dejaste de seguir» cuando no seguía—.
 */
@ApiSchema({ name: 'CommunitySocialRemovalDto' })
export class SocialRemovalResponseDto {
  /** `true` si esta llamada deshizo el vínculo; `false` si ya no existía. */
  @ApiProperty({
    description: 'Si esta llamada deshizo el vínculo (falso si ya no existía)',
  })
  removed!: boolean;
}

/** Query de `DELETE /community/follows` (UC-19-05, cara inversa). */
@ApiSchema({ name: 'CommunityUnfollowQueryDto' })
export class UnfollowQueryDto {
  /**
   * Perfil que deja de seguir. Se comprueba que sea del actor.
   */
  @ApiProperty({ description: 'Perfil que deja de seguir', format: 'uuid' })
  @IsUUID()
  followerProfileId!: string;

  /**
   * Tipo del objeto que se deja de seguir.
   */
  @ApiProperty({
    description: 'Tipo de objeto seguido',
    enum: ['PROFILE', 'TOPIC', 'HASHTAG', 'GROUP'],
  })
  @IsIn(['PROFILE', 'TOPIC', 'HASHTAG', 'GROUP'])
  followableType!: 'PROFILE' | 'TOPIC' | 'HASHTAG' | 'GROUP';

  /**
   * Identificador del objeto que se deja de seguir.
   */
  @ApiProperty({ description: 'Id del objeto seguido', format: 'uuid' })
  @IsUUID()
  followableRefId!: string;
}

/** Query de `DELETE /community/bookmarks` (UC-19-04, cara inversa). */
@ApiSchema({ name: 'CommunityUnbookmarkQueryDto' })
export class UnbookmarkQueryDto {
  /**
   * Perfil dueño del marcador. Se comprueba que sea del actor.
   */
  @ApiProperty({ description: 'Perfil dueño del marcador', format: 'uuid' })
  @IsUUID()
  profileId!: string;

  /**
   * Tipo del objeto guardado.
   */
  @ApiProperty({
    description: 'Tipo de objeto',
    enum: ['POST', 'COMMENT', 'REVIEW'],
  })
  @IsIn(['POST', 'COMMENT', 'REVIEW'])
  bookmarkableType!: 'POST' | 'COMMENT' | 'REVIEW';

  /**
   * Identificador del objeto guardado.
   */
  @ApiProperty({ description: 'Id del objeto', format: 'uuid' })
  @IsUUID()
  bookmarkableRefId!: string;

  /**
   * Colección a la que acotar el borrado, si el marcador vive en una.
   */
  @ApiPropertyOptional({
    description: 'Colección a la que acotar el borrado',
  })
  @IsOptional()
  collectionName?: string;
}

/** Query de `DELETE /community/blocks` (UC-19-14, cara inversa). */
@ApiSchema({ name: 'CommunityUnblockQueryDto' })
export class UnblockQueryDto {
  /**
   * Perfil que levanta el bloqueo. Se comprueba que sea del actor.
   */
  @ApiProperty({ description: 'Perfil que bloqueó', format: 'uuid' })
  @IsUUID()
  blockerProfileId!: string;

  /**
   * Perfil que deja de estar bloqueado.
   */
  @ApiProperty({ description: 'Perfil bloqueado', format: 'uuid' })
  @IsUUID()
  blockedProfileId!: string;
}
