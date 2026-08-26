import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common';
import { CONTENT_PACKS } from './content-packs.catalog';
import { ContentPacksService } from './content-packs.service';
import {
  ApplyContentPackDto,
  ApplyContentPackResponseDto,
  ListContentPacksResponseDto,
} from './dto/content-packs.dto';

/**
 * Los paquetes de contenido, sobre `/admin/content-packs`.
 *
 * Superficie de plataforma, como `/admin/tenants`: aplicar un paquete cambia el
 * catálogo que ve **toda** la instalación, no el de una organización. Por eso
 * pide `SUPERADMIN` y no rol de tenant.
 *
 * Es la contracara del corte que hizo `SEED_CONTENT_ON_BOOT`: lo que el arranque
 * dejó de sembrar solo, se aplica desde acá cuando alguien decide que lo quiere.
 */
@ApiTags('content-packs')
@ApiBearerAuth()
@Controller('admin/content-packs')
export class ContentPacksController {
  /**
   * Inicializa el controlador.
   *
   * @param packs - Servicio que aplica los paquetes.
   */
  constructor(private readonly packs: ContentPacksService) {}

  /** El catálogo de lo aplicable. */
  @Get()
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Paquetes de contenido disponibles' })
  listar(): ListContentPacksResponseDto {
    return {
      items: CONTENT_PACKS.map((paquete) => ({
        code: paquete.code,
        name: paquete.name,
        description: paquete.description,
        approxRows: paquete.approxRows,
        requiresDemoPassword: paquete.requiresDemoPassword === true,
      })),
    };
  }

  /**
   * Aplica un paquete.
   *
   * Responde `200` y no `201` a propósito: no crea un recurso identificable, y
   * re-aplicar el mismo paquete es legítimo —devuelve cero filas nuevas—. Un
   * `201` prometería una entidad nueva en cada llamada.
   *
   * @param code - Código del paquete.
   * @param dto - Opciones de la aplicación.
   * @returns Los contadores de lo que dejó.
   */
  @Post(':code/apply')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aplicar un paquete de contenido' })
  aplicar(
    @Param('code') code: string,
    @Body() dto: ApplyContentPackDto,
  ): Promise<ApplyContentPackResponseDto> {
    return this.packs.aplicar(code, dto.demoPassword);
  }
}
