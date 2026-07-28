import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** Red de captura del ping (value_set cerrado). */
export type NetworkCode = 'CELLULAR' | 'WIFI';

/** Un ping de ubicación individual dentro del batch. */
export class LocationPingDto {
  /**
   * Valor de latitude mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Latitud en grados decimales',
    example: -12.0464,
  })
  @IsLatitude()
  latitude!: number;

  /**
   * Valor de longitude mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Longitud en grados decimales',
    example: -77.0428,
  })
  @IsLongitude()
  longitude!: number;

  /**
   * Valor de accuracy m mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Precisión horizontal (m)' })
  @IsOptional()
  @IsNumber()
  accuracyM?: number;

  /**
   * Valor de altitude m mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Altitud (m)' })
  @IsOptional()
  @IsNumber()
  altitudeM?: number;

  /**
   * Valor de speed mps mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Velocidad (m/s)' })
  @IsOptional()
  @IsNumber()
  speedMps?: number;

  /**
   * Valor de heading deg mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Rumbo (grados)' })
  @IsOptional()
  @IsNumber()
  headingDeg?: number;

  /**
   * Valor de battery pct mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Batería (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryPct?: number;

  /**
   * Valor de network mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Red de captura',
    enum: ['CELLULAR', 'WIFI'],
  })
  @IsOptional()
  @IsIn(['CELLULAR', 'WIFI'])
  network?: NetworkCode;

  /**
   * Identificador asociado a device.
   */
  @ApiPropertyOptional({
    description: 'Dispositivo que capturó el ping',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  /**
   * Valor de captured at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Instante de captura en el dispositivo',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  capturedAt?: Date;
}

/** Cuerpo de `POST /geo/tracked-subjects/{id}/pings` (UC-13-03, batch). */
export class IngestPingsDto {
  /**
   * Valor de pings mantenido por la instancia.
   */
  @ApiProperty({
    type: [LocationPingDto],
    description: 'Batch de pings de alta frecuencia',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => LocationPingDto)
  pings!: LocationPingDto[];
}

/** Resultado de la ingesta de pings. */
export class IngestPingsResultDto {
  /**
   * Valor de recorded mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de pings registrados' })
  recorded!: number;
}
