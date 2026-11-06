import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  OpeningHoursField,
  OpeningHoursShiftDto,
} from '../../../../common/dto/opening-hours.dto';

/** Una sucursal declarada en el alta de una farmacia. */
export class RegisterPharmacyBranchDto {
  @ApiProperty({ description: 'Nombre de la sucursal', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name!: string;

  @ApiPropertyOptional({
    description: 'Latitud; va junto con longitude o no va',
    example: -17.769,
  })
  @ValidateIf(
    (dto: RegisterPharmacyBranchDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud; va junto con latitude o no va',
    example: -63.196,
  })
  @ValidateIf(
    (dto: RegisterPharmacyBranchDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Descripción', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Enlace de ubicación (http/https)',
    maxLength: 2000,
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

/**
 * Bloque propio de la farmacia en el alta pública (P50).
 *
 * La casa central nace siempre —es la sede de la que cuelga la farmacia y la
 * que queda enlazada en `pharmacies.primary_practice_site_id`—; `address` y el
 * punto son opcionales para registrarse y **el punto es obligatorio para
 * operar**: la plataforma no verifica una farmacia sin él.
 */
export class RegisterPharmacyBlockDto {
  @ApiPropertyOptional({
    description: 'Dirección escrita de la casa central (dirección legal)',
    maxLength: 500,
    example: 'Av. Cristo Redentor 1234, Santa Cruz de la Sierra',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'Latitud de la casa central; va junto con longitude o no va',
  })
  @ValidateIf(
    (dto: RegisterPharmacyBlockDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud de la casa central; va junto con latitude o no va',
  })
  @ValidateIf(
    (dto: RegisterPharmacyBlockDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ type: [RegisterPharmacyBranchDto], maxItems: 50 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => RegisterPharmacyBranchDto)
  branches?: RegisterPharmacyBranchDto[];
}
