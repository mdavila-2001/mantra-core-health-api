import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common';
import { PharmacyMarketplaceService } from '../services';
import {
  PublicMedicationAvailabilityDto,
  PublicMedicationPageDto,
} from '../dto';

/**
 * El mismo límite por IP que el resto de la superficie pública (P3): holgado
 * para una persona, estrecho para un raspador que quiera llevarse el catálogo
 * de precios de todas las farmacias del país.
 */
const PUBLIC_RATE_LIMIT = { default: { limit: 60, ttl: 60_000 } };

/**
 * La vitrina pública de medicamentos, bajo `/public/medications`.
 *
 * ## Por qué vive en el módulo de farmacia y no en el de comunidad
 *
 * `CommunityPublicController` sirve el buscador público, y ahí está
 * `/public/search/medications` — que devuelve vacío y **seguirá devolviendo
 * vacío**, porque su índice son perfiles públicos y un medicamento no es un
 * perfil. El catálogo vive en `pharmacy.*`, así que su cara pública vive con
 * él: mover el dato al índice de comunidad sería duplicar el catálogo entero
 * para que un buscador de personas pueda listar cajas de remedios.
 *
 * ## El orden de registro importa acá también
 *
 * `PublicProjectionsController` sirve `@Get(':slug')` bajo el mismo prefijo
 * `public`, y una ruta con parámetro captura cualquier segmento. Que
 * `/public/medications` llegue depende de que `PharmacyModule` se registre
 * antes que `ReadModelsModule` en `app.module.ts`, y hoy es así (213 contra
 * 221). Es la misma dependencia invisible que documenta
 * `CommunityPublicController`, con la misma solución: una prueba que pide la
 * ruta y falla si lo que vuelve es una proyección.
 *
 * ## Sólo consulta
 *
 * Las dos rutas son `GET` y ninguna devuelve un identificador con el que se
 * pueda pedir, reservar ni pagar nada. Es deliberado: AloVida no vende
 * medicamentos, y esta superficie no puede ser el primer escalón de una compra
 * que el producto no ofrece.
 */
@ApiTags('pharmacy-public')
@Throttle(PUBLIC_RATE_LIMIT)
@Controller()
export class PharmacyPublicController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - La vitrina pública.
   */
  constructor(private readonly service: PharmacyMarketplaceService) {}

  /** La vitrina: un medicamento por tarjeta. */
  @Public()
  @Get('public/medications')
  @ApiOperation({
    summary: 'Vitrina pública de medicamentos con disponibilidad por farmacia',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Texto a buscar en principio activo, marca o código ATC',
  })
  @ApiQuery({
    name: 'group',
    required: false,
    description:
      'Grupo terapéutico ATC de primer nivel, tal como lo lista `groups`',
  })
  @ApiQuery({
    name: 'lat',
    required: false,
    description: 'Latitud WGS84 desde donde medir distancias (va con lng)',
  })
  @ApiQuery({
    name: 'lng',
    required: false,
    description: 'Longitud WGS84 desde donde medir distancias (va con lat)',
  })
  @ApiQuery({
    name: 'radiusKm',
    required: false,
    description: 'Radio en km; sólo se aplica si viajó el origen',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope de tarjetas (máx. 60)',
  })
  @ApiOkResponse({ type: PublicMedicationPageDto })
  listMedications(
    @Query('q') q?: string,
    @Query('group') group?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('limit') limit?: string,
  ): Promise<PublicMedicationPageDto> {
    return this.service.listMedications({
      q,
      group,
      origin: origenDe(lat, lng),
      radiusKm: aDecimal(radiusKm),
      limit: aEntero(limit),
    });
  }

  /** Qué farmacias tienen ese medicamento, con precio y distancia. */
  @Public()
  @Get('public/medications/:conceptId/availability')
  @ApiOperation({
    summary: 'Farmacias que publican un medicamento, con precio y distancia',
  })
  @ApiQuery({
    name: 'lat',
    required: false,
    description: 'Latitud WGS84 del origen',
  })
  @ApiQuery({
    name: 'lng',
    required: false,
    description: 'Longitud WGS84 del origen',
  })
  @ApiQuery({ name: 'radiusKm', required: false, description: 'Radio en km' })
  @ApiOkResponse({ type: PublicMedicationAvailabilityDto })
  getAvailability(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
  ): Promise<PublicMedicationAvailabilityDto> {
    return this.service.getAvailability(conceptId, {
      origin: origenDe(lat, lng),
      radiusKm: aDecimal(radiusKm),
    });
  }
}

/**
 * El origen, o `undefined`.
 *
 * `lat` sin `lng` **no** es un 400: es una consulta sin origen. El contrato de
 * la superficie pública recorta lo que no entiende en vez de fallar, y media
 * coordenada no dice desde dónde medir nada.
 */
function origenDe(
  lat?: string,
  lng?: string,
): { lat: number; lng: number } | undefined {
  const latitud = aDecimal(lat);
  const longitud = aDecimal(lng);
  if (latitud === undefined || longitud === undefined) return undefined;
  return { lat: latitud, lng: longitud };
}

/** Decimal de un parámetro de consulta, o `undefined`. */
function aDecimal(valor?: string): number | undefined {
  if (valor === undefined) return undefined;
  const numero = Number.parseFloat(valor);
  return Number.isFinite(numero) ? numero : undefined;
}

/** Entero de un parámetro de consulta, o `undefined`. */
function aEntero(valor?: string): number | undefined {
  if (valor === undefined) return undefined;
  const numero = Number.parseInt(valor, 10);
  return Number.isFinite(numero) ? numero : undefined;
}
