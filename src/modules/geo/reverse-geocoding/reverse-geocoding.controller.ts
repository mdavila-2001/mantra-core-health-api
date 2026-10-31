import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsNumber, Max, Min } from 'class-validator';

import { NotAudited, Public } from '../../../common';
import { ReverseGeocodingService } from './reverse-geocoding.service';

/**
 * El punto, en el cuerpo y no en la URL: es el domicilio de alguien.
 *
 * Cualquier punto del planeta. Antes sólo se aceptaba el recuadro de Bolivia y
 * un pin fuera de él —la persona que se registra desde el exterior, o el GPS
 * de quien prueba desde otro país— recibía un 400 que el alta leía como «no
 * pudimos traer la calle». El abuso lo frenan el tope por minuto de la ruta y
 * la cola con tope del servicio, no el recuadro.
 */
export class ReverseGeocodingRequestDto {
  @ApiProperty({ minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

/** Ver `AdminAreas` en el servicio: los niveles de cualquier país. */
export class ReverseGeocodingAdminAreasDto {
  @ApiPropertyOptional({
    description: 'Nivel 1: departamento, estado o región',
    example: 'Santa Cruz',
  })
  level1?: string;

  @ApiPropertyOptional({
    description: 'Nivel 2: provincia o condado',
    example: 'Provincia Andrés Ibáñez',
  })
  level2?: string;

  @ApiPropertyOptional({
    description: 'Nivel 3: municipio o ciudad',
    example: 'Santa Cruz de la Sierra',
  })
  level3?: string;

  @ApiPropertyOptional({
    description: 'Distrito o zona dentro del municipio',
    example: 'Equipetrol',
  })
  district?: string;
}

export class ReverseGeocodingResponseDto {
  @ApiProperty({
    description: '`false` si no se conoce ninguna calle en ese punto',
  })
  found!: boolean;

  @ApiPropertyOptional({ example: 'Calle Guapay 3861, Equipetrol' })
  line?: string;

  @ApiPropertyOptional()
  road?: string;

  @ApiPropertyOptional()
  houseNumber?: string;

  @ApiPropertyOptional()
  neighbourhood?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'País del punto, ISO 3166-1 alfa-2 en mayúsculas',
    example: 'BO',
  })
  countryCode?: string;

  @ApiPropertyOptional({ type: ReverseGeocodingAdminAreasDto })
  adminAreas?: ReverseGeocodingAdminAreasDto;

  @ApiProperty({ description: 'Atribución que exige la licencia de los datos' })
  attribution!: string;
}

/**
 * Del punto del mapa a la línea de dirección, para el alta (sin sesión).
 *
 * Tope propio, más bajo que el resto de la superficie pública: cada pedido
 * puede salir a un tercero con su propia política de uso.
 */
@ApiTags('geo')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('public/geo')
export class ReverseGeocodingController {
  constructor(private readonly geocoding: ReverseGeocodingService) {}

  @Public()
  @NotAudited('Lectura sin efecto: no escribe nada ni identifica a nadie')
  @Post('reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Nombre de la calle de un punto del mapa',
    description:
      'Sin sesión. 503 si el proveedor no responde: el alta sigue con la calle a mano. Nunca inventa una dirección.',
  })
  @ApiOkResponse({ type: ReverseGeocodingResponseDto })
  reverse(
    @Body() dto: ReverseGeocodingRequestDto,
  ): Promise<ReverseGeocodingResponseDto> {
    return this.geocoding.reverse(dto.latitude, dto.longitude);
  }
}
