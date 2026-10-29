import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  InfrastructureCatalogService,
  type InfrastructureCatalog,
} from '../services';

/** Catálogo de infraestructura: formas, funciones, reglas, atributos y datos regulatorios. */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('practice')
export class InfrastructureCatalogController {
  /**
   * @param catalog - Armado del catálogo.
   */
  constructor(private readonly catalog: InfrastructureCatalogService) {}

  /** Catálogo completo; lo lee cualquier usuario autenticado. */
  @Get('infrastructure-catalog')
  @ApiOperation({ summary: 'Catálogo de infraestructura hospitalaria' })
  get(): Promise<InfrastructureCatalog> {
    return this.catalog.get();
  }
}
