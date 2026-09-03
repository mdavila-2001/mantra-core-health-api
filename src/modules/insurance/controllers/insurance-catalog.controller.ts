import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../../common';
import { InsuranceCatalogService } from '../services';
import { CarrierCatalogResponseDto } from '../dto';

/**
 * El catálogo de aseguradoras que la pantalla de registro necesita.
 *
 * ## Por qué es público
 *
 * Porque se consulta **antes** de tener cuenta: el paciente elige su seguro
 * mientras se registra. Y porque no revela nada reservado — qué compañías
 * venden salud en Bolivia y cómo se llaman sus planes es información que esas
 * mismas compañías publican.
 *
 * Va en su propia ruta, plana, y no bajo `insurance-carriers/...`: ahí el
 * segmento siguiente lo toma `:id` con `ParseUUIDPipe` y la ruta chocaría.
 */
@ApiTags('insurance-catalog')
@Controller()
export class InsuranceCatalogController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param catalogService - Servicio del catálogo público.
   */
  constructor(private readonly catalogService: InsuranceCatalogService) {}

  /**
   * Aseguradoras privadas y públicas con sus planes de salud.
   *
   * @returns El catálogo completo, ordenado por nombre.
   */
  @Get('insurance-carrier-catalog')
  @Public()
  // Es anónima: el límite por IP evita que se la use como sondeo masivo.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Catálogo público de aseguradoras y sus planes de salud',
  })
  @ApiOkResponse({ type: CarrierCatalogResponseDto })
  listCatalog(): Promise<CarrierCatalogResponseDto> {
    return this.catalogService.listHealthCatalog();
  }
}
