import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /profiles/practitioners/{profileId}/jurisdiction-authorizations` (UC-05-04). */
export class CreateJurisdictionAuthorizationDto {
  /**
   * Valor de license number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de licencia', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  licenseNumber!: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de jurisdicción',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Valor de regulatory authority mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Autoridad regulatoria emisora',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  regulatoryAuthority?: string;

  /**
   * Identificador asociado a practice scope concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del alcance de práctica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceScopeConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vigente desde (ISO date)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vigente hasta (ISO date)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  /**
   * El PDF o la foto del carnet de matrícula, ya subido por
   * `POST /common/files/upload`.
   *
   * Va como referencia y no como adjunto en este cuerpo: la subida tiene su
   * propio camino —con escaneo antivirus y deducción del tipo real a partir de
   * los bytes—, y repetirlo acá sería una segunda puerta con otras reglas.
   * Mismo campo, mismo destino y mismas reglas que `fileId` en
   * `AddOwnCredentialDto`: es el mismo gesto —declarar una credencial y
   * adjuntar lo que la prueba—.
   *
   * Opcional a propósito: el padrón se **declara**, no se prueba. Exigir el
   * escaneo dejaría fuera a quien todavía no lo tenga a mano y convertiría un
   * trámite de un minuto en uno de una tarde.
   */
  @ApiPropertyOptional({
    description:
      'Archivo de la matrícula (debe haberlo subido el mismo usuario)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}

/** Respuesta de autorización jurisdiccional. */
export class JurisdictionAuthorizationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  /**
   * Valor de license number mantenido por la instancia.
   */
  @ApiProperty()
  licenseNumber!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de la licencia',
    format: 'uuid',
  })
  state!: string;

  /**
   * El respaldo adjuntado, si se adjuntó uno. Se devuelve para que quien
   * acaba de cargarla pueda mostrarlo sin releer el perfil entero.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  fileId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
