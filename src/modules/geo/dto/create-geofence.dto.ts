import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Formas soportadas de geofence. */
export type ShapeTypeCode = 'CIRCLE' | 'POLYGON';

/**
 * Cuerpo de `POST /geo/geofences` (UC-13-04). La coherencia forma/geometría
 * (circle => radio+centro; polygon => geometry_json) se valida en el servicio y
 * responde 422 si falta.
 */
export class CreateGeofenceDto {
  @ApiProperty({ description: 'Tenant propietario (RLS)', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Nombre único del geofence dentro del tenant',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Forma del geofence',
    enum: ['CIRCLE', 'POLYGON'],
  })
  @IsIn(['CIRCLE', 'POLYGON'])
  shapeType!: ShapeTypeCode;

  @ApiPropertyOptional({
    description: 'Radio en metros (obligatorio si CIRCLE)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  radiusM?: number;

  @ApiPropertyOptional({
    description: 'Latitud del centro (obligatorio si CIRCLE)',
  })
  @IsOptional()
  @IsLatitude()
  centerLat?: number;

  @ApiPropertyOptional({
    description: 'Longitud del centro (obligatorio si CIRCLE)',
  })
  @IsOptional()
  @IsLongitude()
  centerLng?: number;

  @ApiPropertyOptional({
    description: 'GeoJSON del polígono (obligatorio si POLYGON)',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  geometryJson?: Record<string, unknown>;
}
