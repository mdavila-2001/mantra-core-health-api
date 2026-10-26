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
 * El recuadro de Bolivia, con un margen de ~0,5° para los municipios de borde.
 * Fuera de él no se consulta: el servicio existe para el alta boliviana, no
 * como geocodificador abierto para cualquiera.
 */
export const BOLIVIA_BOUNDS = {
  minLat: -23.5,
  maxLat: -9.2,
  minLng: -70.0,
  maxLng: -57.0,
};

/** El punto, en el cuerpo y no en la URL: es el domicilio de alguien. */
export class ReverseGeocodingRequestDto {
  @ApiProperty({
    minimum: BOLIVIA_BOUNDS.minLat,
    maximum: BOLIVIA_BOUNDS.maxLat,
  })
  @IsNumber()
  @Min(BOLIVIA_BOUNDS.minLat)
  @Max(BOLIVIA_BOUNDS.maxLat)
  latitude!: number;

  @ApiProperty({
    minimum: BOLIVIA_BOUNDS.minLng,
    maximum: BOLIVIA_BOUNDS.maxLng,
  })
  @IsNumber()
  @Min(BOLIVIA_BOUNDS.minLng)
  @Max(BOLIVIA_BOUNDS.maxLng)
  longitude!: number;
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
    summary: 'Nombre de la calle de un punto en Bolivia',
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
