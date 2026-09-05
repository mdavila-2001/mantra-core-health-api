import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /profiles/practitioners/me/credentials`.
 *
 * El registro de procesos (MÓDULO MÉDICO §1.15 a §1.20) pide poder cargar
 * **varios** títulos de cada clase —«espacio para poder subir varios
 * diplomados»—, y hasta ahora el alta creaba exactamente uno y no había forma
 * de agregar otro después. Cada llamada agrega una fila; el tipo distingue
 * universitario, diplomado, maestría, doctorado y título de especialidad.
 *
 * El sujeto sale de la sesión: no se recibe `profileId`, así que no hay forma
 * de escribir la formación de otro profesional.
 */
export class AddOwnCredentialDto {
  /**
   * Qué acredita el documento. Uno de los cinco de la enumeración
   * `professional-credential-type`; cualquier otro concepto se rechaza.
   */
  @ApiProperty({
    description:
      'Concept id del tipo de credencial (título universitario, diplomado, maestría, doctorado o título de especialidad)',
    format: 'uuid',
  })
  @IsUUID()
  credentialTypeConceptId!: string;

  /**
   * Número o código del diploma. **Obligatorio**: la columna es `NOT NULL` en
   * el modelo, así que aceptar el alta sin él sólo cambiaría un aviso claro
   * del formulario por un error 500 al escribir.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  number!: string;

  /**
   * Dónde se cursó. Texto libre a propósito: las universidades del exterior no
   * están en ningún catálogo nuestro, y exigir que lo estén dejaría fuera a
   * cualquiera que se formó afuera.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  issuingInstitutionText?: string;

  /** Fecha de emisión del título. */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  issueDate?: string;

  /**
   * El PDF o la foto del diploma, ya subido por `POST /common/files/upload`.
   *
   * Va como referencia y no como adjunto en este cuerpo: la subida tiene su
   * propio camino —con escaneo antivirus y deducción del tipo real a partir de
   * los bytes—, y repetirlo acá sería una segunda puerta con otras reglas.
   */
  @ApiPropertyOptional({
    description: 'Archivo del diploma (debe haberlo subido el mismo usuario)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}

/** Una credencial académica tal como la ve su dueño. */
export class OwnCredentialResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  credentialTypeConceptId!: string;

  @ApiPropertyOptional()
  number?: string;

  @ApiPropertyOptional()
  issuingInstitutionText?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  issueDate?: Date;

  /** `CRED_PENDING` recién creada: declararla no es haberla verificado. */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  fileId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
