import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OwnSiteAddressDto } from './create-own-site.dto';

/**
 * Cuerpo de `PATCH /practitioners/me/sites/:siteId` (P32-b).
 *
 * Los mismos campos del alta, todos opcionales: lo que no viaja no se toca.
 * Sin esta ruta, corregir un nombre mal tipeado o registrar una mudanza
 * obligaba a retirar el consultorio y crear otro — y eso cambia el `id`, que
 * es el que la agenda referencia en cada turno.
 *
 * **Sólo el consultorio propio.** Una sede de otra organización no se corrige
 * desde acá: es de ella, y lo que el profesional tiene con ella es una
 * vinculación, no la sede.
 *
 * No incluye teléfono: `common.contact_points` identifica a su dueño por
 * `owner_type_concept_id`, y el value set no declara ningún miembro para una
 * sede. Agregarlo es un cambio de modelo (nota de value set + `VS_OWNER` +
 * binding del generador), no un campo más en este DTO.
 */
export class UpdateOwnSiteDto {
  /** Nombre del consultorio, tal como lo va a ver el paciente. */
  @ApiPropertyOptional({
    description: 'Nombre del consultorio',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  /** Zona horaria IANA de la sede. */
  @ApiPropertyOptional({ example: 'America/La_Paz' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /**
   * Dirección nueva de la sede.
   *
   * Reemplaza a la vigente: la anterior no se borra —es donde el consultorio
   * estaba— sino que se le pone fin de vigencia, mismo criterio que una
   * mudanza en el domicilio de una persona.
   */
  @ApiPropertyOptional({ type: OwnSiteAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OwnSiteAddressDto)
  address?: OwnSiteAddressDto;
}

/**
 * Cuerpo de `PUT /practitioners/me/sites/:siteId/bank-qr` (P33).
 *
 * El archivo ya entró por `POST /common/files/upload`, así que lo único que
 * viaja acá es su identificador. Mezclarlo con el `PATCH` del consultorio
 * obligaría a mandar nombre y dirección para cambiar una imagen.
 */
export class SetSiteBankQrDto {
  /**
   * El archivo ya subido, o `null` para dejar la sede sin QR.
   *
   * `null` es un valor con significado —«sacá el que había»—, no un campo
   * ausente: por eso la propiedad es obligatoria y el `ValidateIf` sólo
   * exime al `null` del `@IsUUID`. Omitir la clave cae en el `@IsUUID` y
   * termina en 400, que es lo correcto: no se adivina si se quiso borrar.
   */
  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description: 'Archivo del QR ya subido, o null para quitarlo',
  })
  @ValidateIf((dto: SetSiteBankQrDto) => dto.fileId !== null)
  @IsUUID()
  fileId!: string | null;
}
