import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

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

  /** Lo otorga la plataforma; se muestra, no se declara. */
  @ApiProperty({ format: 'uuid', nullable: true })
  verificationStatusConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}
