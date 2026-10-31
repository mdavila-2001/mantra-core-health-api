import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CLIENT_ERROR_CLASSES, type ClientErrorClass } from '../../telemetry.concepts';

const SCREEN_SIZES = ['movil', 'tableta', 'escritorio'] as const;

/** Un error del cliente. Todo texto se vuelve a sanear en el servidor. */
export class ClientErrorItemDto {
  @ApiProperty({ enum: CLIENT_ERROR_CLASSES })
  @IsIn(CLIENT_ERROR_CLASSES)
  errorClass!: ClientErrorClass;

  @ApiProperty({ maxLength: 120, example: 'TypeError' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  errorType!: string;

  @ApiPropertyOptional({ maxLength: 500, description: 'Sin stack ni cuerpo; se redacta de nuevo en el servidor.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({ maxLength: 300, description: 'Plantilla de ruta sin ids (misma lista cerrada que la ruta anónima).' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  routeTemplate?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @ApiPropertyOptional({ enum: ['WEB', 'MOBILE'], default: 'WEB' })
  @IsOptional()
  @IsIn(['WEB', 'MOBILE'])
  portal?: 'WEB' | 'MOBILE';

  @ApiPropertyOptional({ maxLength: 8 })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  httpMethod?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  apiRouteTemplate?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 599 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(599)
  httpStatus?: number;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  apiErrorCode?: string;

  @ApiPropertyOptional({ maxLength: 80, description: 'X-Request-Id de la respuesta; enlaza con observability.error_events.' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  requestId?: string;

  @ApiPropertyOptional({ maxLength: 40, description: 'Código dictable E-… que ve la persona.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  supportCode?: string;

  @ApiProperty({ maxLength: 40 })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  appVersion!: string;

  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  buildId?: string;

  @ApiPropertyOptional({ enum: SCREEN_SIZES })
  @IsOptional()
  @IsIn(SCREEN_SIZES)
  screenSize?: (typeof SCREEN_SIZES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 100000, description: 'Repeticiones suprimidas en el cliente.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  suppressedCount?: number;

  @ApiPropertyOptional({ description: 'Se ignora: la huella la calcula el servidor.' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  fingerprint?: string;
}

/** Lote: 1 a 50 errores. */
export class CaptureClientErrorsDto {
  @ApiProperty({ type: () => [ClientErrorItemDto], minItems: 1, maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ClientErrorItemDto)
  errors!: ClientErrorItemDto[];
}

export class ClientErrorsResponseDto {
  @ApiProperty() inserted!: number;
  @ApiProperty({ description: 'Descartados por no traer versión de app reconocible.' }) rejected!: number;
}
