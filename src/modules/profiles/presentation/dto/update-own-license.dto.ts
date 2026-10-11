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
 * Cuerpo parcial de
 * `PATCH /profiles/practitioners/me/jurisdiction-authorizations/:licenseId`.
 *
 * Sólo lo que el titular declara. El estado, la jurisdicción y el vencimiento
 * los mueve el trámite de verificación, y quedan fuera de la lista blanca.
 */
export class UpdateOwnLicenseDto {
  /** Número de matrícula tal como figura en el carnet. */
  @ApiPropertyOptional({ maxLength: 100, pattern: '\\S' })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/, { message: 'licenseNumber no puede estar vacío' })
  @MaxLength(100)
  licenseNumber?: string;

  /** Autoridad que la emitió. */
  @ApiPropertyOptional({ maxLength: 200 })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(200)
  regulatoryAuthority?: string;

  /** Vigente desde (ISO 8601). */
  @ApiPropertyOptional({ format: 'date' })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsISO8601()
  validFrom?: string;

  /** PDF o foto del carnet, ya subido por el mismo titular. */
  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  fileId?: string;
}
