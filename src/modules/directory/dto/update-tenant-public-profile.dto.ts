import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Lo que se puede llenar de la vitrina pública de una organización.
 *
 * ## Por qué existe
 *
 * La verificación de un tenant proyecta su vitrina con **nombre y slug, nada
 * más**. Un profesional completa la suya por `PUT /community/profiles/me`, pero
 * ese endpoint resuelve el sujeto desde la sesión —perfil profesional o
 * cuenta— y el sujeto de una organización es el tenant, que ninguna sesión
 * «es». Resultado: la ficha pública de una clínica sólo podía existir vacía.
 *
 * ## La regla de los omitidos
 *
 * Campo ausente conserva lo que haya; cadena vacía lo borra. Es la misma regla
 * que la vitrina propia, y la que deja que una pantalla que sólo cambia la
 * portada no borre la presentación sin quererlo.
 */
export class UpdateTenantPublicProfileDto {
  /**
   * El nombre visible en el directorio.
   *
   * Se puede separar de la razón social: «Clínica del Sur» y no «CLINICA DEL
   * SUR S.R.L.», que es lo que dice el registro de comercio y nadie busca.
   */
  @ApiPropertyOptional({
    description: 'Nombre visible en el directorio público',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  /** Qué es este centro, en una línea. */
  @ApiPropertyOptional({
    description: 'Titular corto: qué es el centro en una línea',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  /** La presentación larga de la ficha. */
  @ApiPropertyOptional({ description: 'Presentación pública del centro' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  biography?: string;

  /** El logo, ya subido por `POST /files`. */
  @ApiPropertyOptional({
    description: 'Archivo del logo, ya subido',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  avatarFileId?: string;

  /**
   * La portada, ya subida.
   *
   * No es decoración: la tarjeta del directorio se mira antes de leerse, y sin
   * portada cuarenta centros de salud se ven exactamente iguales.
   */
  @ApiPropertyOptional({
    description: 'Archivo de la portada, ya subido',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  coverFileId?: string;
}
