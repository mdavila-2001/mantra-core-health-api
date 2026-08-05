import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common';
import { MarketingJourneysService } from '../services';
import { TrackedLinkClickResponseDto } from '../dto';

/**
 * Redirección de enlaces rastreables (UC-50-10).
 *
 * Vive fuera de `/marketing` porque el código corto es la URL que se publica en
 * el mensaje, y va en su propio controlador para que su ruta raíz no arrastre el
 * prefijo del módulo.
 */
@ApiTags('marketing')
@Controller('r')
export class TrackedLinkRedirectController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param journeysService - Valor de journeys service requerido por la operación.
   */
  constructor(private readonly journeysService: MarketingJourneysService) {}

  /**
   * UC-50-10. Ruta pública: quien hace click es el destinatario del mensaje, no
   * un usuario con sesión. Devuelve el destino en vez de un 302 para que el
   * cliente decida cómo redirigir; el click ya quedó contado.
   */
  @Get(':code')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolver un enlace rastreable y registrar el click',
    description:
      'El contador se incrementa de forma atómica; el touchpoint sólo se registra si se identifica al miembro.',
  })
  @ApiQuery({
    name: 'memberType',
    required: false,
    enum: ['CONTACT', 'PATIENT'],
  })
  @ApiQuery({ name: 'memberRefId', required: false, format: 'uuid' })
  resolve(
    @Param('code') code: string,
    @Query('memberType') memberType?: string,
    @Query('memberRefId') memberRefId?: string,
  ): Promise<TrackedLinkClickResponseDto> {
    return this.journeysService.registerClick(code, memberType, memberRefId);
  }
}
