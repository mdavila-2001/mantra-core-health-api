import { ApiProperty } from '@nestjs/swagger';
import { PublicPageDto, type PublicResultKind } from './public-search.dto';

/**
 * Las lecturas sociales de la superficie pública (TAREA 01 §5.1): quién
 * reaccionó a una publicación y qué se comentó en ella, sin sesión.
 *
 * ## Por qué estas clases repiten la proyección del feed en vez de reusar la interna
 *
 * `CommentThreadItemDto` y `ReactionSummaryDto` (`read-social.dto.ts`) sirven la
 * cara **con sesión** y publican `authorProfileId`, `actorProfileId`,
 * `reactionTypeConceptId` y `statusConceptId`. Todos ésos son identificadores
 * internos, y la regla de esta superficie —la misma que documenta
 * `public-search.dto.ts`— es que ninguno cruza a un anónimo. Reusar aquellas
 * clases acá habría publicado los cinco de una sola vez.
 *
 * Lo que sí se reusa es la **proyección del autor**: los mismos cinco campos que
 * `PublicFeedPostDto` sirve para el autor de una publicación (`authorSlug`,
 * `authorDisplayName`, `authorHeadline`, `authorAvatarUrl`, `authorKind`), ni uno
 * más. Quien reacciona y quien comenta se ven exactamente como quien publica.
 *
 * ## Nadie que no sea público aparece
 *
 * TAREA 01 §5.3: la lista de quién reaccionó dice que alguien interactuó con el
 * contenido de un especialista, y esto es una red social **médica**. Un perfil
 * que no está publicado y activo no sale en la lista, ni siquiera anonimizado:
 * el `JOIN` con `community.public_profiles` lo deja fuera en la consulta, que es
 * donde no se puede olvidar. Un comentario cuyo autor se despublica sale del
 * hilo con él, igual que las publicaciones salen del feed (`listFeedPublico`).
 */
export class PublicSocialActorDto {
  @ApiProperty({ description: 'Slug estable; el que va en /p/:slug' })
  slug!: string;

  @ApiProperty({ description: 'Nombre visible' })
  displayName!: string;

  @ApiProperty({ nullable: true, description: 'Titular corto' })
  headline!: string | null;

  @ApiProperty({
    nullable: true,
    description: 'URL absoluta del avatar, o null',
  })
  avatarUrl!: string | null;

  @ApiProperty({
    description: 'Vertical del perfil, para el prefijo de su ficha',
  })
  kind!: PublicResultKind;
}

/**
 * Una persona que reaccionó a una publicación.
 *
 * `reactionType` viaja como **código** (`LIKE`, `LOVE`, `INSIGHTFUL`,
 * `CELEBRATE`, `SUPPORT`) y nunca como `reaction_type_concept_id`: el uuid del
 * concepto es un identificador interno, y el código es lo único que la pantalla
 * necesita para agrupar la lista por tipo. `null` cuando la fila guarda un
 * concepto que el módulo todavía no nombra — es el mismo criterio que
 * `ReactionSummaryDto` aplica en la cara con sesión.
 *
 * **No lleva la fecha de la reacción.** Ordena la página y por eso está en el
 * cursor, que es opaco; publicarla además diría *cuándo* alguien miró qué, y
 * eso no lo necesita ninguna de las pantallas de AC-01-9.
 */
export class PublicPostReactionDto extends PublicSocialActorDto {
  @ApiProperty({
    nullable: true,
    enum: ['LIKE', 'LOVE', 'INSIGHTFUL', 'CELEBRATE', 'SUPPORT'],
    description: 'Qué reacción dejó, por su código; nunca el uuid del concepto',
  })
  reactionType!: string | null;
}

/**
 * Un comentario del hilo público, con su autor adentro.
 *
 * `id` sale porque es lo que `GET /public/comments/:commentId/replies` pide para
 * abrir las respuestas (AC-01-12), y porque es el único identificador de esta
 * superficie que no referencia a una persona.
 */
/**
 * Un adjunto de comentario público (REQ-01-011).
 *
 * Mismo criterio que `PublicSocialActorDto.avatarUrl`: se sirve la **URL**
 * servida por la propia API (`/public/media/:fileId`), nunca el `fileId` ni
 * el `mediaRoleConceptId` internos — un uuid de `common.files` regalado a un
 * anónimo es un dato que no se puede volver a esconder.
 */
export class PublicCommentMediaDto {
  @ApiProperty({ description: 'URL servida por la API, no el fileId interno' })
  url!: string;

  @ApiProperty({
    description: 'Qué tipo de adjunto es',
    enum: ['IMAGE', 'STICKER', 'GIF'],
  })
  kind!: 'IMAGE' | 'STICKER' | 'GIF';

  @ApiProperty({
    nullable: true,
    description: 'Texto alternativo, si lo tiene',
  })
  altText!: string | null;
}

export class PublicCommentDto {
  @ApiProperty({ description: 'Identificador del comentario' })
  id!: string;

  @ApiProperty({ description: 'Texto del comentario' })
  bodyText!: string;

  @ApiProperty({ description: 'Instante ISO-8601 en UTC' })
  createdAt!: string;

  @ApiProperty({
    description: 'Cuántas respuestas cuelgan de él; 0, nunca null',
  })
  replyCount!: number;

  @ApiProperty({
    type: PublicSocialActorDto,
    description:
      'Quién lo escribió, con la misma proyección que el autor del feed',
  })
  author!: PublicSocialActorDto;

  @ApiProperty({
    type: [PublicCommentMediaDto],
    description: 'Imágenes, stickers y GIFs adjuntos (REQ-01-011)',
  })
  media!: PublicCommentMediaDto[];
}

/** Página de «quién reaccionó» (AC-01-9). */
export class PublicPostReactionPageDto extends PublicPageDto<PublicPostReactionDto> {}

/** Página de comentarios: raíces de una publicación o respuestas de un comentario. */
export class PublicCommentPageDto extends PublicPageDto<PublicCommentDto> {}
