import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OwnSiteAddressDto } from './create-own-site.dto';
import { OpeningHoursField, OpeningHoursShiftDto } from './opening-hours.dto';

/**
 * Una sucursal de un laboratorio, declarada en el alta.
 *
 * Nace como una sede más de la unidad diagnóstica, con rol de punto de toma
 * de muestras, y además como fila de `directory.branches` —lo que lista la
 * pestaña Sucursales del portal—, que es donde viven la descripción y el
 * enlace de mapa (P54). Mismas reglas que `pharmacy.branches[]` (P51, D-4).
 */
export class DiagnosticUnitBranchDto {
  /** Nombre de la sucursal, tal como la va a ver el paciente. */
  @ApiProperty({ minLength: 2, maxLength: 200, example: 'Sucursal Equipetrol' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  /** Dirección de la sucursal. Opcional: se puede cargar más tarde. */
  @ApiPropertyOptional({ type: OwnSiteAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OwnSiteAddressDto)
  address?: OwnSiteAddressDto;

  /** Descripción libre de la sucursal (horario, referencia, servicios). */
  @ApiPropertyOptional({ maxLength: 1000, example: 'Frente al mercado' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /**
   * Enlace de mapa (Google Maps, OpenStreetMap…). Sólo `http`/`https`: la UI
   * ya rechaza `javascript:`, pero la UI no es una barrera.
   */
  @ApiPropertyOptional({
    maxLength: 2000,
    example: 'https://maps.google.com/?q=-17.78,-63.18',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(/^https?:\/\//i, { message: 'locationUrl debe ser http o https' })
  locationUrl?: string;

  /** Horario de atención de la sucursal: hasta dos turnos por día. */
  @OpeningHoursField()
  openingHours?: OpeningHoursShiftDto[];
}
