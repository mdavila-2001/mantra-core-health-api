import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** Visibilidad declarable de una vitrina pública. */
export type ProfileVisibility = 'PUBLIC' | 'PRIVATE';

/**
 * Cuerpo de `PUT /community/profiles/me` — la vitrina pública propia.
 *
 * ## Por qué hacía falta
 *
 * El módulo tenía `POST /community/public-profiles`, que exige `SECURITY_ADMIN`
 * y es de **bootstrap**: proyecta a alguien como nodo del grafo social. Con eso
 * solo, un profesional no podía crear su propia vitrina ni corregirla después —
 * ni siquiera podía encontrarla, porque la lectura es por id de perfil y ese id
 * nadie lo conoce de antemano.
 *
 * Este contrato es el otro: **el titular administra lo suyo**. Es un `PUT`
 * idempotente que crea la vitrina si no existe y la actualiza si existe, así que
 * la pantalla que la edita no tiene que saber cuál de las dos cosas está
 * haciendo ni encadenar dos peticiones para averiguarlo.
 *
 * ## Qué no se puede tocar
 *
 * El estado de verificación, los sellos y el prestigio. Los otorga la
 * plataforma; si se pudieran declarar, un sello verificado no significaría nada.
 */
export class UpsertOwnPublicProfileDto {
  /**
   * La organización bajo la que se publica.
   *
   * Obligatoria en el alta: una vitrina pertenece a una organización concreta,
   * igual que el resto del contenido del módulo. Al actualizar se ignora — no se
   * cambia de organización editando un campo de texto.
   */
  @ApiProperty({ description: 'Organización propietaria', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * La dirección legible del perfil.
   *
   * Sólo minúsculas, números y guiones: es lo que va a terminar en una URL, y
   * aceptar espacios o acentos produce enlaces que se rompen al copiarlos en un
   * correo.
   */
  @ApiProperty({ description: 'Slug único legible', maxLength: 120 })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'El slug sólo admite minúsculas, números y guiones, sin guiones al principio ni al final.',
  })
  slug!: string;

  @ApiProperty({ description: 'Nombre visible', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  /** La línea de debajo del nombre: «Cardióloga · Hospital del Norte». */
  @ApiPropertyOptional({ description: 'Titular de una línea', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @ApiPropertyOptional({ description: 'Presentación pública', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  biography?: string;

  /** Si admite reseñas de servicio de las personas que atendió. */
  @ApiPropertyOptional({ description: 'Acepta reseñas' })
  @IsOptional()
  @IsBoolean()
  acceptsReviews?: boolean;

  /**
   * Si la vitrina se lista en el directorio público.
   *
   * ## Por qué es el titular quien lo declara, y por qué omitirlo no publica
   *
   * Antes de este campo **nada en el producto escribía
   * `public_profiles.visibility_concept_id`**: ni este `PUT` ni el bootstrap de
   * `POST /community/public-profiles`. La columna existía, el mapa
   * `PROFILE_VISIBILITY_CONCEPT_BY_CODE` existía, y no había una sola ruta que
   * los uniera — así que toda vitrina nacía con la columna nula y el directorio
   * público, que exige `visibility = PROFILE_VISIBILITY_PUBLIC`, estaba vacío
   * por construcción. No era un directorio sin datos: era un directorio al que
   * no se podía entrar.
   *
   * Omitirlo **no cambia** la visibilidad que ya tenga la vitrina, y en el alta
   * la deja nula, que se lee como privada. Publicarse en internet a través de
   * todos los tenants es opt-in explícito, y un `PUT` idempotente que omite un
   * campo no puede significar «publicame».
   */
  @ApiPropertyOptional({
    description: 'Listar la vitrina en el directorio público',
    enum: ['PUBLIC', 'PRIVATE'],
  })
  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE'])
  visibility?: ProfileVisibility;

  /**
   * El archivo de la foto de perfil, ya subido por `POST /common/files/upload`.
   *
   * Se recibe el **id del archivo** y no los bytes: la vitrina es un `PUT` de
   * JSON idempotente, y meterle un `multipart` la obligaría a hablar dos
   * idiomas y a reenviar la foto entera cada vez que alguien corrige su
   * biografía. Subir y adjuntar son dos gestos distintos, y así se quedan.
   *
   * **Omitirlo conserva la que haya**, igual que `visibility`: una pantalla que
   * edita el titular no le borra la foto a nadie. Para quitarla se manda `null`
   * explícito.
   *
   * Hasta ahora este campo no existía en ninguna de las dos escrituras, así que
   * la foto podía subirse pero no colgarse de la vitrina — es el pendiente P17
   * de `PENDIENTES-BACKEND.md`.
   */
  @ApiPropertyOptional({
    description: 'Archivo de la foto de perfil, ya subido',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, valor) => valor !== null)
  @IsUUID()
  avatarFileId?: string | null;
}

/**
 * La vitrina propia como la ve su titular.
 *
 * Más angosta que `PublicProfileDetailDto`: no trae sellos ni prestigio, que son
 * de la ficha pública. Acá lo que importa es **qué se puede editar** y en qué
 * estado quedó, y mezclar las dos cosas invita a que la pantalla de edición
 * empiece a mostrar datos que no edita.
 */
export class OwnPublicProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /** El sujeto que representa: el perfil profesional, o la cuenta. */
  @ApiProperty({ format: 'uuid' })
  targetId!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ nullable: true })
  headline!: string | null;

  @ApiProperty({ nullable: true })
  biography!: string | null;

  @ApiProperty({ nullable: true })
  acceptsReviews!: boolean | null;

  /**
   * Si la vitrina está listada en el directorio público.
   *
   * Se devuelve como el código y no como el concept id: es la única forma de
   * que la pantalla de edición muestre el interruptor en la posición correcta
   * sin tener que resolver un uuid contra el catálogo de conceptos. `PRIVATE`
   * cubre también la columna nula — las vitrinas anteriores a este campo.
   */
  @ApiProperty({ enum: ['PUBLIC', 'PRIVATE'] })
  visibility!: ProfileVisibility;

  /** Lo otorga la plataforma; se muestra, no se declara. */
  @ApiProperty({ format: 'uuid', nullable: true })
  verificationStatusConceptId!: string | null;

  /**
   * La foto de la vitrina, o `null` si todavía no subió ninguna.
   *
   * Viaja porque es una de las tres condiciones que hacen a un perfil
   * "completo" para presentar un grupo público (TP-3, regla 06), y sin ella la
   * pantalla no puede anticipar el rechazo: tendría que dejar que la persona
   * llene el formulario entero para enterarse recién al enviar.
   */
  @ApiProperty({ format: 'uuid', nullable: true })
  avatarFileId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}
