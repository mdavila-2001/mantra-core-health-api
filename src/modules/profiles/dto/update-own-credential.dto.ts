import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/**
 * Cuerpo parcial de `PATCH /profiles/practitioners/me/credentials/:credentialId`.
 * La identidad del titular sale de la sesión; estados, propietario y campos de
 * verificación quedan fuera de la lista permitida.
 */
export class UpdateOwnCredentialDto {
  /** Tipo de credencial permitido por el catálogo profesional del módulo. */
  @ApiPropertyOptional({
    description: 'Concept id de tipo de credencial profesional',
    format: 'uuid',
  })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  credentialTypeConceptId?: string;

  /** Número o código declarado en el documento. */
  @ApiPropertyOptional({ maxLength: 100, pattern: '\\S' })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/, { message: 'number no puede estar vacío' })
  @MaxLength(100)
  number?: string;

  /** Institución emisora declarada. Un texto vacío permite borrarla. */
  @ApiPropertyOptional({ maxLength: 200 })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(200)
  issuingInstitutionText?: string;

  /** Ciudad de emisión. Un texto vacío permite borrarla. */
  @ApiPropertyOptional({ maxLength: 100 })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(100)
  issuingCityText?: string;

  /** País de emisión: un concepto de `VS_COUNTRY`. */
  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  issuingCountryConceptId?: string;

  /** Fecha de emisión en formato ISO 8601, como en el alta. */
  @ApiPropertyOptional({ format: 'date' })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsISO8601()
  issueDate?: string;

  /** Referencia a un documento previamente subido por el mismo titular. */
  @ApiPropertyOptional({
    description: 'Archivo del diploma (debe haberlo subido el mismo usuario)',
    format: 'uuid',
  })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  fileId?: string;
}
