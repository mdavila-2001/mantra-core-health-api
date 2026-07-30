import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify` (UC-24-03). */
export class VerifyLicenseDto {
  /**
   * Valor de approve mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'true (por defecto) verifica; false rechaza la licencia',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  approve?: boolean;

  /**
   * Identificador asociado a evidence file.
   */
  @ApiPropertyOptional({
    description: 'Archivo de evidencia usado en la verificación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Motivo del rechazo (si aplica)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
